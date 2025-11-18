/**
 * Advanced Image Editing API Endpoint
 *
 * POST /api/edit-image-advanced
 *
 * Handles post-generation image editing with multiple parameters:
 * - Aspect ratio transformation
 * - View angle changes
 * - Lighting adjustments
 * - Style modifications
 *
 * Features:
 * - Authentication & authorization
 * - Credits checking and deduction
 * - Rate limiting
 * - Version tracking
 * - Edit history management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { imageEditService } from '@/lib/supabase/image-edit-service';
import type { EditParams } from '@/lib/supabase/image-edit-service';
import type { Database, DatabaseVisual } from '@/lib/supabase/types';
import { isAdminUser } from '@/lib/server-admin-auth';

interface EditImageRequest {
  visualId: string;           // Original visual ID
  editParams: EditParams;     // Edit parameters
  variations: number;         // 1-4 variations
  saveHistory: boolean;       // Whether to save in edit history
  parentEditId?: string;      // Optional: parent edit for version chain
}

export async function POST(request: NextRequest) {
  try {
    console.log('[edit-image-advanced] Received edit request');

    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[edit-image-advanced] Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    console.log('[edit-image-advanced] User authenticated:', user.id);

    // Parse request body
    const body: EditImageRequest = await request.json();
    const { visualId, editParams, variations = 1, saveHistory = true, parentEditId } = body;

    // Validate required parameters
    if (!visualId || !editParams) {
      return NextResponse.json(
        { error: 'Missing required parameters: visualId, editParams' },
        { status: 400 }
      );
    }

    // Validate variations count
    const variationCount = Math.min(Math.max(variations, 1), 4);
    if (variationCount !== variations) {
      console.warn('[edit-image-advanced] Variations clamped to:', variationCount);
    }

    // Validate product images if provided
    if (editParams.productImages) {
      if (editParams.productImages.length > 5) {
        return NextResponse.json(
          { error: 'Too many product images. Maximum 5 products can be added at once.' },
          { status: 400 }
        );
      }

      // Validate each product image
      for (let i = 0; i < editParams.productImages.length; i++) {
        const product = editParams.productImages[i];
        if (!product.data || !product.mimeType) {
          return NextResponse.json(
            { error: `Product image ${i + 1} is missing required data or mimeType` },
            { status: 400 }
          );
        }

        // Check if mimeType is valid
        const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validMimeTypes.includes(product.mimeType.toLowerCase())) {
          return NextResponse.json(
            { error: `Product image ${i + 1} has invalid format. Supported: JPEG, PNG, WebP` },
            { status: 400 }
          );
        }
      }

      console.log(`[edit-image-advanced] Product images validated: ${editParams.productImages.length} product(s)`);
    }

    console.log('[edit-image-advanced] Edit request validated:', {
      visualId,
      variations: variationCount,
      editParams: {
        ...editParams,
        productImages: editParams.productImages?.length ? `${editParams.productImages.length} product(s)` : 'none',
        customInstructions: editParams.customInstructions ? 'provided' : 'none'
      },
    });

    // Check if user is admin (automatic unlimited variations)
    const isAdmin = isAdminUser(user.id);

    if (isAdmin) {
      console.log('[edit-image-advanced] ✅ Admin user detected - unlimited variations enabled');
    }

    // Initialize variables for subscription and credits
    let subscription: Database['public']['Tables']['subscriptions']['Row'] | null = null;
    let creditsNeeded = 0;
    let creditsRemaining = 0;

    // Only check subscription and credits if NOT admin user
    if (!isAdmin) {
      // Check subscription and credits
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as {
          data: Database['public']['Tables']['subscriptions']['Row'] | null;
          error: any
        };

      subscription = subData;

      if (subError) {
        console.error('[edit-image-advanced] Error fetching subscription:', subError);
        return NextResponse.json(
          { error: 'Failed to verify subscription' },
          { status: 500 }
        );
      }

      if (!subscription) {
        return NextResponse.json({
          error: 'No active subscription',
          message: 'Please activate a subscription plan to edit images.',
          needsUpgrade: true
        }, { status: 403 });
      }

      // Check if user has sufficient credits
      creditsNeeded = variationCount; // 1 credit per variation
      creditsRemaining = subscription.generations_limit - subscription.generations_used;

      console.log('[edit-image-advanced] Credits check:', {
        needed: creditsNeeded,
        remaining: creditsRemaining,
        limit: subscription.generations_limit,
        used: subscription.generations_used,
      });

      if (creditsRemaining < creditsNeeded) {
        return NextResponse.json({
          error: 'Insufficient credits',
          message: `You need ${creditsNeeded} credits but only have ${creditsRemaining} remaining. Please upgrade your plan.`,
          needsUpgrade: true,
          creditsNeeded,
          creditsRemaining,
        }, { status: 403 });
      }
    } else {
      console.log('[edit-image-advanced] Admin user - skipping credit checks');
    }

    // Get original visual to fetch image URL
    type VisualQueryResult = {
      data: DatabaseVisual | null;
      error: any;
    };

    const visualQuery: VisualQueryResult = await supabase
      .from('visuals')
      .select('*')
      .eq('id', visualId)
      .eq('user_id', user.id)
      .single() as any;

    if (visualQuery.error || !visualQuery.data) {
      console.error('[edit-image-advanced] Visual not found:', visualQuery.error);
      return NextResponse.json(
        { error: 'Visual not found or unauthorized' },
        { status: 404 }
      );
    }

    const visual = visualQuery.data;
    const originalImageUrl = visual.original_url;
    const visualMetadata = visual.metadata as Record<string, any> | null;
    const productName = visualMetadata?.product?.name || 'product';

    console.log('[edit-image-advanced] Original visual found:', {
      id: visual.id,
      visualId: visual.visual_id,
      imageUrl: originalImageUrl,
      productName,
    });

    // Process edit request
    console.log('[edit-image-advanced] Starting edit processing...');
    const editResults = await imageEditService.processEdit({
      userId: user.id,
      originalVisualId: visual.visual_id, // Use the visual_id field for database relationships
      originalImageUrl,
      editParams,
      variations: variationCount,
      parentEditId,
      productName,
    });

    console.log('[edit-image-advanced] Edit processing completed:', {
      generated: editResults.length,
      requested: variationCount,
    });

    // Deduct credits after successful generation (only if NOT admin user)
    const creditsToDeduct = editResults.length; // 1 credit per successful edit
    let newCreditsRemaining = creditsRemaining;

    if (!isAdmin && subscription) {
      try {
        console.log('[edit-image-advanced] Deducting credits:', creditsToDeduct);

        const supabaseAdmin = await createAdminClient();
        const { data: updatedSub, error: updateError } = await (supabaseAdmin as any)
          .from('subscriptions')
          .update({
            generations_used: subscription.generations_used + creditsToDeduct
          })
          .eq('id', subscription.id)
          .select()
          .single();

        if (updateError) {
          console.error('[edit-image-advanced] Failed to deduct credits:', updateError);
          // Don't fail the request, but log the error
        } else {
          console.log('[edit-image-advanced] Credits deducted successfully. New usage:', updatedSub.generations_used);
          newCreditsRemaining = creditsRemaining - creditsToDeduct;
        }
      } catch (creditError) {
        console.error('[edit-image-advanced] Error during credit deduction:', creditError);
        // Don't fail the request
      }
    } else if (isAdmin) {
      console.log('[edit-image-advanced] Admin user - skipping credit deduction');
      newCreditsRemaining = 999999; // Show unlimited for admin
    }

    // Track edit event
    try {
      const supabaseAdmin = await createAdminClient();
      await (supabaseAdmin
        .from('usage_records') as any)
        .insert({
          user_id: user.id,
          type: 'edit',
          visual_id: visualId,
          credits_used: isAdmin ? 0 : creditsToDeduct,
          metadata: {
            editParams,
            variations: variationCount,
            successfulEdits: editResults.length,
            isAdminUser: isAdmin,
          },
        });
    } catch (trackError) {
      console.error('[edit-image-advanced] Failed to track usage:', trackError);
      // Don't fail the request
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      edits: editResults.map(edit => ({
        editId: edit.editId,
        editedImageUrl: edit.editedImageUrl,
        thumbnailUrl: edit.thumbnailUrl,
        editParams: edit.editParams,
        metadata: edit.metadata,
        versionNumber: edit.versionNumber,
      })),
      creditsUsed: creditsToDeduct,
      creditsRemaining: newCreditsRemaining,
      originalVisualId: visualId,
      message: `Successfully generated ${editResults.length} edit variation${editResults.length > 1 ? 's' : ''}`,
    });

  } catch (error) {
    console.error('[edit-image-advanced] Error processing edit request:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = errorMessage.includes('Unauthorized') ? 403 : 500;

    return NextResponse.json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    }, { status: statusCode });
  }
}

/**
 * GET /api/edit-image-advanced?visualId=xxx
 *
 * Get edit history for a visual
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get visualId from query params
    const { searchParams } = new URL(request.url);
    const visualId = searchParams.get('visualId');

    if (!visualId) {
      return NextResponse.json(
        { error: 'Missing required parameter: visualId' },
        { status: 400 }
      );
    }

    // Get edit history
    const edits = await imageEditService.getEditHistory(visualId, user.id);

    return NextResponse.json({
      success: true,
      visualId,
      edits,
      totalEdits: edits.length,
    });

  } catch (error) {
    console.error('[edit-image-advanced] Error fetching edit history:', error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/edit-image-advanced?editId=xxx
 *
 * Delete an edit
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get editId from query params
    const { searchParams } = new URL(request.url);
    const editId = searchParams.get('editId');

    if (!editId) {
      return NextResponse.json(
        { error: 'Missing required parameter: editId' },
        { status: 400 }
      );
    }

    // Delete edit
    await imageEditService.deleteEdit(editId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Edit deleted successfully',
      editId,
    });

  } catch (error) {
    console.error('[edit-image-advanced] Error deleting edit:', error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}
