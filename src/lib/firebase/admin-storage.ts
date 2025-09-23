import { getAdminStorage } from './admin';
import type { UploadOptions, UploadResult, ImageVariant } from './storage';

/**
 * Server-side storage service using Firebase Admin SDK
 * This service is designed to work in serverless environments like Vercel
 */
class AdminStorageService {
  // Storage paths
  private readonly USERS_PATH = 'users';
  private readonly VISUALS_PATH = 'visuals';
  private readonly THUMBNAILS_PATH = 'thumbnails';
  private readonly TEMP_PATH = 'temp';

  /**
   * Upload an image using Firebase Admin SDK (server-side)
   */
  async uploadVisualImage(
    userId: string,
    projectId: string,
    visualId: string,
    imageBlob: Blob,
    options?: UploadOptions
  ): Promise<UploadResult> {
    console.log('[AdminStorageService] Starting uploadVisualImage:', {
      userId,
      projectId,
      visualId,
      blobSize: imageBlob.size,
      blobType: imageBlob.type,
      optionsProvided: !!options
    });

    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();

      const originalPath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/original`;
      console.log('[AdminStorageService] Upload path:', originalPath);

      // Convert Blob to Buffer for server-side upload
      const arrayBuffer = await imageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log('[AdminStorageService] Converted blob to buffer:', {
        bufferSize: buffer.length,
        blobSize: imageBlob.size,
        blobType: imageBlob.type
      });

      // Prepare metadata
      const metadata = {
        contentType: imageBlob.type || 'image/jpeg',
        metadata: {
          userId,
          projectId,
          visualId,
          uploadedAt: new Date().toISOString(),
          ...options?.metadata
        }
      };

      console.log('[AdminStorageService] Upload metadata:', metadata);

      // Create file reference
      const file = bucket.file(originalPath);

      // Upload the file with public access
      console.log('[AdminStorageService] Starting file upload...');
      await file.save(buffer, {
        metadata: metadata,
        resumable: false, // Use simple upload for better reliability in serverless
        validation: 'crc32c',
        public: true // Make file publicly accessible
      });

      console.log('[AdminStorageService] File uploaded successfully');

      // Get public URL for download
      console.log('[AdminStorageService] Generating download URL...');

      // Get download URL with retry logic
      let downloadUrl: string = '';
      let fileMetadata: any;
      let retries = 3;

      while (retries > 0) {
        try {
          // Make file publicly accessible and get public URL
          await file.makePublic();

          // Generate public URL
          downloadUrl = `https://storage.googleapis.com/${bucket.name}/${originalPath}`;
          console.log('[AdminStorageService] Generated public URL successfully');

          // Get file metadata
          [fileMetadata] = await file.getMetadata();
          console.log('[AdminStorageService] Retrieved file metadata:', {
            size: fileMetadata.size,
            contentType: fileMetadata.contentType,
            name: fileMetadata.name
          });

          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          console.warn(`[AdminStorageService] URL generation attempt failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!downloadUrl) {
        throw new Error('Failed to generate download URL after multiple attempts');
      }

      // Validate URL format
      if (!downloadUrl.includes('storage.googleapis.com') && !downloadUrl.includes('firebasestorage.googleapis.com')) {
        console.warn('[AdminStorageService] Generated URL might not be a standard Firebase Storage URL:', downloadUrl.substring(0, 100));
      } else {
        console.log('[AdminStorageService] Generated valid Firebase Storage URL');
      }

      const result: UploadResult = {
        originalUrl: downloadUrl,
        metadata: {
          size: parseInt(fileMetadata.size) || 0,
          contentType: fileMetadata.contentType || 'image/jpeg',
          fullPath: originalPath,
          name: fileMetadata.name || visualId,
          timeCreated: fileMetadata.timeCreated || new Date().toISOString(),
          customMetadata: fileMetadata.metadata || {}
        }
      };

      // For server-side, we'll use the original image as thumbnail
      // Client-side processing (Canvas API) is not available in serverless
      if (options?.generateThumbnail) {
        console.log('[AdminStorageService] Using original image as thumbnail (server-side)');
        result.thumbnailUrl = result.originalUrl;
      }

      // Generate variants URLs (pointing to original for server-side)
      if (options?.variants && options.variants.length > 0) {
        console.log('[AdminStorageService] Creating variant URLs (server-side)');
        const variants: Record<string, string> = {};
        options.variants.forEach(variant => {
          variants[variant.format] = result.originalUrl;
        });
        result.variants = variants;
      }

      console.log('[AdminStorageService] uploadVisualImage completed successfully:', {
        originalUrl: result.originalUrl,
        thumbnailUrl: result.thumbnailUrl,
        variantCount: Object.keys(result.variants || {}).length,
        fileSize: result.metadata.size,
        isSignedUrl: result.originalUrl.includes('googleapis.com')
      });

      return result;

    } catch (error) {
      console.error('[AdminStorageService] Upload failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        projectId,
        visualId,
        blobSize: imageBlob.size,
        blobType: imageBlob.type
      });
      throw error;
    }
  }

  /**
   * Upload image from URL using Admin SDK
   */
  async uploadImageFromUrl(
    userId: string,
    projectId: string,
    visualId: string,
    imageUrl: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    console.log('[AdminStorageService] Starting uploadImageFromUrl:', {
      userId,
      projectId,
      visualId,
      imageUrl: imageUrl.substring(0, 100) + '...'
    });

    try {
      // Fetch image from URL
      console.log('[AdminStorageService] Fetching image from URL...');
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('[AdminStorageService] Image fetched successfully:', {
        size: blob.size,
        type: blob.type
      });

      return await this.uploadVisualImage(userId, projectId, visualId, blob, options);
    } catch (error) {
      console.error('[AdminStorageService] Failed to upload image from URL:', {
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
      const storage = getAdminStorage();
      const bucket = storage.bucket();

      // Delete original image
      const originalPath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/original`;

      try {
        await bucket.file(originalPath).delete();
        console.log('[AdminStorageService] Deleted original image:', originalPath);
      } catch (error: any) {
        if (error.code !== 404) {
          console.warn('[AdminStorageService] Failed to delete original image:', error);
        }
      }

      // Delete thumbnail
      const thumbnailPath = `${this.USERS_PATH}/${userId}/${this.THUMBNAILS_PATH}/${projectId}/${visualId}`;

      try {
        await bucket.file(thumbnailPath).delete();
        console.log('[AdminStorageService] Deleted thumbnail:', thumbnailPath);
      } catch (error: any) {
        if (error.code !== 404) {
          console.warn('[AdminStorageService] Failed to delete thumbnail:', error);
        }
      }

      // Delete variants folder
      const variantPrefix = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/`;
      const [files] = await bucket.getFiles({ prefix: variantPrefix });

      for (const file of files) {
        try {
          await file.delete();
          console.log('[AdminStorageService] Deleted variant:', file.name);
        } catch (error: any) {
          if (error.code !== 404) {
            console.warn('[AdminStorageService] Failed to delete variant:', error);
          }
        }
      }

    } catch (error) {
      console.error('[AdminStorageService] Failed to delete visual images:', error);
      throw error;
    }
  }

  /**
   * Get public URL for download
   */
  async getSignedUrl(
    userId: string,
    projectId: string,
    visualId: string,
    filename: string = 'original'
  ): Promise<string> {
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();

      const imagePath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/${filename}`;
      const file = bucket.file(imagePath);

      // Make file public and return public URL
      await file.makePublic();
      return `https://storage.googleapis.com/${bucket.name}/${imagePath}`;
    } catch (error) {
      console.error('[AdminStorageService] Failed to get public URL:', error);
      throw error;
    }
  }

