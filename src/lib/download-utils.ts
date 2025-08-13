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
 * Validate a BFL image URL for download compatibility
 */
export function validateBFLImageUrl(imageUrl: string): DownloadValidationResult {
  const result: DownloadValidationResult = {
    isValid: false,
    issues: [],
    recommendations: [],
    url: imageUrl,
    domain: ''
  };

  try {
    const urlObj = new URL(imageUrl);
    result.domain = urlObj.hostname;

    // Check if it's a valid BFL domain
    const allowedDomains = [
      'delivery-eu1.bfl.ai',
      'delivery-us1.bfl.ai', 
      'delivery.bfl.ai',
      'cdn.bfl.ai',
      'static.bfl.ai',
      'images.bfl.ai',
      'assets.bfl.ai'
    ];
    
    const isValidDomain = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    if (!isValidDomain) {
      result.issues.push(`Domain '${urlObj.hostname}' is not in the allowed BFL domains list`);
      result.recommendations.push('Ensure the image URL is from a valid BFL delivery endpoint');
    }

    // Check URL structure
    if (!urlObj.pathname.includes('/')) {
      result.issues.push('URL path appears to be invalid');
      result.recommendations.push('Verify the complete BFL delivery URL is being used');
    }

    // Check for HTTPS
    if (urlObj.protocol !== 'https:') {
      result.issues.push('URL must use HTTPS protocol');
      result.recommendations.push('Ensure the URL starts with https://');
    }

    result.isValid = result.issues.length === 0;

  } catch {
    result.issues.push('Invalid URL format');
    result.recommendations.push('Check that the URL is properly formatted');
  }

  return result;
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