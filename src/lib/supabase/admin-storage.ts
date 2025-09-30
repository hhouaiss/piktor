import { supabaseAdmin } from './config';
import type { UploadOptions, UploadResult, ImageVariant } from './storage';

/**
 * Server-side storage service using Supabase Admin client
 * This service is designed to work in serverless environments like Vercel
 */
class SupabaseAdminStorageService {
  // Storage buckets
  private readonly VISUALS_BUCKET = 'visuals';
  private readonly TEMP_BUCKET = 'temp';

  // Storage paths
  private readonly USERS_PATH = 'users';
  private readonly VISUALS_PATH = 'visuals';
  private readonly THUMBNAILS_PATH = 'thumbnails';
  private readonly TEMP_PATH = 'temp';

  /**
   * Upload an image using Supabase Admin client (server-side)
   */
  async uploadVisualImage(
    userId: string,
    projectId: string | null,
    visualId: string,
    imageBlob: Blob,
    options?: UploadOptions
  ): Promise<UploadResult> {
    console.log('[SupabaseAdminStorageService] Starting uploadVisualImage:', {
      userId,
      projectId,
      visualId,
      blobSize: imageBlob.size,
      blobType: imageBlob.type,
      optionsProvided: !!options
    });

    const projectPath = projectId || 'dashboard';
    const originalPath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectPath}/${visualId}/original.jpg`;
    console.log('[SupabaseAdminStorageService] Upload path:', originalPath);

    try {
      console.log('[SupabaseAdminStorageService] Starting upload to Supabase Storage...');

      // Upload original image using admin client (bypasses RLS)
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
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
        console.error('[SupabaseAdminStorageService] Upload failed:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('[SupabaseAdminStorageService] Upload completed successfully:', uploadData);

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(this.VISUALS_BUCKET)
        .getPublicUrl(originalPath);

      const originalUrl = urlData.publicUrl;

      console.log('[SupabaseAdminStorageService] Public URL obtained:', {
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

      // For server-side uploads, we typically don't generate thumbnails/variants
      // as these require Canvas API which is not available server-side
      // The client can generate these later if needed

      // Use original image as thumbnail on server side
      if (options?.generateThumbnail) {
        console.log('[SupabaseAdminStorageService] Using original image as thumbnail (server environment)');
        result.thumbnailUrl = result.originalUrl;
      }

      // Create variant URLs pointing to the original image on server side
      if (options?.variants && options.variants.length > 0) {
        console.log('[SupabaseAdminStorageService] Creating variant URLs (server environment)');
        const variants: Record<string, string> = {};
        options.variants.forEach(variant => {
          variants[variant.format] = result.originalUrl;
        });
        result.variants = variants;
      }

      // Record the file in our tracking table using admin client
      try {
        await this.recordVisualFile(userId, projectId, visualId, result);
      } catch (error) {
        console.warn('[SupabaseAdminStorageService] Failed to record visual file:', error);
        // Don't throw - file upload was successful
      }

      console.log('[SupabaseAdminStorageService] uploadVisualImage completed successfully:', {
        originalUrl: result.originalUrl,
        thumbnailUrl: result.thumbnailUrl,
        variantCount: Object.keys(result.variants || {}).length,
        fileSize: result.metadata.size
      });

      return result;
    } catch (error) {
      console.error('[SupabaseAdminStorageService] Upload failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalPath,
        blobSize: imageBlob.size,
        blobType: imageBlob.type
      });
      throw error;
    }
  }

  /**
   * Upload image from URL (for API-generated images)
   * Supports both HTTP URLs and data URLs (base64)
   */
  async uploadImageFromUrl(
    userId: string,
    projectId: string | null,
    visualId: string,
    imageUrl: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    // Trim whitespace from URL
    const cleanUrl = imageUrl.trim();

    console.log('[SupabaseAdminStorageService] Starting uploadImageFromUrl:', {
      userId,
      projectId,
      visualId,
      imageUrlType: cleanUrl.startsWith('data:') ? 'data_url' : 'http_url',
      imageUrlLength: cleanUrl.length,
      imageUrlPrefix: cleanUrl.substring(0, 100) + '...',
      hasWhitespace: imageUrl !== cleanUrl
    });

    try {
      let imageBuffer: Buffer;
      let mimeType: string;

      // Handle data URLs (base64 encoded images)
      if (cleanUrl.startsWith('data:')) {
        console.log('[SupabaseAdminStorageService] Converting data URL to Buffer...');

        // Extract mime type and base64 data (use cleanUrl)
        const matches = cleanUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error(`Invalid data URL format. URL starts with: ${cleanUrl.substring(0, 50)}`);
        }

        mimeType = matches[1];
        const base64Data = matches[2];

        // Convert base64 to buffer
        imageBuffer = Buffer.from(base64Data, 'base64');

        console.log('[SupabaseAdminStorageService] Data URL converted to Buffer:', {
          size: imageBuffer.length,
          mimeType
        });
      } else {
        // Handle regular HTTP URLs
        console.log('[SupabaseAdminStorageService] Fetching image from HTTP URL...');
        const response = await fetch(cleanUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        imageBuffer = Buffer.from(await response.arrayBuffer());
        mimeType = response.headers.get('content-type') || 'image/jpeg';

        console.log('[SupabaseAdminStorageService] Image fetched successfully:', {
          size: imageBuffer.length,
          type: mimeType
        });
      }

      // Create a Blob-like object for compatibility with uploadVisualImage
      const blob = new Blob([imageBuffer], { type: mimeType });

      return await this.uploadVisualImage(userId, projectId, visualId, blob, options);
    } catch (error) {
      console.error('[SupabaseAdminStorageService] Failed to upload image from URL:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        imageUrlType: cleanUrl.startsWith('data:') ? 'data_url' : 'http_url',
        imageUrlPrefix: cleanUrl.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  /**
   * Delete visual images and variants
   */
  async deleteVisualImages(
    userId: string,
    projectId: string | null,
    visualId: string
  ): Promise<void> {
    try {
      // Delete files from storage bucket
      const basePath = `${this.USERS_PATH}/${userId}`;
      const projectPath = projectId || 'dashboard';
      const visualsPath = `${basePath}/${this.VISUALS_PATH}/${projectPath}/${visualId}`;
      const thumbnailPath = `${basePath}/${this.THUMBNAILS_PATH}/${projectPath}/${visualId}.jpg`;

      // List all files in the visual folder
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from(this.VISUALS_BUCKET)
        .list(visualsPath);

      if (!listError && files) {
        // Delete all files in the visual folder
        const filePaths = files.map(file => `${visualsPath}/${file.name}`);
        if (filePaths.length > 0) {
          const { error: deleteError } = await supabaseAdmin.storage
            .from(this.VISUALS_BUCKET)
            .remove(filePaths);

          if (deleteError) {
            console.error('Error deleting visual files:', deleteError);
          }
        }
      }

      // Delete thumbnail
      const { error: thumbnailError } = await supabaseAdmin.storage
        .from(this.VISUALS_BUCKET)
        .remove([thumbnailPath]);

      if (thumbnailError && thumbnailError.message !== 'The resource was not found') {
        console.warn('Error deleting thumbnail:', thumbnailError);
      }

      // Delete records from visual_files table using admin client
      const { error: dbError } = await (supabaseAdmin as any)
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
    projectId: string | null,
    visualId: string,
    filename: string = 'original.jpg'
  ): Promise<string> {
    const projectPath = projectId || 'dashboard';
    const imagePath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectPath}/${visualId}/${filename}`;

    const { data, error } = await supabaseAdmin.storage
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

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
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

    const { data: urlData } = supabaseAdmin.storage
      .from(this.VISUALS_BUCKET)
      .getPublicUrl(tempPath);

    return urlData.publicUrl;
  }

  /**
   * Get storage usage for user
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    try {
      const { data, error } = await (supabaseAdmin as any)
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
   * Record visual file in tracking table using admin client
   */
  private async recordVisualFile(
    userId: string,
    projectId: string | null,
    visualId: string,
    result: UploadResult
  ): Promise<void> {
    try {
      // Record original file
      await (supabaseAdmin as any).rpc('create_visual_file', {
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
      if (result.thumbnailUrl && result.thumbnailUrl !== result.originalUrl) {
        await (supabaseAdmin as any).rpc('create_visual_file', {
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
          if (url !== result.originalUrl) { // Don't duplicate if pointing to original
            await (supabaseAdmin as any).rpc('create_visual_file', {
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
      }
    } catch (error) {
      console.warn('Failed to record visual files:', error);
      // Don't throw - this is just for tracking
    }
  }
}

export const supabaseAdminStorageService = new SupabaseAdminStorageService();
export default supabaseAdminStorageService;