/**
 * Image Edit Service
 *
 * Handles post-generation image editing operations including:
 * - Processing edit requests with Gemini API
 * - Managing edit versions and history
 * - Uploading edited images to Supabase Storage
 * - Tracking edit metadata and analytics
 */

import { supabaseAdmin } from './config';
import { supabaseAdminStorageService } from './admin-storage';
import { generateImageWithGemini, base64ToDataUrl } from '@/lib/gemini-api';
import { buildCameraAnglePrompt, mapLegacyAngle } from '@/lib/enhanced-angle-specifications';
import type { Database } from './types';

// Type definitions
export interface EditParams {
  aspectRatio: '16:9' | '1:1' | '9:16' | '4:3' | '3:2';
  /**
   * Camera view angle for the edit
   * - frontal: Direct frontal elevation
   * - 45-degree: Classic three-quarter angle
   * - top-down: Flat-lay overhead perspective
   * - perspective: Professional 3/4 elevated view (maps to enhanced '3-4-view' specification)
   * - custom: Uses customPrompt for camera angle
   *
   * Note: View angles now use enhanced professional photography specifications
   * with precise technical measurements, multi-layered instructions, and constraints.
   * See /src/lib/enhanced-angle-specifications.ts for full details.
   */
  viewAngle: 'frontal' | '45-degree' | 'top-down' | 'perspective' | 'custom';
  lighting: 'soft' | 'dramatic' | 'natural' | 'studio' | 'golden-hour' | 'custom';
  style: 'photorealistic' | 'minimalist' | 'artistic' | 'vintage' | 'modern' | 'custom';
  imageSize?: '1K' | '2K' | '4K'; // Resolution selection for Gemini 3 Pro Image Preview
  customPrompt?: string;
  /**
   * Additional custom instructions from user
   * These will be integrated into the prompt as tertiary instructions
   */
  customInstructions?: string;
  /**
   * Reference images for products to add to the scene
   * Array of base64 encoded images with optional descriptions
   */
  productImages?: Array<{
    data: string; // base64 encoded image
    mimeType: string;
    description?: string; // Optional description of what to do with this product
  }>;
}

export interface EditMetadata {
  model: string;
  timestamp: string;
  processingTime: number;
  creditsUsed: number;
  variation: number;
  originalDimensions: { width: number; height: number };
  editedDimensions: { width: number; height: number };
}

export type ImageEdit = Database['public']['Tables']['image_edits']['Row'];

export interface EditRequest {
  userId: string;
  originalVisualId: string;
  originalImageUrl: string;
  editParams: EditParams;
  variations: number;
  parentEditId?: string;
  productName?: string;
}

export interface EditResult {
  editId: string;
  editedImageUrl: string;
  thumbnailUrl: string | null;
  editParams: EditParams;
  metadata: EditMetadata;
  versionNumber: number;
}

