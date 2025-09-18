import { serverFirestoreService } from './server-hybrid';
import { firestoreService } from './firestore';
import { storageService } from './storage';
import type { Visual, Project } from './types';
import type { ImageVariant } from './storage';

export interface GenerationRequest {
  userId?: string;
  projectId?: string;
  projectName?: string;
  prompt: string;
  style: string;
  environment: string;
  formats: string[];
  generationParams?: Record<string, any>;
  customPrompt?: string;
}

export interface GeneratedImageData {
  imageData: string; // base64
  url?: string; // external URL if available
  format?: string;
  prompt?: string;
}

export interface GenerationResult {
  visualId: string;
  projectId: string;
  visual: Visual;
  success: boolean;
  error?: string;
}

class GenerationService {
  /**
   * Save generated images to Firebase and create visual records
   */
  async saveGeneratedImages(
    request: GenerationRequest,
    generatedImages: GeneratedImageData[]
  ): Promise<GenerationResult[]> {
    console.log('[GenerationService] Starting saveGeneratedImages:', {
      userId: request.userId,
      imageCount: generatedImages.length,
      projectId: request.projectId,
      hasCustomPrompt: !!request.customPrompt
    });
    
    const results: GenerationResult[] = [];
    
    // Ensure user is authenticated
    // Use the provided userId from the request
    const userId = request.userId;
    
    console.log('[GenerationService] Auth check:', {
      requestUserId: request.userId,
      currentUserId: undefined,
      finalUserId: userId
    });
    
    if (!userId) {
      const error = 'User must be authenticated to save generated images';
      console.error('[GenerationService] Auth error:', error);
      throw new Error(error);
    }

    // Check if user has sufficient credits
    try {
      console.log('[GenerationService] Checking credits for user:', userId);
      const hasCredits = await serverFirestoreService.hasCredits(userId, generatedImages.length);
      console.log('[GenerationService] Credits check result:', { hasCredits, creditsNeeded: generatedImages.length });
      
      if (!hasCredits) {
        const error = 'Insufficient credits to complete generation';
        console.error('[GenerationService] Credits error:', error);
        throw new Error(error);
      }
    } catch (error) {
      console.error('[GenerationService] Credits check failed:', error);
      throw error;
    }

    try {
      // Create or get project
      let projectId = request.projectId;
      
      if (!projectId) {
        console.log('[GenerationService] Creating new project for user:', userId);
        try {
          projectId = await this.createGenerationProject(userId, request);
          console.log('[GenerationService] Created project:', projectId);
        } catch (error) {
          console.error('[GenerationService] Failed to create project:', error);
          throw error;
        }
      } else {
        console.log('[GenerationService] Using existing project:', projectId);
      }

      // Process each generated image
      console.log('[GenerationService] Processing images:', generatedImages.length);
      for (let i = 0; i < generatedImages.length; i++) {
        try {
          console.log(`[GenerationService] Processing image ${i + 1}/${generatedImages.length}`);
          const imageData = generatedImages[i];
          const result = await this.saveGeneratedImage(
            userId,
            projectId,
            request,
            imageData,
            i
          );
          
          console.log(`[GenerationService] Saved image ${i + 1}:`, {
            success: result.success,
            visualId: result.visualId,
            error: result.error
          });
          
          results.push(result);
        } catch (error) {
          console.error(`[GenerationService] Failed to save image ${i}:`, error);
          results.push({
            visualId: '',
            projectId,
            visual: null as any,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Use credits for successful generations
      const successfulGenerations = results.filter(r => r.success).length;
      console.log('[GenerationService] Generation results:', {
        total: results.length,
        successful: successfulGenerations,
        failed: results.length - successfulGenerations
      });
      
      if (successfulGenerations > 0) {
        try {
          console.log('[GenerationService] Using credits:', successfulGenerations);
          await serverFirestoreService.useCredits(userId, successfulGenerations);
          console.log('[GenerationService] Credits used successfully');
        } catch (error) {
          console.error('[GenerationService] Failed to use credits:', error);
          // Don't throw here, as images were already saved
        }
      }

      console.log('[GenerationService] saveGeneratedImages completed successfully');
      return results;
    } catch (error) {
      console.error('[GenerationService] Failed to save generated images:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        projectId: request.projectId
      });
      throw error;
    }
  }

  /**
   * Create a new project for generation
   */
  private async createGenerationProject(
    userId: string,
    request: GenerationRequest
  ): Promise<string> {
    const projectName = request.projectName || 
      `Génération ${new Date().toLocaleDateString('fr-FR')} - ${request.style}`;
    
    const projectData = {
      name: projectName,
      description: `Projet créé automatiquement pour la génération`,
      category: 'ai_generation',
      defaultStyle: request.style,
      defaultEnvironment: request.environment,
      preferredFormats: request.formats,
      status: 'active' as const,
      isPublic: false
    };

    console.log('[GenerationService] Creating project with data:', {
      userId,
      projectName,
      projectData
    });

    try {
      const projectId = await firestoreService.createProject(userId, projectData);
      console.log('[GenerationService] Project created successfully:', {
        projectId,
        userId,
        projectName
      });
      return projectId;
    } catch (error) {
      console.error('[GenerationService] Failed to create project:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        projectData
      });
      throw error;
    }
  }

  /**
   * Save a single generated image
   */
  private async saveGeneratedImage(
    userId: string,
    projectId: string,
    request: GenerationRequest,
    imageData: GeneratedImageData,
    index: number
  ): Promise<GenerationResult> {
    console.log('[GenerationService] Starting saveGeneratedImage:', {
      userId,
      projectId,
      index,
      hasImageData: !!imageData.imageData,
      hasImageUrl: !!imageData.url,
      imageFormat: imageData.format
    });
    
    try {
      // Generate unique ID for this visual
      const visualId = `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('[GenerationService] Generated visualId:', visualId);
      
      // Convert image data to blob
      console.log('[GenerationService] Converting image data to blob...');
      const blob = await this.convertImageDataToBlob(imageData);
      console.log('[GenerationService] Image blob created:', {
        size: blob.size,
        type: blob.type
      });
      
      // Define image variants for different formats
      const variants: ImageVariant[] = request.formats.map(format => {
        const dimensions = this.getFormatDimensions(format);
        return {
          format,
          width: dimensions.width,
          height: dimensions.height,
          quality: 0.9
        };
      });
      console.log('[GenerationService] Created variants:', variants);

      // Upload image to Firebase Storage
      console.log('[GenerationService] Uploading to Firebase Storage...');
      try {
        const uploadResult = await storageService.uploadVisualImage(
          userId,
          projectId,
          visualId,
          blob,
          {
            generateThumbnail: true,
            variants,
            metadata: {
              prompt: request.prompt,
              style: request.style,
              environment: request.environment,
              generatedAt: new Date().toISOString(),
              originalFormat: imageData.format || 'unknown'
            }
          }
        );
        console.log('[GenerationService] Storage upload successful:', {
          originalUrl: uploadResult.originalUrl,
          thumbnailUrl: uploadResult.thumbnailUrl,
          variantCount: Object.keys(uploadResult.variants || {}).length
        });

        // Extract dominant colors from image
        console.log('[GenerationService] Extracting colors...');
        const colors = await this.extractColors(blob);
        console.log('[GenerationService] Colors extracted:', colors);
        
        // Create visual data
        const visualData: Omit<Visual, 'id'> = {
          userId,
          projectId,
          name: this.generateVisualName(request, index),
          description: `Image générée avec IA - ${request.style} dans un environnement ${request.environment}`,
          originalImageUrl: uploadResult.originalUrl,
          thumbnailUrl: uploadResult.thumbnailUrl || uploadResult.originalUrl,
          downloadUrls: uploadResult.variants || {},
          prompt: request.prompt,
          style: request.style,
          environment: request.environment,
          format: request.formats,
          generationParams: {
            model: 'gemini-2.5-flash',
            timestamp: new Date().toISOString(),
            ...request.generationParams
          },
          tags: this.generateTags(request),
          colors,
          dimensions: {
            width: uploadResult.metadata.customMetadata?.width ? 
              parseInt(uploadResult.metadata.customMetadata.width) : 1024,
            height: uploadResult.metadata.customMetadata?.height ? 
              parseInt(uploadResult.metadata.customMetadata.height) : 1024
          },
          fileSize: uploadResult.metadata.size,
          mimeType: uploadResult.metadata.contentType,
          views: 0,
          downloads: 0,
          shares: 0,
          isFavorite: false,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        };

        console.log('[GenerationService] Created visual data:', {
          name: visualData.name,
          description: visualData.description,
          tagsCount: visualData.tags.length,
          colorsCount: visualData.colors.length,
          dimensions: visualData.dimensions
        });

        // Save to Firestore
        console.log('[GenerationService] Saving visual to Firestore...');
        const createdVisualId = await firestoreService.createVisual(visualData);
        console.log('[GenerationService] Visual created in Firestore:', createdVisualId);

        // Add a small delay and retry logic to ensure Firestore consistency
        let visual = null;
        let retries = 3;

        while (retries > 0 && !visual) {
          console.log(`[GenerationService] Retrieving created visual (attempt ${4 - retries}/3)...`);

          if (retries < 3) {
            // Add increasing delay for retries
            await new Promise(resolve => setTimeout(resolve, (4 - retries) * 200));
          }

          visual = await firestoreService.getVisual(createdVisualId);

          if (visual) {
            console.log('[GenerationService] Visual retrieved successfully:', {
              visualId: visual.id,
              hasOriginalImageUrl: !!visual.originalImageUrl,
              originalImageUrlPrefix: visual.originalImageUrl ? visual.originalImageUrl.substring(0, 100) + '...' : 'none'
            });
            break;
          } else {
            console.warn(`[GenerationService] Visual not found on attempt ${4 - retries}, retrying...`);
            retries--;
          }
        }

        if (!visual) {
          throw new Error('Failed to retrieve created visual after multiple attempts');
        }

        // Validate that we have a proper Firebase Storage URL
        if (!visual.originalImageUrl || visual.originalImageUrl.startsWith('data:')) {
          console.error('[GenerationService] Visual missing proper Firebase Storage URL:', {
            visualId: visual.id,
            originalImageUrl: visual.originalImageUrl,
            hasDataUrl: visual.originalImageUrl?.startsWith('data:') || false
          });
          throw new Error('Visual was saved but does not have a proper Firebase Storage URL');
        }

        console.log('[GenerationService] saveGeneratedImage completed successfully:', {
          visualId: createdVisualId,
          projectId,
          success: true,
          finalImageUrl: visual.originalImageUrl,
          isFirebaseStorageUrl: visual.originalImageUrl.includes('firebasestorage.googleapis.com')
        });

        return {
          visualId: createdVisualId,
          projectId,
          visual,
          success: true
        };
      } catch (storageError) {
        console.error('[GenerationService] Storage upload failed:', {
          error: storageError instanceof Error ? storageError.message : 'Unknown storage error',
          stack: storageError instanceof Error ? storageError.stack : undefined
        });
        throw storageError;
      }
    } catch (error) {
      console.error('[GenerationService] Failed to save generated image:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        projectId,
        visualId: `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        index
      });
      return {
        visualId: '',
        projectId,
        visual: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert image data to blob
   */
  private async convertImageDataToBlob(imageData: GeneratedImageData): Promise<Blob> {
    console.log('[GenerationService] Converting image data to blob:', {
      hasUrl: !!imageData.url,
      hasImageData: !!imageData.imageData,
      imageDataLength: imageData.imageData?.length || 0,
      imageDataPrefix: imageData.imageData?.substring(0, 50) || 'none'
    });
    
    if (imageData.url) {
      console.log('[GenerationService] Fetching from external URL:', imageData.url.substring(0, 100) + '...');
      // Fetch from external URL
      const response = await fetch(imageData.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('[GenerationService] Blob created from URL:', {
        size: blob.size,
        type: blob.type
      });
      return blob;
    } else if (imageData.imageData) {
      console.log('[GenerationService] Converting base64 to blob...');
      // Convert base64 to blob
      const base64Data = imageData.imageData.includes(',') 
        ? imageData.imageData.split(',')[1] 
        : imageData.imageData;
      
      console.log('[GenerationService] Base64 data length after processing:', base64Data.length);
      
      try {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        console.log('[GenerationService] Blob created from base64:', {
          size: blob.size,
          type: blob.type
        });
        return blob;
      } catch (error) {
        console.error('[GenerationService] Failed to convert base64 to blob:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          base64Length: base64Data.length,
          base64Prefix: base64Data.substring(0, 20)
        });
        throw error;
      }
    } else {
      throw new Error('No valid image data provided');
    }
  }

  /**
   * Get dimensions for different formats
   */
  private getFormatDimensions(format: string): { width: number; height: number } {
    const formatMap: Record<string, { width: number; height: number }> = {
      'instagram_post': { width: 1080, height: 1080 },
      'instagram_story': { width: 1080, height: 1920 },
      'facebook_post': { width: 1200, height: 630 },
      'linkedin_post': { width: 1200, height: 627 },
      'twitter_post': { width: 1200, height: 675 },
      'e_commerce': { width: 1000, height: 1000 },
      'print_a4': { width: 2480, height: 3508 },
      'print_a3': { width: 3508, height: 4961 },
      'web_banner': { width: 1200, height: 400 },
      'square': { width: 1024, height: 1024 },
      'landscape': { width: 1344, height: 768 },
      'portrait': { width: 768, height: 1344 }
    };
    
    return formatMap[format] || { width: 1024, height: 1024 };
  }

  /**
   * Generate visual name based on request
   */
  private generateVisualName(request: GenerationRequest, index: number): string {
    const styleName = request.style.charAt(0).toUpperCase() + request.style.slice(1);
    const envName = request.environment.charAt(0).toUpperCase() + request.environment.slice(1);
    const formatName = request.formats[index] || request.formats[0] || 'Image';
    
    return `${styleName} - ${envName} (${formatName})`;
  }

  /**
   * Generate tags from request
   */
  private generateTags(request: GenerationRequest): string[] {
    const tags: string[] = [
      request.style,
      request.environment,
      'ia_generee',
      'automatique'
    ];
    
    // Add format tags
    request.formats.forEach(format => {
      tags.push(format.replace('_', ' '));
    });
    
    // Extract keywords from prompt
    const promptWords = request.prompt.toLowerCase().split(/\s+/);
    const keywords = promptWords.filter(word => 
      word.length > 3 && 
      !['with', 'that', 'this', 'from', 'into', 'very', 'more', 'most', 'some', 'many', 'much'].includes(word)
    ).slice(0, 5);
    
    tags.push(...keywords);
    
    return Array.from(new Set(tags)); // Remove duplicates
  }

  /**
   * Extract dominant colors from image (simplified implementation)
   */
  private async extractColors(blob: Blob): Promise<string[]> {
    // This is a simplified implementation
    // In production, you might use a more sophisticated color extraction library
    return ['#000000', '#FFFFFF', '#808080']; // Default colors
  }

  /**
   * Update existing visual with new generated image
   */
  async updateVisualWithNewImage(
    visualId: string,
    imageData: GeneratedImageData,
    userId: string
  ): Promise<Visual> {
    const visual = await firestoreService.getVisual(visualId);
    if (!visual) {
      throw new Error('Visual not found');
    }
    
    if (visual.userId !== userId) {
      throw new Error('Unauthorized to update this visual');
    }

    // Convert and upload new image
    const blob = await this.convertImageDataToBlob(imageData);
    
    const uploadResult = await storageService.uploadVisualImage(
      userId,
      visual.projectId,
      visualId,
      blob,
      {
        generateThumbnail: true,
        metadata: {
          updatedAt: new Date().toISOString(),
          version: 'updated'
        }
      }
    );

    // Update visual in Firestore
    await firestoreService.updateVisual(visualId, {
      originalImageUrl: uploadResult.originalUrl,
      thumbnailUrl: uploadResult.thumbnailUrl || uploadResult.originalUrl,
      downloadUrls: uploadResult.variants || {},
      updatedAt: new Date() as any
    });

    // Return updated visual
    const updatedVisual = await firestoreService.getVisual(visualId);
    if (!updatedVisual) {
      throw new Error('Failed to retrieve updated visual');
    }

    return updatedVisual;
  }

  /**
   * Batch save multiple generations for different projects
   */
  async batchSaveGenerations(
    generations: Array<{
      request: GenerationRequest;
      images: GeneratedImageData[];
    }>
  ): Promise<GenerationResult[]> {
    const allResults: GenerationResult[] = [];
    
    for (const generation of generations) {
      try {
        const results = await this.saveGeneratedImages(
          generation.request,
          generation.images
        );
        allResults.push(...results);
      } catch (error) {
        console.error('Failed to save batch generation:', error);
        // Continue with other generations
      }
    }
    
    return allResults;
  }
}

export const generationService = new GenerationService();
export default generationService;