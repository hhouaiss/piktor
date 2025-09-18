/**
 * Utility functions for generating placeholder images
 */

/**
 * Generate a data URL for a placeholder image
 */
export function generatePlaceholderDataUrl(width: number, height: number, color = '#f3f4f6'): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <g opacity="0.5">
        <circle cx="${width/2}" cy="${height/2 - 15}" r="20" fill="#d1d5db"/>
        <rect x="${width/2 - 25}" y="${height/2 + 10}" width="50" height="4" rx="2" fill="#d1d5db"/>
        <rect x="${width/2 - 15}" y="${height/2 + 18}" width="30" height="3" rx="1.5" fill="#e5e7eb"/>
      </g>
      <text x="${width/2}" y="${height - 10}" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="12">${width}×${height}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Common placeholder sizes
 */
export const PLACEHOLDER_SIZES = {
  thumbnail: { width: 300, height: 200 },
  small: { width: 150, height: 100 },
  medium: { width: 600, height: 400 },
  large: { width: 1200, height: 800 },
} as const;

/**
 * Get a placeholder data URL for common sizes
 */
export function getPlaceholderUrl(size: keyof typeof PLACEHOLDER_SIZES): string {
  const { width, height } = PLACEHOLDER_SIZES[size];
  return generatePlaceholderDataUrl(width, height);
}

/**
 * Generate a shimmer/blur placeholder for better UX
 */
export function generateShimmerDataUrl(width: number, height: number): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#e5e7eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
        </linearGradient>
        <animateTransform
          attributeName="gradientTransform"
          type="translate"
          values="-100 0; 100 0; -100 0"
          dur="2s"
          repeatCount="indefinite"/>
      </defs>
      <rect width="100%" height="100%" fill="url(#shimmer)"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}