class ImageEditService {
  /**
   * Process an image edit request with multiple variations
   */
  async processEdit(request: EditRequest): Promise<EditResult[]> {
    const results: EditResult[] = [];
    const startTime = Date.now();

    console.log('[ImageEditService] Processing edit request:', {
      userId: request.userId,
      visualId: request.originalVisualId,
      variations: request.variations,
      editParams: request.editParams,
    });

    // Validate request
    this.validateEditRequest(request);

    // Get original visual data
    const originalVisual = await this.getOriginalVisual(request.originalVisualId);
    if (!originalVisual) {
      throw new Error('Original visual not found');
    }

    // Verify ownership
    if (originalVisual.user_id !== request.userId) {
      throw new Error('Unauthorized: You do not own this visual');
    }

    // Determine version number
    const versionNumber = request.parentEditId
      ? await this.getNextVersionNumber(request.parentEditId)
      : 1;

    console.log('[ImageEditService] Starting generation of', request.variations, 'variations');

    // Build edit prompt
    const editPrompt = this.buildEditPrompt(
      request.editParams,
      originalVisual.metadata || {},
      request.productName
    );

    // Generate variations
    for (let i = 0; i < request.variations; i++) {
      try {
        console.log(`[ImageEditService] Generating variation ${i + 1}/${request.variations}`);

        const variationPrompt = `${editPrompt} (variation ${i + 1})`;

        // Fetch original image as base64
        const imageBase64 = await this.fetchImageAsBase64(request.originalImageUrl);

        // Prepare reference images array
        // Always start with the original image as the primary reference
        const referenceImages: Array<{ data: string; mimeType: string }> = [{
          data: imageBase64,
          mimeType: 'image/jpeg'
        }];

        // Add any additional product images if provided
        if (request.editParams.productImages && request.editParams.productImages.length > 0) {
          console.log(`[ImageEditService] Adding ${request.editParams.productImages.length} product reference image(s)`);
          request.editParams.productImages.forEach((product, idx) => {
            referenceImages.push({
              data: product.data,
              mimeType: product.mimeType
            });
            console.log(`[ImageEditService] Product ${idx + 1} added to references`);
          });
        }

        // Call Gemini API with all reference images
        const geminiResponse = await generateImageWithGemini({
          prompt: variationPrompt,
          aspectRatio: this.mapAspectRatio(request.editParams.aspectRatio),
          imageSize: request.editParams.imageSize || '2K', // Pass resolution selection, default to 2K
          referenceImages
        });

        if (!geminiResponse.success || !geminiResponse.data?.imageData) {
          throw new Error('Failed to generate edited image from Gemini API');
        }

        console.log('[ImageEditService] Gemini API generation successful');

        // Generate unique edit ID
        const editId = `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_v${versionNumber}`;

        // Convert to data URL for upload
        const dataUrl = base64ToDataUrl(geminiResponse.data.imageData);

        // Upload to Supabase Storage
        console.log('[ImageEditService] Uploading to Supabase Storage');
        const uploadResult = await supabaseAdminStorageService.uploadImageFromUrl(
          request.userId,
          null, // No project ID for edits
          editId,
          dataUrl,
          {
            generateThumbnail: true,
            metadata: {
              originalVisualId: request.originalVisualId,
              editParams: JSON.stringify(request.editParams),
              variation: (i + 1).toString(),
            }
          }
        );

        console.log('[ImageEditService] Upload successful:', uploadResult.originalUrl);

        // Create edit record in database
        const editMetadata: EditMetadata = {
          model: 'gemini-3-pro-image-preview',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          creditsUsed: 1, // 1 credit per edit
          variation: i + 1,
          originalDimensions: this.extractDimensions(originalVisual) || { width: 1024, height: 1024 },
          editedDimensions: this.getEditedDimensions(request.editParams.aspectRatio),
        };

        const { data: editRecord, error } = await (supabaseAdmin as any)
          .from('image_edits')
          .insert({
            edit_id: editId,
            user_id: request.userId,
            original_visual_id: request.originalVisualId,
            parent_edit_id: request.parentEditId || null,
            edited_image_url: uploadResult.originalUrl,
            thumbnail_url: uploadResult.thumbnailUrl,
            edit_params: request.editParams,
            prompt: variationPrompt,
            metadata: editMetadata,
            version_number: versionNumber,
            is_latest_version: true,
          })
          .select()
          .single();

        if (error) {
          console.error('[ImageEditService] Database insert error:', error);
          throw new Error(`Failed to create edit record: ${error.message}`);
        }

        console.log('[ImageEditService] Edit record created:', editRecord.edit_id);

        // Update original visual edit counts (will be done by trigger, but we can verify)
        // The trigger maintain_visual_edit_count will handle this automatically

        results.push({
          editId: editRecord.edit_id,
          editedImageUrl: uploadResult.originalUrl,
          thumbnailUrl: uploadResult.thumbnailUrl || null,
          editParams: request.editParams,
          metadata: editMetadata,
          versionNumber,
        });

        console.log(`[ImageEditService] Variation ${i + 1} completed successfully`);

      } catch (error) {
        console.error(`[ImageEditService] Failed to generate variation ${i + 1}:`, error);
        // Continue with other variations instead of failing completely
      }
    }

    console.log(`[ImageEditService] Completed: Generated ${results.length}/${request.variations} edit variations`);

    if (results.length === 0) {
      throw new Error('Failed to generate any edit variations');
    }

    return results;
  }