  /**
   * Upload temporary image
   */
  async uploadTempImage(blob: Blob, filename?: string): Promise<string> {
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();

      const tempFilename = filename || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempPath = `${this.TEMP_PATH}/${tempFilename}`;

      // Convert Blob to Buffer
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const file = bucket.file(tempPath);
      await file.save(buffer, {
        metadata: {
          contentType: blob.type || 'image/jpeg',
        },
        resumable: false,
        public: true
      });

      // Make file public and return public URL
      await file.makePublic();
      return `https://storage.googleapis.com/${bucket.name}/${tempPath}`;
    } catch (error) {
      console.error('[AdminStorageService] Failed to upload temp image:', error);
      throw error;
    }
  }

  /**
   * Get storage usage for user
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();

      const userPrefix = `${this.USERS_PATH}/${userId}/`;
      const [files] = await bucket.getFiles({ prefix: userPrefix });

      let totalSize = 0;

      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          totalSize += parseInt(metadata.size?.toString() || '0') || 0;
        } catch (error) {
          console.warn(`[AdminStorageService] Failed to get metadata for ${file.name}:`, error);
        }
      }

      return totalSize;
    } catch (error) {
      console.error('[AdminStorageService] Failed to calculate storage usage:', error);
      return 0;
    }
  }
}

export const adminStorageService = new AdminStorageService();
export default adminStorageService;