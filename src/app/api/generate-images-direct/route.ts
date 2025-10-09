import { NextRequest, NextResponse } from "next/server";
import { ContextPreset } from "@/components/image-generator/types";
import {
  generateMultipleImagesWithGemini,
  generateMultipleImagesWithReferences,
  getGeminiAspectRatio
} from "@/lib/gemini-api";
import { generateProductionPrompt } from "@/lib/production-prompt-engine";
import { detectEnvironment } from "@/lib/usage-limits";
import { supabaseAuthService } from "@/lib/supabase";
import { generationService } from "@/lib/supabase/generation-service";
import type { GenerationRequest, GeneratedImageData } from "@/lib/supabase/generation-service";
import { verifyAdminOverride } from "@/lib/server-admin-auth";

interface GenerationParams {
  contextPreset: ContextPreset;
  variations: number;
  quality: 'high' | 'medium' | 'low';
}

// Server-side usage limit checking
async function checkServerSideUsageLimit(request: NextRequest): Promise<{ allowed: boolean; reason?: string; environment: string; userId?: string }> {
  const environment = detectEnvironment();

  console.log('[checkServerSideUsageLimit] Starting usage limit check, environment:', environment);

  // Extract user ID from headers
  const userId = request.headers.get('x-user-id');
  const authHeader = request.headers.get('Authorization');

  console.log('[checkServerSideUsageLimit] Extracted headers:', {
    hasUserId: !!userId,
    hasAuthHeader: !!authHeader,
    userId: userId,
    userIdPrefix: userId ? userId.substring(0, 8) + '...' : 'none'
  });

  // Preview branch: unlimited generations
  if (environment === 'preview') {
    return { allowed: true, environment, userId: userId || undefined };
  }

  // Development: unlimited generations
  if (environment === 'development') {
    return { allowed: true, environment, userId: userId || undefined };
  }

  // SECURITY: Check for admin override with server-side verification
  // Admin override should ONLY be processed when explicitly requested (header === 'true')
  // AND when user is verified as admin on server-side
  const adminHeader = request.headers.get('x-admin-override');

  // Only process admin override if explicitly requested (not 'false' or missing)
  if (adminHeader === 'true') {
    console.log('[checkServerSideUsageLimit] Admin override requested for user:', userId);

    // Verify admin status server-side (NOT just trusting client header)
    const adminVerification = verifyAdminOverride(adminHeader, userId);

    if (adminVerification.isValid) {
      console.log('[checkServerSideUsageLimit] ✅ Admin override verified - unlimited access');
      return { allowed: true, reason: 'admin-override-verified', environment, userId: userId || undefined };
    } else {
      console.warn(`[checkServerSideUsageLimit] ❌ Admin override REJECTED - ${adminVerification.reason}`);
      // Continue to normal usage check (don't allow unauthorized admin override)
    }
  } else {
    console.log('[checkServerSideUsageLimit] No admin override requested (header:', adminHeader, ') - proceeding with normal limit checks');
  }

  // Check user ID for production environment (already extracted above)
  try {
    if (!userId) {
      console.warn('[checkServerSideUsageLimit] Missing x-user-id header in request for production environment');
      return { allowed: false, reason: 'Authentication required', environment };
    }

    console.log('[checkServerSideUsageLimit] Checking credits for user:', userId);
    // Check if user has sufficient credits
    const hasCredits = await supabaseAuthService.hasCredits(userId, 1);
    console.log('[checkServerSideUsageLimit] Credits check result:', hasCredits);

    if (!hasCredits) {
      console.warn('[checkServerSideUsageLimit] Insufficient credits for user:', userId);
      return {
        allowed: false,
        reason: 'Insufficient credits',
        environment,
        userId: userId
      };
    }

    console.log('[checkServerSideUsageLimit] Usage limit check passed for user:', userId);
    return { allowed: true, environment, userId: userId };
  } catch (error) {
    console.error('[checkServerSideUsageLimit] Error checking usage limits:', error);
    // Fallback to original client-side tracking for backward compatibility
    const clientUsageHeader = request.headers.get('x-usage-count');
    const maxGenerations = 5;

    if (clientUsageHeader) {
      const usageCount = parseInt(clientUsageHeader, 10);
      if (usageCount >= maxGenerations) {
        return {
          allowed: false,
          reason: `Usage limit exceeded (${usageCount}/${maxGenerations})`,
          environment
        };
      }
    }

    return { allowed: true, environment };
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    // Check usage limits first
    const usageLimitCheck = await checkServerSideUsageLimit(request);
    if (!usageLimitCheck.allowed) {
      return NextResponse.json({ 
        error: "Usage limit exceeded", 
        details: usageLimitCheck.reason,
        environment: usageLimitCheck.environment,
        limitType: 'server-side',
        maxGenerations: 5,
        suggestion: "Contact us for unlimited access or try again later"
      }, { status: 429 }); // Too Many Requests
    }

    const { productSpecs, referenceImages, generationParams } = await request.json();
    
    // DEBUG: Log what the API receives
    console.log(`[API] Received context preset: ${generationParams?.contextPreset}`);
    console.log(`[API] Full generationParams:`, generationParams);
    
    if (!productSpecs) {
      return NextResponse.json({ error: "No product specifications provided" }, { status: 400 });
    }

    if (!referenceImages || !Array.isArray(referenceImages) || referenceImages.length === 0) {
      return NextResponse.json({ error: "No reference images provided" }, { status: 400 });
    }

    const params = generationParams as GenerationParams;

    // Validate basic specs
    if (!productSpecs.productName || !productSpecs.productType) {
      return NextResponse.json({ 
        error: "Missing required product specifications. Please provide product name and type." 
      }, { status: 400 });
    }

    // Create default UI settings for prompt generation
    const defaultUISettings = {
      contextPreset: params.contextPreset,
      backgroundStyle: 'minimal' as const,
      productPosition: 'center' as const,
      lighting: 'studio_softbox' as const,
      strictMode: false,
      quality: params.quality,
      variations: 1 as 1 | 2 | 3 | 4,
      props: []
    };

    // Generate production-optimized prompt using the enhanced Production Prompt Engine
    const promptResult = generateProductionPrompt(
      productSpecs, 
      params.contextPreset, 
      defaultUISettings
    );

    console.log(`Generating 1 ${params.contextPreset} image using Google Nano Banana (Production Optimized)`);
    console.log(`Product: ${productSpecs.productName}`);
    console.log(`Reference Images: ${referenceImages.length} base64 images provided`);
    console.log(`Prompt Length: ${promptResult.metadata.promptLength} characters`);
    console.log(`Production Ready: ${promptResult.metadata.productionReady}`);
    console.log(`Optimizations Applied: ${promptResult.metadata.optimizationsApplied.join(', ')}`);
    
    // DEBUG: Log first 500 characters of the actual prompt
    console.log('=== PROMPT PREVIEW (First 500 chars) ===');
    console.log(promptResult.prompt.substring(0, 500) + '...');
    console.log('=== END PROMPT PREVIEW ===');
    
    // Log warnings and recommendations
    if (promptResult.warnings.length > 0) {
      console.warn('Prompt Warnings:', promptResult.warnings);
    }
    if (promptResult.recommendations.length > 0) {
      console.log('Prompt Recommendations:', promptResult.recommendations);
    }

    let variations;
    let referenceImagesUsed = false;
    let referenceImageProcessingError: string | null = null;

    // Use base64 reference images for multimodal generation
    console.log(`Using multimodal generation with ${referenceImages.length} base64 reference images`);
    
    try {
      // Validate base64 images
      const validImages = referenceImages.filter((img: { data: string; mimeType: string }) => 
        img.data && img.mimeType && img.mimeType.startsWith('image/')
      );
      
      if (validImages.length > 0) {
        console.log(`Using ${validImages.length} valid base64 reference images for multimodal generation`);
        
        // Generate with reference images
        variations = await generateMultipleImagesWithReferences(
          promptResult.prompt,
          validImages,
          1,
          params.contextPreset
        );
        
        referenceImagesUsed = true;
        console.log(`Generated ${variations.length} variations with reference images`);
      } else {
        throw new Error('No valid reference images found');
      }
    } catch (referenceError) {
      console.error('Reference image processing failed:', referenceError);
      referenceImageProcessingError = referenceError instanceof Error ? referenceError.message : 'Unknown error processing reference images';
      console.warn('Failed to process reference images, falling back to text-only generation');
      
      // Fallback to text-only generation
      const aspectRatio = getGeminiAspectRatio(params.contextPreset);
      const geminiRequest = {
        prompt: `${promptResult.prompt}

🚨 FALLBACK MODE: Reference images could not be processed. Generating from description only with enhanced constraints for quality assurance.`,
        aspectRatio: aspectRatio,
      };

      variations = await generateMultipleImagesWithGemini(
        geminiRequest,
        1,
        params.contextPreset
      );
      
      referenceImagesUsed = false;
      console.log(`Generated ${variations.length} variations using text-only fallback`);
    }

    // SUPABASE STORAGE: Save generated images if user is authenticated
    let supabaseResults: any[] = [];
    let shouldSaveToSupabase = false;
    let isUserAuthenticated = false;

    if (usageLimitCheck.userId) {
      console.log('[Direct API] User authenticated, preparing to save images to Supabase Storage:', {
        userId: usageLimitCheck.userId,
        imageCount: variations.length,
        environment: usageLimitCheck.environment
      });

      shouldSaveToSupabase = true;
      isUserAuthenticated = true;

      try {
        // Convert API variations to GeneratedImageData format
        const generatedImageData: GeneratedImageData[] = variations.map((variation: any) => ({
          url: variation.url,
          prompt: promptResult.prompt
        }));

        // Create generation request for Supabase Storage saving
        const generationRequest: GenerationRequest = {
          userId: usageLimitCheck.userId,
          projectId: null, // null for direct generation (not tied to a project)
          prompt: promptResult.prompt,
          contextPreset: params.contextPreset,
          variations: params.variations,
          quality: params.quality
        };

        console.log('[Direct API] Calling generationService.processGeneration...');
        const generationResult = await generationService.processGeneration(
          generationRequest,
          generatedImageData
        );

        supabaseResults = [{
          success: true,
          visualId: generationResult.visualId,
          projectId: generationRequest.projectId || undefined
        }];

        console.log('[Direct API] Supabase Storage save completed:', {
          results: supabaseResults.map(r => ({
            success: r.success,
            visualId: r.visualId,
            projectId: r.projectId
          }))
        });

        // Update variations with generation metadata
        supabaseResults.forEach((result, index) => {
          const variation = variations[index];
          if (result.success && variation) {
            console.log(`[Direct API] Updating variation ${index} with generation metadata:`, {
              visualId: result.visualId,
              projectId: result.projectId
            });

            // Add generation metadata
            (variation as any).visualId = result.visualId;
            (variation as any).projectId = result.projectId;
            (variation as any).savedToSupabase = true;
          } else if (!result.success && variation) {
            console.error(`[Direct API] Failed to save variation ${index} to Supabase Storage`);
            (variation as any).savedToSupabase = false;
          }
        });

      } catch (supabaseError) {
        console.error('[Direct API] Failed to save images to Supabase Storage:', {
          error: supabaseError instanceof Error ? supabaseError.message : 'Unknown Supabase error',
          stack: supabaseError instanceof Error ? supabaseError.stack : undefined,
          userId: usageLimitCheck.userId,
          environment: usageLimitCheck.environment,
          imageCount: variations.length
        });

        // Don't fail the entire request if Supabase Storage saving fails
        // Just log the error and continue with external URLs
        supabaseResults = [];
        shouldSaveToSupabase = false;

        // Mark all variations as not saved to Supabase
        variations.forEach((variation: any) => {
          variation.savedToSupabase = false;
          variation.supabaseError = supabaseError instanceof Error ? supabaseError.message : 'Unknown Supabase error';
        });
      }
    } else {
      console.log('[Direct API] No user authentication found, skipping Supabase Storage save:', {
        hasUserId: !!usageLimitCheck.userId,
        environment: usageLimitCheck.environment
      });
    }

    // CREDIT DEDUCTION: Update subscription after successful generation
    if (usageLimitCheck.userId && variations.length > 0) {
      try {
        console.log('[Direct API] Deducting credit for user:', usageLimitCheck.userId);
        const { getUserSubscription } = await import('@/lib/supabase/subscriptions');
        const { createAdminClient } = await import('@/lib/supabase/server');

        const subscription = await getUserSubscription(usageLimitCheck.userId);

        if (subscription) {
          console.log('[Direct API] Current subscription:', {
            id: subscription.id,
            generationsUsed: subscription.usage.generationsUsed,
            generationsLimit: subscription.usage.generationsLimit
          });

          const supabaseAdmin = await createAdminClient();
          const { error: updateError } = await (supabaseAdmin as any)
            .from('subscriptions')
            .update({ generations_used: subscription.usage.generationsUsed + 1 })
            .eq('id', subscription.id);

          if (updateError) {
            console.error('[Direct API] Failed to deduct credit:', updateError);
          } else {
            console.log('[Direct API] ✅ Credit deducted successfully. New count:', subscription.usage.generationsUsed + 1, '/', subscription.usage.generationsLimit);
          }
        } else {
          console.warn('[Direct API] No subscription found for credit deduction');
        }
      } catch (creditError) {
        console.error('[Direct API] Error during credit deduction:', creditError);
        // Don't fail the request if credit deduction fails
      }
    }

    const result = {
      productConfigId: `direct-generation-${Date.now()}`,
      productName: productSpecs.productName,
      contextPreset: params.contextPreset,
      variations,
      usageLimitInfo: {
        environment: usageLimitCheck.environment,
        limitEnforced: usageLimitCheck.environment === 'production',
        serverSideValidation: true,
      },
      supabaseIntegration: {
        userAuthenticated: isUserAuthenticated,
        shouldSaveToSupabase,
        savedToSupabase: supabaseResults.length > 0 && supabaseResults.some(r => r.success),
        savedCount: supabaseResults.filter(r => r.success).length,
        totalImages: variations.length,
        errors: supabaseResults.filter(r => !r.success).map(r => r.error)
      },
      generationDetails: {
        sourceImageCount: referenceImages.length,
        profileSource: 'production-prompt-engine-v2',
        prompt: promptResult.prompt,
        promptLength: promptResult.metadata.promptLength,
        model: 'google-nano-banana-optimized',
        engineVersion: promptResult.metadata.engineVersion,
        generationMethod: referenceImagesUsed ? 'multimodal-image-to-image' : 'production-text-to-image',
        productIntelligence: promptResult.metadata.productIntelligence,
        qualityLevel: promptResult.metadata.qualityLevel,
        productionReady: promptResult.metadata.productionReady,
        optimizationsApplied: promptResult.metadata.optimizationsApplied,
        constraintStats: promptResult.metadata.constraintStats,
        placementAnalysis: promptResult.metadata.placementAnalysis,
        validationResults: promptResult.metadata.validationResults,
        warnings: promptResult.warnings,
        recommendations: promptResult.recommendations,
        referenceImagesUsed,
        referenceImageProcessingError,
        userSpecifications: {
          productType: productSpecs.productType,
          materials: productSpecs.materials,
          dimensions: productSpecs.dimensions,
          additionalSpecs: productSpecs.additionalSpecs
        },
        enhancedFeatures: {
          smartPlacement: true,
          intelligentPlacementDetection: true,
          enhancedConstraintSystem: true,
          humanElementPrevention: true,
          irrelevantObjectElimination: true,
          artifactPrevention: true,
          materialIntelligence: true,
          contextualLighting: true,
          professionalComposition: true,
          productionQualityAssurance: true,
          zeroToleranceConstraints: true
        }
      }
    };

    return NextResponse.json({ result });

  } catch (error) {
    console.error("Direct generation error:", error);
    
    let userError = "Unknown error occurred during generation";
    const statusCode = 500;
    
    if (error instanceof Error) {
      userError = error.message;
    }
    
    return NextResponse.json({
      error: userError,
      approach: "production-optimized-prompt-engine-generation",
      engineVersion: "2.0.0-production",
      model: "google-nano-banana"
    }, { status: statusCode });
  }
}