  /**
   * Build detailed edit prompt from parameters
   */
  private buildEditPrompt(
    params: EditParams,
    originalMetadata: any,
    productName?: string
  ): string {
    const productInfo = productName ||
                       originalMetadata?.product?.name ||
                       originalMetadata?.prompt?.split(' ')?.[0] ||
                       'the product';

    let prompt = '';

    // CAMERA ANGLE - Primary directive (highest priority)
    if (params.viewAngle && params.viewAngle !== 'custom') {
      const mappedAngle = mapLegacyAngle(params.viewAngle);
      const enhancedAngleInstructions = buildCameraAnglePrompt(mappedAngle);

      prompt += `CRITICAL: The camera angle is non-negotiable and takes absolute priority over all other requirements.\n\n`;
      prompt += enhancedAngleInstructions + '\n\n';
    } else if (params.viewAngle === 'custom' && params.customPrompt) {
      prompt += `Camera positioning: ${params.customPrompt}\n\n`;
    }

    // Core transformation instructions (narrative format)
    prompt += `Transform the existing image of ${productInfo} while maintaining its fundamental identity, materials, and design integrity. `;

    // Aspect ratio recomposition
    prompt += `Recompose the scene for ${params.aspectRatio} aspect ratio`;
    const aspectRatioContext: Record<string, string> = {
      '16:9': ' using cinematic wide framing suitable for hero presentations',
      '9:16': ' with vertical composition optimized for mobile and story formats',
      '1:1': ' in a balanced square format for social media',
      '4:3': ' using classic photography proportions',
      '3:2': ' following standard DSLR sensor dimensions'
    };
    prompt += aspectRatioContext[params.aspectRatio] || '';
    prompt += '. ';

    // Lighting setup (using professional photography terminology)
    const lightingSetups: Record<string, string> = {
      'soft': 'Establish soft diffused lighting with large modifiers creating gentle wrap-around illumination, minimal contrast shadows, and even tonal gradation across surfaces. Color temperature around 5500K for neutral white balance',
      'dramatic': 'Execute high-contrast lighting with directional hard light sources creating pronounced shadow definitions and specular highlights. Use lighting ratios of 8:1 or higher for maximum dimensional separation and visual impact',
      'natural': 'Simulate window-lit ambiance with large area diffusion mimicking north-facing daylight. Subtle ambient fill maintains shadow detail while preserving the authentic feel of natural interior lighting',
      'studio': 'Deploy professional multi-light configuration with key, fill, rim, and background lights. Employ softboxes and reflectors for controlled commercial photography illumination with precise shadow placement and highlight control',
      'golden-hour': 'Replicate golden hour characteristics with warm color temperature (3000-3500K), low-angle directional light, and soft atmospheric diffusion creating amber-toned highlights and elongated shadows',
      'custom': params.customPrompt || 'Professional lighting configuration enhancing commercial appeal'
    };
    prompt += lightingSetups[params.lighting] + '. ';

    // Visual style and treatment
    const styleDirectives: Record<string, string> = {
      'photorealistic': 'Maintain absolute photorealism with accurate material physics, natural color science, and authentic texture representation matching professional product photography standards',
      'minimalist': 'Apply minimalist visual language with simplified compositional elements, restrained color palette, and emphasis on negative space and geometric clarity',
      'artistic': 'Introduce creative interpretation through enhanced color grading, stylized compositional techniques, and artistic visual treatment while preserving product recognizability',
      'vintage': 'Implement vintage aesthetic using period-appropriate color temperature shifts, subtle grain structure, reduced saturation characteristic of aged film stocks, and classic photography tonality',
      'modern': 'Execute contemporary visual treatment with saturated color profiles, clean bold compositions, and current commercial photography trends',
      'custom': params.customPrompt || 'Professional styling enhancing brand presentation'
    };
    prompt += styleDirectives[params.style] + '. ';

    // Core quality requirements
    prompt += `The product must remain the primary focal point with tack-sharp focus. Preserve authentic material characteristics, accurate color reproduction, and commercial photography quality throughout the transformation.`;

    // PRODUCT ADDITION SECTION (when products are being added)
    if (params.productImages && params.productImages.length > 0) {
      prompt += `\n\nPRODUCT INTEGRATION DIRECTIVE:\n\n`;
      prompt += `You are performing an additive composite operation: integrating ${params.productImages.length} additional product(s) into the existing scene. This is critically important - you must preserve every existing element in the original image without exception.\n\n`;

      prompt += `Non-negotiable preservation requirement: All products, objects, furniture, and environmental elements currently visible in the reference image must remain completely intact and unmodified. You are exclusively adding new elements to unoccupied areas of the composition.\n\n`;

      prompt += `Integration specifications:\n`;
      prompt += `Position the new product(s) within available negative space in the scene - empty floor areas, unoccupied surfaces, or background regions. `;
      prompt += `Match the established lighting direction, color temperature, and contrast ratios precisely across all elements. `;
      prompt += `Generate appropriate cast shadows and reflections consistent with the scene's existing light sources. `;
      prompt += `Maintain identical camera perspective and depth of field characteristics for seamless integration. `;
      prompt += `Scale the new products proportionally relative to existing objects, ensuring believable spatial relationships. `;
      prompt += `If composition space is limited, reduce scale of new elements or position them in periphery rather than obscuring existing products.\n\n`;

      if (params.productImages.length > 0) {
        prompt += `Products to integrate:\n`;
        params.productImages.forEach((product, index) => {
          const placement = product.description || 'Position naturally within available composition space maintaining scene cohesion';
          prompt += `${index + 1}. ${placement}\n`;
        });
        prompt += `\n`;
      }

      prompt += `Critical verification before generation: Confirm that every element from the original reference image appears in your output plus the ${params.productImages.length} newly added product(s). Any missing original elements constitute a failed output. This is additive integration, not element replacement.`;
    }

    // CUSTOM INSTRUCTIONS (user-provided additional guidance)
    if (params.customInstructions && params.customInstructions.trim()) {
      prompt += `\n\nAdditional creative direction: ${params.customInstructions.trim()}\n\n`;
      prompt += `Apply these instructions while maintaining camera angle specifications, aspect ratio recomposition, lighting setup, and visual style directives`;
      if (params.productImages && params.productImages.length > 0) {
        prompt += `, and critically, the preservation of all existing scene elements during product integration`;
      }
      prompt += `.`;
    }

    // FINAL CAMERA ANGLE REINFORCEMENT (recency bias for most critical requirement)
    if (params.viewAngle && params.viewAngle !== 'custom') {
      const mappedAngle = mapLegacyAngle(params.viewAngle);
      prompt += `\n\nFinal confirmation: Execute this transformation using the ${mappedAngle} camera positioning specified at the beginning. This camera angle directive supersedes all other requirements if any conflict exists.`;
    }

    return prompt;
  }

