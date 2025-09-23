import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  type StorageReference,
  type UploadTask,
  type UploadTaskSnapshot
} from 'firebase/storage';

import { getFirebaseStorage } from './config';

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

class StorageService {
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
    console.log('[StorageService] Starting uploadVisualImage:', {
      userId,
      projectId,
      visualId,
      blobSize: imageBlob.size,
      blobType: imageBlob.type,
      optionsProvided: !!options
    });
    
    const originalPath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/original`;
    console.log('[StorageService] Upload path:', originalPath);
    
    const originalRef = ref(getFirebaseStorage(), originalPath);

    // Prepare metadata
    const metadata = {
      contentType: imageBlob.type,
      customMetadata: {
        userId,
        projectId,
        visualId,
        uploadedAt: new Date().toISOString(),
        ...options?.metadata
      }
    };
    
    console.log('[StorageService] Upload metadata:', metadata);

    // Upload original image
    let uploadTask: UploadTask;
    
    try {
      console.log('[StorageService] Starting upload to Firebase Storage...');
      
      if (options?.onProgress) {
        uploadTask = uploadBytesResumable(originalRef, imageBlob, metadata);
        
        uploadTask.on('state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[StorageService] Upload progress: ${progress.toFixed(2)}%`);
            options.onProgress!({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes
            });
          },
          (error) => {
            console.error('[StorageService] Upload error:', {
              code: error.code,
              message: error.message,
              stack: error.stack
            });
            throw error;
          }
        );
        
        await uploadTask;
        console.log('[StorageService] Resumable upload completed successfully');
      } else {
        await uploadBytes(originalRef, imageBlob, metadata);
        console.log('[StorageService] Direct upload completed successfully');
      }
    } catch (error) {
      console.error('[StorageService] Upload failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any).code,
        serverResponse: (error as any).serverResponse,
        originalPath,
        blobSize: imageBlob.size,
        blobType: imageBlob.type
      });
      throw error;
    }

    // Get download URL for original with retry logic
    console.log('[StorageService] Getting download URL...');
    let originalUrl: string = '';
    let fileMetadata: any;

    try {
      // Add retry logic for URL generation (sometimes Firebase Storage needs a moment)
      let urlRetries = 3;
      while (urlRetries > 0) {
        try {
          originalUrl = await getDownloadURL(originalRef);
          console.log('[StorageService] Download URL obtained:', {
            url: originalUrl,
            isFirebaseUrl: originalUrl.includes('firebasestorage.googleapis.com'),
            urlLength: originalUrl.length
          });

          // Validate the URL format
          if (!originalUrl.includes('firebasestorage.googleapis.com')) {
            throw new Error('Invalid Firebase Storage URL format');
          }

          break;
        } catch (urlError) {
          urlRetries--;
          if (urlRetries === 0) {
            throw urlError;
          }
          console.warn(`[StorageService] URL generation attempt failed, retrying... (${urlRetries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Get metadata
      console.log('[StorageService] Getting file metadata...');
      fileMetadata = await getMetadata(originalRef);
      console.log('[StorageService] File metadata obtained:', {
        size: fileMetadata.size,
        contentType: fileMetadata.contentType,
        fullPath: fileMetadata.fullPath,
        name: fileMetadata.name
      });
    } catch (error) {
      console.error('[StorageService] Failed to get URL or metadata:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any).code,
        originalPath,
        blobSize: imageBlob.size,
        blobType: imageBlob.type
      });
      throw error;
    }

    const result: UploadResult = {
      originalUrl,
      metadata: {
        size: fileMetadata.size,
        contentType: fileMetadata.contentType || 'image/jpeg',
        fullPath: fileMetadata.fullPath,
        name: fileMetadata.name,
        timeCreated: fileMetadata.timeCreated,
        customMetadata: fileMetadata.customMetadata
      }
    };

    // Generate thumbnail if requested (only in browser environment)
    if (options?.generateThumbnail && typeof window !== 'undefined') {
      try {
        console.log('[StorageService] Generating thumbnail...');
        const thumbnailUrl = await this.generateThumbnail(
          originalRef,
          userId,
          projectId,
          visualId
        );
        result.thumbnailUrl = thumbnailUrl;
        console.log('[StorageService] Thumbnail generated successfully:', thumbnailUrl);
      } catch (error) {
        console.warn('[StorageService] Failed to generate thumbnail:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    } else if (options?.generateThumbnail) {
      console.log('[StorageService] Thumbnail generation skipped - server environment detected');
      // On server side, use original image as thumbnail
      result.thumbnailUrl = result.originalUrl;
    }

    // Generate variants if requested (only in browser environment)
    if (options?.variants && options.variants.length > 0 && typeof window !== 'undefined') {
      try {
        console.log('[StorageService] Generating variants:', options.variants.length);
        const variants = await this.generateVariants(
          originalRef,
          userId,
          projectId,
          visualId,
          options.variants
        );
        result.variants = variants;
        console.log('[StorageService] Variants generated successfully:', Object.keys(variants));
      } catch (error) {
        console.warn('[StorageService] Failed to generate variants:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    } else if (options?.variants && options.variants.length > 0) {
      console.log('[StorageService] Variant generation skipped - server environment detected');
      // On server side, create variant URLs pointing to the original image
      const variants: Record<string, string> = {};
      options.variants.forEach(variant => {
        variants[variant.format] = result.originalUrl;
      });
      result.variants = variants;
      console.log('[StorageService] Variants mapped to original URL for server environment:', Object.keys(variants));
    }

    console.log('[StorageService] uploadVisualImage completed successfully:', {
      originalUrl: result.originalUrl,
      thumbnailUrl: result.thumbnailUrl,
      variantCount: Object.keys(result.variants || {}).length,
      fileSize: result.metadata.size
    });
    
    return result;
  }

  /**
   * Generate thumbnail from original image
   */
  private async generateThumbnail(
    originalRef: StorageReference,
    userId: string,
    projectId: string,
    visualId: string
  ): Promise<string> {
    // Get original image
    const originalUrl = await getDownloadURL(originalRef);
    
    // Create thumbnail using Canvas API
    const thumbnailBlob = await this.createThumbnail(originalUrl, 400, 400);
    
    // Upload thumbnail
    const thumbnailPath = `${this.USERS_PATH}/${userId}/${this.THUMBNAILS_PATH}/${projectId}/${visualId}`;
    const thumbnailRef = ref(getFirebaseStorage(), thumbnailPath);
    
    await uploadBytes(thumbnailRef, thumbnailBlob, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId,
        projectId,
        visualId,
        type: 'thumbnail',
        createdAt: new Date().toISOString()
      }
    });

    return await getDownloadURL(thumbnailRef);
  }

  /**
   * Generate image variants (different formats/sizes)
   */
  private async generateVariants(
    originalRef: StorageReference,
    userId: string,
    projectId: string,
    visualId: string,
    variants: ImageVariant[]
  ): Promise<Record<string, string>> {
    const originalUrl = await getDownloadURL(originalRef);
    const results: Record<string, string> = {};

    for (const variant of variants) {
      try {
        const variantBlob = await this.createVariant(
          originalUrl,
          variant.width,
          variant.height,
          variant.quality || 0.9
        );

        const variantPath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/${variant.format}`;
        const variantRef = ref(getFirebaseStorage(), variantPath);

        await uploadBytes(variantRef, variantBlob, {
          contentType: 'image/jpeg',
          customMetadata: {
            userId,
            projectId,
            visualId,
            format: variant.format,
            width: variant.width.toString(),
            height: variant.height.toString(),
            createdAt: new Date().toISOString()
          }
        });

        results[variant.format] = await getDownloadURL(variantRef);
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
    console.log('[StorageService] Starting uploadImageFromUrl:', {
      userId,
      projectId,
      visualId,
      imageUrl: imageUrl.substring(0, 100) + '...'
    });
    
    try {
      // Fetch image from URL
      console.log('[StorageService] Fetching image from URL...');
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('[StorageService] Image fetched successfully:', {
        size: blob.size,
        type: blob.type
      });
      
      return await this.uploadVisualImage(userId, projectId, visualId, blob, options);
    } catch (error) {
      console.error('[StorageService] Failed to upload image from URL:', {
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
      // Delete from visuals folder
      const visualsRef = ref(getFirebaseStorage(), `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}`);
      await this.deleteFolder(visualsRef);

      // Delete thumbnail
      const thumbnailRef = ref(getFirebaseStorage(), `${this.USERS_PATH}/${userId}/${this.THUMBNAILS_PATH}/${projectId}/${visualId}`);
      await this.deleteObjectSilently(thumbnailRef);
    } catch (error) {
      console.error('Failed to delete visual images:', error);
      throw error;
    }
  }

  /**
   * Delete a folder and all its contents
   */
  private async deleteFolder(folderRef: StorageReference): Promise<void> {
    try {
      const result = await listAll(folderRef);
      
      // Delete all files in the folder
      const deletePromises = result.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);

      // Recursively delete subfolders
      const deleteFolderPromises = result.prefixes.map(prefix => this.deleteFolder(prefix));
      await Promise.all(deleteFolderPromises);
    } catch (error) {
      console.warn('Some files could not be deleted:', error);
    }
  }

  /**
   * Delete object without throwing error if not found
   */
  private async deleteObjectSilently(objectRef: StorageReference): Promise<void> {
    try {
      await deleteObject(objectRef);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        throw error;
      }
    }
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(
    userId: string,
    projectId: string,
    visualId: string,
    filename: string = 'original'
  ): Promise<string> {
    const imagePath = `${this.USERS_PATH}/${userId}/${this.VISUALS_PATH}/${projectId}/${visualId}/${filename}`;
    const imageRef = ref(getFirebaseStorage(), imagePath);
    
    return await getDownloadURL(imageRef);
  }

  /**
   * Upload temporary image (for processing)
   */
  async uploadTempImage(blob: Blob, filename?: string): Promise<string> {
    const tempFilename = filename || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempRef = ref(getFirebaseStorage(), `${this.TEMP_PATH}/${tempFilename}`);
    
    await uploadBytes(tempRef, blob);
    return await getDownloadURL(tempRef);
  }

  /**
   * Clean up temporary files older than 24 hours
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const tempRef = ref(getFirebaseStorage(), this.TEMP_PATH);
      const result = await listAll(tempRef);
      
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      for (const item of result.items) {
        try {
          const metadata = await getMetadata(item);
          const createdAt = new Date(metadata.timeCreated).getTime();
          
          if (createdAt < oneDayAgo) {
            await deleteObject(item);
            console.log(`Deleted temp file: ${item.name}`);
          }
        } catch (error) {
          console.warn(`Failed to process temp file ${item.name}:`, error);
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
      const userRef = ref(getFirebaseStorage(), `${this.USERS_PATH}/${userId}`);
      const result = await listAll(userRef);
      
      let totalSize = 0;
      
      for (const item of result.items) {
        try {
          const metadata = await getMetadata(item);
          totalSize += metadata.size;
        } catch (error) {
          console.warn(`Failed to get metadata for ${item.name}:`, error);
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return 0;
    }
  }
}

export const storageService = new StorageService();
export default storageService;