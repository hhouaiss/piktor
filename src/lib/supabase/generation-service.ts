import { supabaseAdminStorageService } from './admin-storage';
import { supabaseAdmin } from './config';
import { supabaseClient } from './client';
import type { UploadResult } from './storage';

export interface GenerationRequest {
  userId: string;
  projectId: string | null;
  prompt: string;
  negativePrompt?: string;
  contextPreset?: string;
  variations?: number;
  quality?: 'high' | 'medium' | 'low';
  aspectRatio?: string;
  references?: string[];
  productName?: string;
  productCategory?: string;
}

export interface GeneratedImageData {
  url: string;
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  model?: string;
  aspectRatio?: string;
}

export interface GenerationResult {
  visualId: string;
  projectId: string | null;
  userId: string;
  images: GeneratedImageData[];
  uploadResults: UploadResult[];
  metadata: {
    prompt: string;
    negativePrompt?: string;
    contextPreset?: string;
    variations: number;
    quality: string;
    aspectRatio?: string;
    timestamp: string;
    model: string;
  };
}

class SupabaseGenerationService {
  /**
   * Create visual record in database using Supabase
   */
  async createVisualRecord(
    userId: string,
    projectId: string | null,
    visualId: string,
    prompt: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      const { error } = await (supabaseAdmin as any)
        .from('visuals')
        .insert({
          visual_id: visualId,
          user_id: userId,
          project_id: projectId,
          metadata: {
            prompt,
            ...metadata,
            status: 'generating'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('[SupabaseGenerationService] Failed to create visual record:', error);
        throw new Error(`Failed to create visual record: ${error.message}`);
      }

      console.log('[SupabaseGenerationService] Visual record created successfully:', visualId);
    } catch (error) {
      console.error('[SupabaseGenerationService] Error creating visual record:', error);
      throw error;
    }
  }

  /**
   * Update visual record with storage URLs and metadata
   */
  async updateVisualStatus(
    visualId: string,
    originalUrl: string,
    thumbnailUrl?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const updateData: any = {
        original_url: originalUrl,
        updated_at: new Date().toISOString()
      };

      if (thumbnailUrl) {
        updateData.thumbnail_url = thumbnailUrl;
      }

      if (metadata) {
        updateData.metadata = {
          ...metadata,
          status: 'completed'
        };
      }

      const { error } = await (supabaseAdmin as any)
        .from('visuals')
        .update(updateData)
        .eq('visual_id', visualId);

      if (error) {
        console.error('[SupabaseGenerationService] Failed to update visual:', error);
        throw new Error(`Failed to update visual: ${error.message}`);
      }

      console.log('[SupabaseGenerationService] Visual updated:', { visualId, originalUrl });
    } catch (error) {
      console.error('[SupabaseGenerationService] Error updating visual:', error);
      throw error;
    }
  }

  /**
   * Process and save generated images using Supabase Storage
   */
  async processGeneratedImages(
    userId: string,
    projectId: string | null,
    visualId: string,
    generatedImages: GeneratedImageData[]
  ): Promise<UploadResult[]> {
    console.log('[SupabaseGenerationService] Processing generated images:', {
      userId,
      projectId,
      visualId,
      imageCount: generatedImages.length
    });

    const uploadResults: UploadResult[] = [];

    try {
      for (let i = 0; i < generatedImages.length; i++) {
        const imageData = generatedImages[i];
        console.log(`[SupabaseGenerationService] Processing image ${i + 1}/${generatedImages.length}`);

        try {
          // Generate unique ID for this specific image
          const imageVisualId = generatedImages.length > 1 ? `${visualId}_${i + 1}` : visualId;

          // Upload image from URL using Supabase admin storage
          const uploadResult = await supabaseAdminStorageService.uploadImageFromUrl(
            userId,
            projectId,
            imageVisualId,
            imageData.url,
            {
              generateThumbnail: true,
              metadata: {
                prompt: imageData.prompt,
                negativePrompt: imageData.negativePrompt || '',
                seed: imageData.seed?.toString() || '',
                model: imageData.model || '',
                aspectRatio: imageData.aspectRatio || '',
                generatedAt: new Date().toISOString()
              }
            }
          );

          uploadResults.push(uploadResult);

          console.log(`[SupabaseGenerationService] Image ${i + 1} uploaded successfully:`, {
            imageVisualId,
            originalUrl: uploadResult.originalUrl,
            thumbnailUrl: uploadResult.thumbnailUrl
          });

        } catch (error) {
          console.error(`[SupabaseGenerationService] Failed to process image ${i + 1}:`, error);
          // Continue with other images
        }
      }

      console.log('[SupabaseGenerationService] All images processed:', {
        successful: uploadResults.length,
        total: generatedImages.length
      });

      return uploadResults;

    } catch (error) {
      console.error('[SupabaseGenerationService] Error processing generated images:', error);
      throw error;
    }
  }

