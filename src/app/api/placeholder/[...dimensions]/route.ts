import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dimensions: string[] }> }
) {
  try {
    // Extract dimensions from the path
    const resolvedParams = await params;
    const [width, height] = resolvedParams.dimensions.map(d => parseInt(d, 10));

    // Validate dimensions
    if (!width || !height || width > 2000 || height > 2000) {
      return new NextResponse('Invalid dimensions', { status: 400 });
    }

    // Generate a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <g opacity="0.5">
          <circle cx="${width/2}" cy="${height/2 - 15}" r="20" fill="#d1d5db"/>
          <rect x="${width/2 - 25}" y="${height/2 + 10}" width="50" height="4" rx="2" fill="#d1d5db"/>
          <rect x="${width/2 - 15}" y="${height/2 + 18}" width="30" height="3" rx="1.5" fill="#e5e7eb"/>
        </g>
        <text x="${width/2}" y="${height - 10}" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="12">${width}×${height}</text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}