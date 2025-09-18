import { NextRequest, NextResponse } from 'next/server';

/**
 * Enterprise-grade proxy endpoint for downloading images from BFL delivery URLs
 * Handles CORS, URL validation, error recovery, and provides detailed logging
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let imageUrl = '';
  let filename = '';
  
  try {
    const { searchParams } = new URL(request.url);
    imageUrl = searchParams.get('url') || '';
    filename = searchParams.get('filename') || 'image.jpg';

    console.log(`[Download] Starting download request for: ${imageUrl}`);
    console.log(`[Download] Requested filename: ${filename}`);

    if (!imageUrl) {
      console.error('[Download] No image URL provided');
      return NextResponse.json(
        { 
          error: 'Image URL is required',
          details: 'Please provide a valid image URL in the url parameter'
        },
        { status: 400 }
      );
    }

    let urlObj: URL;
    try {
      urlObj = new URL(imageUrl);
    } catch (urlError) {
      console.error(`[Download] Invalid URL format: ${imageUrl}`, urlError);
      return NextResponse.json(
        { 
          error: 'Invalid URL format',
          details: `The provided URL is not valid: ${imageUrl}`
        },
        { status: 400 }
      );
    }

    // Expanded domain validation - support both BFL and Firebase Storage URLs
    const allowedDomains = [
      // BFL domains
      'delivery-eu1.bfl.ai',
      'delivery-us1.bfl.ai',
      'delivery.bfl.ai',
      'cdn.bfl.ai',
      'static.bfl.ai',
      'images.bfl.ai',
      'assets.bfl.ai',
      // Firebase Storage domains
      'firebasestorage.googleapis.com',
      'storage.googleapis.com'
    ];

    const isValidDomain = allowedDomains.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    if (!isValidDomain) {
      console.error(`[Download] Invalid domain: ${urlObj.hostname}`);
      console.error(`[Download] Allowed domains: ${allowedDomains.join(', ')}`);
      return NextResponse.json(
        {
          error: 'Invalid image URL domain',
          details: `Only BFL and Firebase Storage URLs are allowed. Got: ${urlObj.hostname}`,
          allowedDomains: allowedDomains
        },
        { status: 400 }
      );
    }

    console.log(`[Download] Domain validation passed for: ${urlObj.hostname}`);

    // Fetch the image from allowed URL with timeout and retry logic
    const fetchWithTimeout = async (url: string, timeoutMs: number = 30000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Piktor-Download-Service/1.0',
            'Accept': 'image/*,*/*;q=0.8',
            'Cache-Control': 'no-cache'
          }
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    let response: Response;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`[Download] Attempt ${attempts}/${maxAttempts} to fetch image`);
        response = await fetchWithTimeout(imageUrl, 30000);
        
        if (response.ok) {
          break;
        } else {
          console.warn(`[Download] Attempt ${attempts} failed with status: ${response.status}`);
          if (attempts === maxAttempts) {
            const errorText = await response.text().catch(() => 'No error details available');
            console.error(`[Download] Final attempt failed. Status: ${response.status}, Error: ${errorText}`);
            
            return NextResponse.json(
              {
                error: `Failed to fetch image: ${response.status}`,
                details: `HTTP ${response.status}: ${response.statusText}`,
                imageUrl: imageUrl,
                attempts: attempts,
                serverError: errorText
              },
              { status: response.status >= 400 && response.status < 500 ? response.status : 502 }
            );
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      } catch (fetchError) {
        console.error(`[Download] Attempt ${attempts} network error:`, fetchError);
        if (attempts === maxAttempts) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
          return NextResponse.json(
            { 
              error: 'Network error while fetching image',
              details: errorMessage,
              imageUrl: imageUrl,
              attempts: attempts
            },
            { status: 502 }
          );
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    console.log(`[Download] Successfully fetched image after ${attempts} attempts`);

    // Get image data with proper error handling
    let imageBuffer: ArrayBuffer;
    try {
      imageBuffer = await response!.arrayBuffer();
    } catch (bufferError) {
      console.error('[Download] Failed to read image buffer:', bufferError);
      return NextResponse.json(
        { 
          error: 'Failed to read image data',
          details: bufferError instanceof Error ? bufferError.message : 'Buffer read error'
        },
        { status: 502 }
      );
    }

    const contentType = response!.headers.get('content-type') || 'image/jpeg';
    const contentLength = imageBuffer.byteLength;
    
    console.log(`[Download] Image details: ${contentType}, ${contentLength} bytes`);
    console.log(`[Download] Download completed in ${Date.now() - startTime}ms`);

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Return the image with appropriate headers for download
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
        'Content-Length': contentLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour instead of 1 year
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Download] Unexpected error:', error);
    console.error(`[Download] Request failed after ${duration}ms`);
    console.error(`[Download] URL: ${imageUrl}`);
    console.error(`[Download] Filename: ${filename}`);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during image download',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        imageUrl: imageUrl,
        duration: duration
      },
      { status: 500 }
    );
  }
}