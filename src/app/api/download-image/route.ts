import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for downloading images from BFL delivery URLs
 * This is needed because BFL delivery URLs don't support CORS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const filename = searchParams.get('filename');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Validate that the URL is from BFL delivery endpoints
    const allowedDomains = ['delivery-eu1.bfl.ai', 'delivery-us1.bfl.ai'];
    const urlObj = new URL(imageUrl);
    
    if (!allowedDomains.includes(urlObj.hostname)) {
      return NextResponse.json(
        { error: 'Invalid image URL domain' },
        { status: 400 }
      );
    }

    // Fetch the image from BFL delivery URL
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with appropriate headers for download
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': filename 
          ? `attachment; filename="${filename}"`
          : 'attachment',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    );
  }
}