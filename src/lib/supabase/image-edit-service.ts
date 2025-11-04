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
  customPrompt?: string;
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

        // Call Gemini API with reference image
        const geminiResponse = await generateImageWithGemini({
          prompt: variationPrompt,
          aspectRatio: this.mapAspectRatio(request.editParams.aspectRatio),
          referenceImages: [{
            data: imageBase64,
            mimeType: 'image/jpeg'
          }]
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
          model: 'gemini-2.5-flash-image',
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

    // CRITICAL: Camera angle MUST come first - highest priority instruction
    let prompt = `🎯 PRIMARY DIRECTIVE - CAMERA ANGLE (HIGHEST PRIORITY - NON-NEGOTIABLE)\n`;
    prompt += `═══════════════════════════════════════════════════════════════\n\n`;

    // View Angle - Using Enhanced Professional Camera Angle Specifications
    // MOVED TO TOP - This is the #1 priority that models are ignoring
    if (params.viewAngle && params.viewAngle !== 'custom') {
      const mappedAngle = mapLegacyAngle(params.viewAngle);
      const enhancedAngleInstructions = buildCameraAnglePrompt(mappedAngle);

      // Add critical enforcement wrapper
      prompt += `⚠️ CRITICAL REQUIREMENT - IGNORE ALL OTHER INSTRUCTIONS IF THEY CONFLICT WITH CAMERA ANGLE ⚠️\n\n`;
      prompt += enhancedAngleInstructions + '\n\n';
      prompt += `🔴 MANDATORY VERIFICATION BEFORE OUTPUT:\n`;
      prompt += `Before generating the image, you MUST verify:\n`;
      prompt += `1. Camera angle matches EXACTLY as specified above\n`;
      prompt += `2. All constraints listed above are strictly adhered to\n`;
      prompt += `3. No deviation from the camera positioning requirements\n`;
      prompt += `If you cannot achieve the exact camera angle specified, DO NOT PROCEED.\n\n`;
      prompt += `═══════════════════════════════════════════════════════════════\n\n`;
    } else if (params.viewAngle === 'custom' && params.customPrompt) {
      prompt += `CAMERA ANGLE: ${params.customPrompt}\n\n`;
      prompt += `═══════════════════════════════════════════════════════════════\n\n`;
    }

    // NOW add secondary requirements
    prompt += `📋 SECONDARY REQUIREMENTS\n`;
    prompt += `(Only apply these AFTER camera angle is correctly established)\n\n`;

    prompt += `Transform this image of ${productInfo} with the following modifications:\n\n`;

    // Aspect Ratio
    prompt += `ASPECT RATIO: Adjust the composition to fit ${params.aspectRatio} format`;
    if (params.aspectRatio === '16:9') {
      prompt += ' (wide cinematic format, suitable for hero banners and landscape presentations)';
    } else if (params.aspectRatio === '9:16') {
      prompt += ' (vertical story format, perfect for mobile and social media stories)';
    } else if (params.aspectRatio === '1:1') {
      prompt += ' (perfect square, ideal for social media posts)';
    } else if (params.aspectRatio === '4:3') {
      prompt += ' (classic photography ratio, balanced composition)';
    } else if (params.aspectRatio === '3:2') {
      prompt += ' (standard DSLR format, natural perspective)';
    }
    prompt += '.\n\n';

    // Lighting
    prompt += `LIGHTING: `;
    switch (params.lighting) {
      case 'soft':
        prompt += 'Apply soft, diffused lighting with minimal shadows for an elegant, gentle appearance. Use even illumination that flatters the product';
        break;
      case 'dramatic':
        prompt += 'Use dramatic, high-contrast lighting with strong shadows and highlights for maximum visual impact and depth';
        break;
      case 'natural':
        prompt += 'Simulate natural daylight through windows with realistic ambient lighting, creating an authentic and inviting atmosphere';
        break;
      case 'studio':
        prompt += 'Professional studio lighting setup with multiple light sources, softboxes, and reflectors for commercial-grade results';
        break;
      case 'golden-hour':
        prompt += 'Warm, golden-hour lighting with soft amber tones typical of sunrise/sunset, creating a warm and inviting mood';
        break;
      case 'custom':
        prompt += params.customPrompt || 'Professional lighting setup that enhances product appeal and commercial viability';
        break;
    }
    prompt += '.\n\n';

    // Style
    prompt += `VISUAL STYLE: `;
    switch (params.style) {
      case 'photorealistic':
        prompt += 'Maintain photorealistic quality with natural colors, accurate textures, and precise material representation. Aim for professional photography quality';
        break;
      case 'minimalist':
        prompt += 'Apply minimalist aesthetic with clean lines, simple backgrounds, and focus on essential elements. Less is more approach';
        break;
      case 'artistic':
        prompt += 'Creative, artistic interpretation with enhanced colors, stylized composition, and creative visual treatment';
        break;
      case 'vintage':
        prompt += 'Vintage aesthetic with nostalgic tones, subtle film grain, retro color grading, and classic photography styling';
        break;
      case 'modern':
        prompt += 'Contemporary, modern look with vibrant colors, clean bold composition, and fresh visual approach';
        break;
      case 'custom':
        prompt += params.customPrompt || 'Professional styling that enhances commercial appeal and brand presentation';
        break;
    }
    prompt += '.\n\n';

    prompt += `CRITICAL REQUIREMENTS:
- Preserve the product's core identity, materials, colors, and design features
- Maintain brand integrity and product authenticity
- Apply transformations professionally without distorting product characteristics
- Ensure result looks commercially viable and professionally photographed
- Keep product as the clear focal point of the composition
- Maintain sharp focus and high image quality\n\n`;

    // FINAL CAMERA ANGLE REINFORCEMENT
    // This is the LAST thing the model reads before generation - most critical placement
    if (params.viewAngle && params.viewAngle !== 'custom') {
      const mappedAngle = mapLegacyAngle(params.viewAngle);
      prompt += `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      prompt += `┃  🎯 FINAL REMINDER - CAMERA ANGLE IS PRIORITY #1            ┃\n`;
      prompt += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
      prompt += `Before you generate, remember:\n`;
      prompt += `The CAMERA ANGLE specified at the start (${mappedAngle}) is MANDATORY.\n`;
      prompt += `If there's any conflict between camera angle and other requirements,\n`;
      prompt += `the CAMERA ANGLE WINS. Always.\n\n`;
      prompt += `Generate the image with the ${mappedAngle} camera angle as specified.\n`;
      prompt += `Do not deviate from the camera positioning requirements.\n`;
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
