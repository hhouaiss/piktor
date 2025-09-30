import { supabaseClient, supabaseAdmin } from './config';

export interface UploadProgress {
  progress: number; // 0-100
  bytesTransferred: number;
  totalBytes: number;
}

export interface ImageVariant {
  format: string;
  width: number;
  height: number;
  quality?: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  generateThumbnail?: boolean;
  variants?: ImageVariant[];
  metadata?: Record<string, string>;
}

export interface UploadResult {
  originalUrl: string;
  thumbnailUrl?: string;
  variants?: Record<string, string>;
  metadata: {
    size: number;
    contentType: string;
    fullPath: string;
    name: string;
    timeCreated: string;
    customMetadata?: Record<string, string>;
  };
}

class SupabaseStorageService {
  // Storage buckets
  private readonly VISUALS_BUCKET = 'visuals';
  private readonly TEMP_BUCKET = 'temp';

  // Storage paths
  private readonly USERS_PATH = 'users';
  private readonly VISUALS_PATH = 'visuals';
  private readonly THUMBNAILS_PATH = 'thumbnails';
  private readonly TEMP_PATH = 'temp';

  /**
   * Upload an image with automatic thumbnail generation and variants
   */
  async uploadVisualImage(
    userId: string,
    projectId: string,
    visualId: string,
    imageBlob: Blob,
    options?: UploadOptions
  ): Promise<UploadResult> {
    console.log('[SupabaseStorageService] Starting uploadVisualImage:', {
      userId,
      projectId,
      visualId,
      blobSize: imageBlob.size,
      blobType: imageBlob.type,
      optionsProvided: !!options
    });

    const originalPath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/original.jpg`;
    console.log('[SupabaseStorageService] Upload path:', originalPath);

    try {
      console.log('[SupabaseStorageService] Starting upload to Supabase Storage...');

      // Upload original image
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from(this.VISUALS_BUCKET)
        .upload(originalPath, imageBlob, {
          contentType: imageBlob.type,
          metadata: {
            userId,
            projectId,
            visualId,
            uploadedAt: new Date().toISOString(),
            ...options?.metadata
          },
          upsert: true // Allow overwriting existing files
        });

      if (uploadError) {
        console.error('[SupabaseStorageService] Upload failed:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('[SupabaseStorageService] Upload completed successfully:', uploadData);

      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from(this.VISUALS_BUCKET)
        .getPublicUrl(originalPath);

      const originalUrl = urlData.publicUrl;

      console.log('[SupabaseStorageService] Public URL obtained:', {
        url: originalUrl,
        isSupabaseUrl: originalUrl.includes('.supabase.co'),
        urlLength: originalUrl.length
      });

      // Simulate progress callback for compatibility
      if (options?.onProgress) {
        options.onProgress({
          progress: 100,
          bytesTransferred: imageBlob.size,
          totalBytes: imageBlob.size
        });
      }

      const result: UploadResult = {
        originalUrl,
        metadata: {
          size: imageBlob.size,
          contentType: imageBlob.type || 'image/jpeg',
          fullPath: originalPath,
          name: visualId,
          timeCreated: new Date().toISOString(),
          customMetadata: options?.metadata
        }
      };

      // Generate thumbnail if requested (only in browser environment)
      if (options?.generateThumbnail && typeof window !== 'undefined') {
        try {
          console.log('[SupabaseStorageService] Generating thumbnail...');
          const thumbnailUrl = await this.generateThumbnail(
            originalUrl,
            userId,
            projectId,
            visualId
          );
          result.thumbnailUrl = thumbnailUrl;
          console.log('[SupabaseStorageService] Thumbnail generated successfully:', thumbnailUrl);
        } catch (error) {
          console.warn('[SupabaseStorageService] Failed to generate thumbnail:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      } else if (options?.generateThumbnail) {
        console.log('[SupabaseStorageService] Thumbnail generation skipped - server environment detected');
        // On server side, use original image as thumbnail
        result.thumbnailUrl = result.originalUrl;
      }

      // Generate variants if requested (only in browser environment)
      if (options?.variants && options.variants.length > 0 && typeof window !== 'undefined') {
        try {
          console.log('[SupabaseStorageService] Generating variants:', options.variants.length);
          const variants = await this.generateVariants(
            originalUrl,
            userId,
            projectId,
            visualId,
            options.variants
          );
          result.variants = variants;
          console.log('[SupabaseStorageService] Variants generated successfully:', Object.keys(variants));
        } catch (error) {
          console.warn('[SupabaseStorageService] Failed to generate variants:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      } else if (options?.variants && options.variants.length > 0) {
        console.log('[SupabaseStorageService] Variant generation skipped - server environment detected');
        // On server side, create variant URLs pointing to the original image
        const variants: Record<string, string> = {};
        options.variants.forEach(variant => {
          variants[variant.format] = result.originalUrl;
        });
        result.variants = variants;
        console.log('[SupabaseStorageService] Variants mapped to original URL for server environment:', Object.keys(variants));
      }

      // Record the file in our tracking table
      try {
        await this.recordVisualFile(userId, projectId, visualId, result);
      } catch (error) {
        console.warn('[SupabaseStorageService] Failed to record visual file:', error);
        // Don't throw - file upload was successful
      }

      console.log('[SupabaseStorageService] uploadVisualImage completed successfully:', {
        originalUrl: result.originalUrl,
        thumbnailUrl: result.thumbnailUrl,
        variantCount: Object.keys(result.variants || {}).length,
        fileSize: result.metadata.size
      });

      return result;
    } catch (error) {
      console.error('[SupabaseStorageService] Upload failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalPath,
        blobSize: imageBlob.size,
        blobType: imageBlob.type
      });
      throw error;
    }
  }

  /**
   * Generate thumbnail from original image
   */
  private async generateThumbnail(
    originalUrl: string,
    userId: string,
    projectId: string,
    visualId: string
  ): Promise<string> {
    // Create thumbnail using Canvas API
    const thumbnailBlob = await this.createThumbnail(originalUrl, 400, 400);

    // Upload thumbnail
    const thumbnailPath = `${this.USERS_PATH}/${userId}/${this.THUMBNAILS_PATH}/${projectId}/${visualId}.jpg`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(this.VISUALS_BUCKET)
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: 'image/jpeg',
        metadata: {
          userId,
          projectId,
          visualId,
          type: 'thumbnail',
          createdAt: new Date().toISOString()
        },
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Thumbnail upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabaseClient.storage
      .from(this.VISUALS_BUCKET)
      .getPublicUrl(thumbnailPath);

    return urlData.publicUrl;
  }

  /**
   * Generate image variants (different formats/sizes)
   */
  private async generateVariants(
    originalUrl: string,
    userId: string,
    projectId: string,
    visualId: string,
    variants: ImageVariant[]
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    for (const variant of variants) {
      try {
        const variantBlob = await this.createVariant(
          originalUrl,
          variant.width,
          variant.height,
          variant.quality || 0.9
        );

        const variantPath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/${variant.format}.jpg`;

        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from(this.VISUALS_BUCKET)
          .upload(variantPath, variantBlob, {
            contentType: 'image/jpeg',
            metadata: {
              userId,
              projectId,
              visualId,
              format: variant.format,
              width: variant.width.toString(),
              height: variant.height.toString(),
              createdAt: new Date().toISOString()
            },
            upsert: true
          });

        if (uploadError) {
          console.warn(`Failed to upload variant ${variant.format}:`, uploadError);
          continue;
        }

        const { data: urlData } = supabaseClient.storage
          .from(this.VISUALS_BUCKET)
          .getPublicUrl(variantPath);

        results[variant.format] = urlData.publicUrl;
      } catch (error) {
        console.warn(`Failed to generate variant ${variant.format}:`, error);
      }
    }

    return results;
  }

  /**
   * Create thumbnail using Canvas API
   */
  private async createThumbnail(
    imageUrl: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions maintaining aspect ratio
        const { width: newWidth, height: newHeight } = this.calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Create image variant with specific dimensions
   */
  private async createVariant(
    imageUrl: string,
    targetWidth: number,
    targetHeight: number,
    quality: number = 0.9
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Calculate positioning for center crop
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (targetWidth - scaledWidth) / 2;
        const y = (targetHeight - scaledHeight) / 2;

        // Draw image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create variant blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let newWidth = maxWidth;
    let newHeight = maxWidth / aspectRatio;

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  }

  /**
   * Upload image from URL (for API-generated images)
   */
  async uploadImageFromUrl(
    userId: string,
    projectId: string,
    visualId: string,
    imageUrl: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    console.log('[SupabaseStorageService] Starting uploadImageFromUrl:', {
      userId,
      projectId,
      visualId,
      imageUrl: imageUrl.substring(0, 100) + '...'
    });

    try {
      // Fetch image from URL
      console.log('[SupabaseStorageService] Fetching image from URL...');
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('[SupabaseStorageService] Image fetched successfully:', {
        size: blob.size,
        type: blob.type
      });

      return await this.uploadVisualImage(userId, projectId, visualId, blob, options);
    } catch (error) {
      console.error('[SupabaseStorageService] Failed to upload image from URL:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        imageUrl: imageUrl.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  /**
   * Delete visual images and variants
   */
  async deleteVisualImages(
    userId: string,
    projectId: string,
    visualId: string
  ): Promise<void> {
    try {
      // Delete files from storage bucket
      const basePath = `${this.USERS_PATH}/${userId}`;
      const visualsPath = `${basePath}/${this.VISUALS_PATH}/${projectId}/${visualId}`;
      const thumbnailPath = `${basePath}/${this.THUMBNAILS_PATH}/${projectId}/${visualId}.jpg`;

      // List all files in the visual folder
      const { data: files, error: listError } = await supabaseClient.storage
        .from(this.VISUALS_BUCKET)
        .list(visualsPath);

      if (!listError && files) {
        // Delete all files in the visual folder
        const filePaths = files.map(file => `${visualsPath}/${file.name}`);
        if (filePaths.length > 0) {
          const { error: deleteError } = await supabaseClient.storage
            .from(this.VISUALS_BUCKET)
            .remove(filePaths);

          if (deleteError) {
            console.error('Error deleting visual files:', deleteError);
          }
        }
      }

      // Delete thumbnail
      const { error: thumbnailError } = await supabaseClient.storage
        .from(this.VISUALS_BUCKET)
        .remove([thumbnailPath]);

      if (thumbnailError && thumbnailError.message !== 'The resource was not found') {
        console.warn('Error deleting thumbnail:', thumbnailError);
      }

      // Delete records from visual_files table
      const { error: dbError } = await (supabaseClient as any)
        .rpc('delete_visual_files', {
          visual_uuid: visualId
        });

      if (dbError) {
        console.warn('Error deleting visual file records:', dbError);
      }
    } catch (error) {
      console.error('Failed to delete visual images:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(
    userId: string,
    projectId: string,
    visualId: string,
    filename: string = 'original.jpg'
  ): Promise<string> {
    const imagePath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/${filename}`;

    const { data, error } = await supabaseClient.storage
      .from(this.VISUALS_BUCKET)
      .createSignedUrl(imagePath, 3600); // 1 hour expiry

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Upload temporary image (for processing)
   */
  async uploadTempImage(blob: Blob, filename?: string): Promise<string> {
    const tempFilename = filename || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const tempPath = `${this.TEMP_PATH}/${tempFilename}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(this.VISUALS_BUCKET)
      .upload(tempPath, blob, {
        contentType: blob.type || 'image/jpeg',
        metadata: {
          type: 'temporary',
          createdAt: new Date().toISOString()
        }
      });

    if (uploadError) {
      throw new Error(`Temp upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabaseClient.storage
      .from(this.VISUALS_BUCKET)
      .getPublicUrl(tempPath);

    return urlData.publicUrl;
  }

  /**
   * Clean up temporary files older than 24 hours
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const { data: files, error: listError } = await supabaseClient.storage
        .from(this.VISUALS_BUCKET)
        .list(this.TEMP_PATH);

      if (listError || !files) {
        console.error('Failed to list temp files:', listError);
        return;
      }

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const filesToDelete: string[] = [];

      for (const file of files) {
        try {
          const createdAt = new Date(file.created_at).getTime();

          if (createdAt < oneDayAgo) {
            filesToDelete.push(`${this.TEMP_PATH}/${file.name}`);
          }
        } catch (error) {
          console.warn(`Failed to process temp file ${file.name}:`, error);
        }
      }

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabaseClient.storage
          .from(this.VISUALS_BUCKET)
          .remove(filesToDelete);

        if (deleteError) {
          console.error('Failed to delete temp files:', deleteError);
        } else {
          console.log(`Deleted ${filesToDelete.length} temp files`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Get storage usage for user
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    try {
      const { data, error } = await (supabaseClient as any)
        .rpc('get_user_storage_usage', {
          user_uuid: userId
        });

      if (error) {
        console.error('Failed to calculate storage usage:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return 0;
    }
  }

  /**
   * Record visual file in tracking table
   */
  private async recordVisualFile(
    userId: string,
    projectId: string,
    visualId: string,
    result: UploadResult
  ): Promise<void> {
    try {
      // Record original file
      await (supabaseClient as any).rpc('create_visual_file', {
        visual_uuid: visualId,
        user_uuid: userId,
        project_uuid: projectId,
        file_type_param: 'original',
        format_param: null,
        file_path_param: result.metadata.fullPath,
        file_name_param: result.metadata.name,
        content_type_param: result.metadata.contentType,
        file_size_param: result.metadata.size,
        public_url_param: result.originalUrl,
        metadata_param: result.metadata.customMetadata || {}
      });

      // Record thumbnail if exists
      if (result.thumbnailUrl) {
        await (supabaseClient as any).rpc('create_visual_file', {
          visual_uuid: visualId,
          user_uuid: userId,
          project_uuid: projectId,
          file_type_param: 'thumbnail',
          format_param: null,
          file_path_param: result.thumbnailUrl,
          file_name_param: `${result.metadata.name}_thumbnail`,
          content_type_param: 'image/jpeg',
          file_size_param: null,
          public_url_param: result.thumbnailUrl,
          metadata_param: {}
        });
      }

      // Record variants if exist
      if (result.variants) {
        for (const [format, url] of Object.entries(result.variants)) {
          await (supabaseClient as any).rpc('create_visual_file', {
            visual_uuid: visualId,
            user_uuid: userId,
            project_uuid: projectId,
            file_type_param: 'variant',
            format_param: format,
            file_path_param: url,
            file_name_param: `${result.metadata.name}_${format}`,
            content_type_param: 'image/jpeg',
            file_size_param: null,
            public_url_param: url,
            metadata_param: { format }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to record visual files:', error);
      // Don't throw - this is just for tracking
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();
export default supabaseStorageService;