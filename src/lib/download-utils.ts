/**
 * Utilities for handling image downloads and troubleshooting
 * Provides validation, error handling, and debugging for BFL image URLs
 */

export interface DownloadValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  url: string;
  domain: string;
}

/**
 * Validate an image URL for download compatibility (supports both HTTP URLs and data URLs)
 */
export function validateImageUrl(imageUrl: string): DownloadValidationResult {
  const result: DownloadValidationResult = {
    isValid: false,
    issues: [],
    recommendations: [],
    url: imageUrl,
    domain: ''
  };

  // Handle data URLs (from Gemini API)
  if (imageUrl.startsWith('data:')) {
    try {
      const dataUrlRegex = /^data:([a-zA-Z0-9][a-zA-Z0-9\/+\-]*);base64,(.*)$/;
      const match = imageUrl.match(dataUrlRegex);
      
      if (!match) {
        result.issues.push('Invalid data URL format');
        result.recommendations.push('Data URL should be in format: data:image/jpeg;base64,<base64data>');
        return result;
      }
      
      const [, mimeType, base64Data] = match;
      result.domain = 'data-url';
      
      // Validate MIME type
      if (!mimeType.startsWith('image/')) {
        result.issues.push(`Invalid MIME type: ${mimeType}. Expected image/* type`);
        result.recommendations.push('Ensure the data URL contains valid image data');
      }
      
      // Validate base64 data
      if (!base64Data || base64Data.length < 100) {
        result.issues.push('Base64 data appears to be too short or missing');
        result.recommendations.push('Ensure the data URL contains valid base64 encoded image data');
      }
      
      // Try to validate base64 format
      try {
        atob(base64Data.substring(0, 100)); // Test first 100 chars
      } catch {
        result.issues.push('Invalid base64 encoding in data URL');
        result.recommendations.push('Ensure the base64 data is properly encoded');
      }
      
      result.isValid = result.issues.length === 0;
      return result;
    } catch {
      result.issues.push('Error parsing data URL');
      result.recommendations.push('Check that the data URL is properly formatted');
      return result;
    }
  }

  // Handle HTTP/HTTPS URLs (for backward compatibility)
  try {
    const urlObj = new URL(imageUrl);
    result.domain = urlObj.hostname;

    // Check for HTTPS
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      result.issues.push('URL must use HTTP or HTTPS protocol');
      result.recommendations.push('Ensure the URL starts with https:// or http://');
    }

    // Basic URL structure validation
    if (!urlObj.pathname || urlObj.pathname === '/') {
      result.issues.push('URL path appears to be invalid');
      result.recommendations.push('Ensure the URL points to a specific image file');
    }

    result.isValid = result.issues.length === 0;

  } catch {
    result.issues.push('Invalid URL format');
    result.recommendations.push('Check that the URL is properly formatted');
  }

  return result;
}

/**
 * Legacy function for BFL image URL validation - now redirects to validateImageUrl
 * @deprecated Use validateImageUrl instead
 */
export function validateBFLImageUrl(imageUrl: string): DownloadValidationResult {
  return validateImageUrl(imageUrl);
}

/**
 * Generate a safe filename for download
 */
export function generateSafeFilename(
  productName: string, 
  contextPreset: string, 
  variation?: number,
  extension: string = 'jpg'
): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const safeName = productName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const variationSuffix = variation ? `-v${variation}` : '';
  
  return `piktor-${safeName}-${contextPreset}${variationSuffix}-${timestamp}.${extension}`;
}

/**
 * Test if a URL is accessible (client-side only)
 */
export async function testImageUrlAccessibility(imageUrl: string): Promise<{
  accessible: boolean;
  error?: string;
  status?: number;
}> {
  try {
    const response = await fetch(`/api/download-image/debug?url=${encodeURIComponent(imageUrl)}`);
    const result = await response.json();
    
    return {
      accessible: result.summary?.canDownload || false,
      error: result.summary?.issues?.join(', '),
      status: response.status
    };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Enhanced error messages for common download failures
 */
export function getDownloadErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('404') || message.includes('not found')) {
      return 'Image not found. The image may have expired or been removed from BFL servers.';
    }
    
    if (message.includes('403') || message.includes('forbidden')) {
      return 'Access denied. The image URL may have expired or access permissions changed.';
    }
    
    if (message.includes('invalid image url domain')) {
      return 'Invalid image source. Only images from BFL delivery endpoints can be downloaded.';
    }
    
    if (message.includes('cors') || message.includes('cross-origin')) {
      return 'Cross-origin error. The image source does not allow direct downloads.';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Download timed out. The image server may be slow or unreachable.';
    }
    
    return error.message;
  }

  return 'An unexpected error occurred during download.';
}

/**
 * Retry logic for failed downloads
 */
export async function downloadWithRetry(
  downloadFn: () => Promise<void>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await downloadFn();
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Download attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError || new Error('Download failed after retries');
}