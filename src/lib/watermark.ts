/**
 * Watermark Utility for Piktor
 * Adds "Piktor" watermark to images for free tier users
 */

import sharp from 'sharp';

export interface WatermarkOptions {
  text?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  fontSize?: number;
  opacity?: number;
  padding?: number;
}

const DEFAULT_OPTIONS: Required<WatermarkOptions> = {
  text: 'Piktor',
  position: 'bottom-left',
  fontSize: 40,
  opacity: 0.6,
  padding: 30,
};

/**
 * Create an SVG text element for the watermark
 */
function createWatermarkSVG(text: string, fontSize: number, opacity: number): string {
  // Calculate approximate SVG dimensions (text width estimation)
  const estimatedWidth = text.length * fontSize * 0.7; // More accurate estimate
  const svgHeight = fontSize * 1.3; // Add some padding

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(estimatedWidth)}" height="${Math.ceil(svgHeight)}">
      <text
        x="0"
        y="${fontSize}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
        fill-opacity="${opacity}"
        stroke="rgba(0,0,0,0.3)"
        stroke-width="1"
      >
        ${text}
      </text>
    </svg>
  `;
}

/**
 * Add watermark to a base64 image
 * @param imageDataUrl Base64 data URL of the image
 * @param options Watermark options
 * @returns Base64 data URL with watermark applied
 */
export async function addWatermarkToBase64(
  imageDataUrl: string,
  options: WatermarkOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Extract base64 data from data URL
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // Create watermark SVG
    const watermarkSVG = Buffer.from(createWatermarkSVG(opts.text, opts.fontSize, opts.opacity));

    // Calculate watermark position
    let left = opts.padding;
    let top = height - opts.fontSize - opts.padding;

    switch (opts.position) {
      case 'bottom-left':
        left = opts.padding;
        top = height - opts.fontSize - opts.padding;
        break;
      case 'bottom-right':
        // Estimate text width (rough approximation: fontSize * 0.6 per character)
        const estimatedWidth = opts.text.length * opts.fontSize * 0.6;
        left = width - estimatedWidth - opts.padding;
        top = height - opts.fontSize - opts.padding;
        break;
      case 'top-left':
        left = opts.padding;
        top = opts.padding;
        break;
      case 'top-right':
        const estimatedWidthTop = opts.text.length * opts.fontSize * 0.6;
        left = width - estimatedWidthTop - opts.padding;
        top = opts.padding;
        break;
    }

    // Apply watermark
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([{
        input: watermarkSVG,
        top: Math.round(top),
        left: Math.round(left),
      }])
      .toBuffer();

    // Convert back to base64 data URL
    const base64 = watermarkedBuffer.toString('base64');
    const mimeType = metadata.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('[Watermark] Error adding watermark:', error);
    // Return original image if watermarking fails
    return imageDataUrl;
  }
}

/**
 * Add watermark to an image URL by fetching and processing it
 * @param imageUrl URL of the image
 * @param options Watermark options
 * @returns Base64 data URL with watermark applied
 */
export async function addWatermarkToUrl(
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to base64 data URL
    const mimeType = response.headers.get('content-type') || 'image/png';
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Apply watermark
    return await addWatermarkToBase64(dataUrl, options);
  } catch (error) {
    console.error('[Watermark] Error processing URL:', error);
    throw error;
  }
}

/**
 * Check if user should have watermark applied based on plan
 * @param planId User's subscription plan ID
 * @returns true if watermark should be applied
 */
export function shouldApplyWatermark(planId: string): boolean {
  // Only free tier gets watermark
  return planId === 'free';
}