  /**
   * Map aspect ratio to Gemini API format
   */
  private mapAspectRatio(aspectRatio: string): string {
    const mapping: Record<string, string> = {
      '16:9': '16:9',
      '1:1': '1:1',
      '9:16': '9:16',
      '4:3': '4:3',
      '3:2': '3:2',
    };
    return mapping[aspectRatio] || '1:1';
  }

  /**
   * Get dimensions for edited image based on aspect ratio
   */
  private getEditedDimensions(aspectRatio: string): { width: number; height: number } {
    const dimensions: Record<string, { width: number; height: number }> = {
      '16:9': { width: 1536, height: 864 },
      '1:1': { width: 1024, height: 1024 },
      '9:16': { width: 864, height: 1536 },
      '4:3': { width: 1280, height: 960 },
      '3:2': { width: 1536, height: 1024 },
    };
    return dimensions[aspectRatio] || { width: 1024, height: 1024 };
  }

  /**
   * Fetch image as base64 string
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
      // If already a data URL, extract base64
      if (imageUrl.startsWith('data:')) {
        const base64Part = imageUrl.split(',')[1];
        if (!base64Part) {
          throw new Error('Invalid data URL format');
        }
        return base64Part;
      }

      // Fetch from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch (error) {
      console.error('[ImageEditService] Error fetching image as base64:', error);
      throw new Error(`Failed to fetch image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get original visual data
   */
  private async getOriginalVisual(visualId: string): Promise<any> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('visuals')
        .select('*')
        .eq('visual_id', visualId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch original visual: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('[ImageEditService] Error fetching original visual:', error);
      throw error;
    }
  }

  /**
   * Extract dimensions from visual metadata
   */
  private extractDimensions(visual: any): { width: number; height: number } | null {
    try {
      if (visual.metadata?.dimensions) {
        return visual.metadata.dimensions;
      }
      // Try to extract from other metadata fields
      if (visual.metadata?.size) {
        const [width, height] = visual.metadata.size.split('x').map(Number);
        if (width && height) {
          return { width, height };
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get next version number for edit chain
   */
  private async getNextVersionNumber(parentEditId: string): Promise<number> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('image_edits')
        .select('version_number')
        .eq('id', parentEditId)
        .single();

      if (error) {
        console.error('[ImageEditService] Failed to get parent version:', error);
        return 1;
      }

      return (data.version_number || 0) + 1;
    } catch (error) {
      console.error('[ImageEditService] Error getting next version number:', error);
      return 1;
    }
  }

  /**
   * Validate edit request parameters
   */
  private validateEditRequest(request: EditRequest): void {
    const validAspectRatios = ['16:9', '1:1', '9:16', '4:3', '3:2'];
    if (!validAspectRatios.includes(request.editParams.aspectRatio)) {
      throw new Error(`Invalid aspect ratio: ${request.editParams.aspectRatio}`);
    }

    const validViewAngles = ['frontal', '45-degree', 'top-down', 'perspective', 'custom'];
    if (!validViewAngles.includes(request.editParams.viewAngle)) {
      throw new Error(`Invalid view angle: ${request.editParams.viewAngle}`);
    }

    const validLighting = ['soft', 'dramatic', 'natural', 'studio', 'golden-hour', 'custom'];
    if (!validLighting.includes(request.editParams.lighting)) {
      throw new Error(`Invalid lighting: ${request.editParams.lighting}`);
    }

    const validStyles = ['photorealistic', 'minimalist', 'artistic', 'vintage', 'modern', 'custom'];
    if (!validStyles.includes(request.editParams.style)) {
      throw new Error(`Invalid style: ${request.editParams.style}`);
    }

    if (request.variations < 1 || request.variations > 4) {
      throw new Error('Variations must be between 1 and 4');
    }

    if (!request.userId || !request.originalVisualId || !request.originalImageUrl) {
      throw new Error('Missing required parameters');
    }
  }

  /**
   * Get edit history for a visual
   */
  async getEditHistory(visualId: string, userId: string): Promise<ImageEdit[]> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('image_edits')
        .select('*')
        .eq('original_visual_id', visualId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch edit history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('[ImageEditService] Error getting edit history:', error);
      throw error;
    }
  }

  /**
   * Get a single edit by ID
   */
  async getEdit(editId: string, userId: string): Promise<ImageEdit | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('image_edits')
        .select('*')
        .eq('edit_id', editId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch edit: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('[ImageEditService] Error getting edit:', error);
      throw error;
    }
  }

  /**
   * Delete an edit and its associated files
   */
  async deleteEdit(editId: string, userId: string): Promise<void> {
    try {
      const { data: edit, error: fetchError } = await (supabaseAdmin as any)
        .from('image_edits')
        .select('*')
        .eq('edit_id', editId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !edit) {
        throw new Error('Edit not found or unauthorized');
      }

      // Delete files from storage
      try {
        // Extract storage path from URL
        const url = new URL(edit.edited_image_url);
        const path = url.pathname.replace('/storage/v1/object/public/', '');
        await supabaseAdminStorageService.deleteVisualImages(userId, null, editId);
      } catch (storageError) {
        console.error('[ImageEditService] Failed to delete storage files:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete database record (trigger will update visual edit count)
      const { error: deleteError } = await (supabaseAdmin as any)
        .from('image_edits')
        .delete()
        .eq('id', edit.id);

      if (deleteError) {
        throw new Error(`Failed to delete edit record: ${deleteError.message}`);
      }

      console.log('[ImageEditService] Edit deleted successfully:', editId);
    } catch (error) {
      console.error('[ImageEditService] Error deleting edit:', error);
      throw error;
    }
  }

  /**
   * Increment view count for an edit
   */
  async incrementEditView(editId: string): Promise<void> {
    try {
      await (supabaseAdmin as any)
        .from('image_edits')
        .update({ views: (supabaseAdmin as any).raw('views + 1') })
        .eq('edit_id', editId);
    } catch (error) {
      console.error('[ImageEditService] Error incrementing view count:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Increment download count for an edit
   */
  async incrementEditDownload(editId: string): Promise<void> {
    try {
      await (supabaseAdmin as any)
        .from('image_edits')
        .update({ downloads: (supabaseAdmin as any).raw('downloads + 1') })
        .eq('edit_id', editId);
    } catch (error) {
      console.error('[ImageEditService] Error incrementing download count:', error);
      // Don't throw - this is not critical
    }
  }
}

export const imageEditService = new ImageEditService();
export default imageEditService;