  /**
   * Complete generation process - update visual record with final data
   */
  async completeGeneration(
    visualId: string,
    uploadResults: UploadResult[],
    metadata: any
  ): Promise<void> {
    try {
      // Check if we have any successful uploads
      if (uploadResults.length === 0) {
        throw new Error('No images were successfully uploaded');
      }

      // Use the first upload result for the main URLs
      const mainResult = uploadResults[0];

      if (!mainResult || !mainResult.originalUrl) {
        throw new Error('Invalid upload result - missing original URL');
      }

      await this.updateVisualStatus(
        visualId,
        mainResult.originalUrl,
        mainResult.thumbnailUrl,
        {
          ...metadata,
          images: uploadResults.map(result => ({
            originalUrl: result.originalUrl,
            thumbnailUrl: result.thumbnailUrl,
            metadata: result.metadata
          })),
          completedAt: new Date().toISOString()
        }
      );

      console.log('[SupabaseGenerationService] Generation completed successfully:', visualId);
    } catch (error) {
      console.error('[SupabaseGenerationService] Error completing generation:', error);
      throw error;
    }
  }

  /**
   * Handle generation failure
   */
  async failGeneration(visualId: string, error: Error): Promise<void> {
    try {
      const { error: updateError } = await (supabaseAdmin as any)
        .from('visuals')
        .update({
          metadata: {
            status: 'failed',
            error: error.message,
            failedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('visual_id', visualId);

      if (updateError) {
        console.error('[SupabaseGenerationService] Failed to mark generation as failed:', updateError);
      } else {
        console.log('[SupabaseGenerationService] Generation marked as failed:', visualId);
      }
    } catch (updateError) {
      console.error('[SupabaseGenerationService] Error marking generation as failed:', updateError);
    }
  }

  /**
   * Main generation orchestration method
   */
  async processGeneration(request: GenerationRequest, generatedImages: GeneratedImageData[]): Promise<GenerationResult> {
    const visualId = `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('[SupabaseGenerationService] Starting generation process:', {
      visualId,
      userId: request.userId,
      projectId: request.projectId,
      imageCount: generatedImages.length
    });

    try {
      // Create visual record
      await this.createVisualRecord(
        request.userId,
        request.projectId,
        visualId,
        request.prompt,
        {
          negativePrompt: request.negativePrompt,
          contextPreset: request.contextPreset,
          variations: request.variations || 1,
          quality: request.quality || 'medium',
          aspectRatio: request.aspectRatio,
          references: request.references,
          product: {
            name: request.productName,
            category: request.productCategory
          }
        }
      );

      // Process and upload images
      const uploadResults = await this.processGeneratedImages(
        request.userId,
        request.projectId,
        visualId,
        generatedImages
      );

      // Complete generation - preserve product information from initial metadata
      const metadata = {
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        contextPreset: request.contextPreset,
        variations: request.variations || 1,
        quality: request.quality || 'medium',
        aspectRatio: request.aspectRatio,
        timestamp: new Date().toISOString(),
        model: generatedImages[0]?.model || 'unknown',
        product: {
          name: request.productName,
          category: request.productCategory
        }
      };

      await this.completeGeneration(visualId, uploadResults, metadata);

      const result: GenerationResult = {
        visualId,
        projectId: request.projectId,
        userId: request.userId,
        images: generatedImages,
        uploadResults,
        metadata
      };

      console.log('[SupabaseGenerationService] Generation process completed successfully:', {
        visualId,
        uploadCount: uploadResults.length
      });

      return result;

    } catch (error) {
      console.error('[SupabaseGenerationService] Generation process failed:', error);
      await this.failGeneration(visualId, error as Error);
      throw error;
    }
  }

  /**
   * Get visual by ID
   */
  async getVisual(visualId: string): Promise<any> {
    try {
      const { data, error } = await supabaseClient
        .from('visuals')
        .select('*')
        .eq('visual_id', visualId)
        .single();

      if (error) {
        console.error('[SupabaseGenerationService] Failed to get visual:', error);
        throw new Error(`Failed to get visual: ${error.message}`);
      }

      // Convert to format expected by API route
      return {
        ...(data as any),
        originalImageUrl: (data as any).original_url,
        thumbnailImageUrl: (data as any).thumbnail_url
      };
    } catch (error) {
      console.error('[SupabaseGenerationService] Error getting visual:', error);
      throw error;
    }
  }

  /**
   * Delete visual and associated files
   */
  async deleteVisual(userId: string, projectId: string | null, visualId: string): Promise<void> {
    try {
      // Delete files from storage
      await supabaseAdminStorageService.deleteVisualImages(userId, projectId, visualId);

      // Delete visual record
      const { error } = await (supabaseAdmin as any)
        .from('visuals')
        .delete()
        .eq('visual_id', visualId);

      if (error) {
        console.error('[SupabaseGenerationService] Failed to delete visual record:', error);
        throw new Error(`Failed to delete visual record: ${error.message}`);
      }

      console.log('[SupabaseGenerationService] Visual deleted successfully:', visualId);
    } catch (error) {
      console.error('[SupabaseGenerationService] Error deleting visual:', error);
      throw error;
    }
  }
}

export const generationService = new SupabaseGenerationService();
export default generationService;