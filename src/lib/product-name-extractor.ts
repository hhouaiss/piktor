/**
 * Product Name Extractor
 *
 * Extracts product names from visual metadata for display purposes
 */

export interface VisualMetadata {
  prompt?: string;
  product?: {
    name?: string;
    category?: string;
  };
  contextPreset?: string;
  [key: string]: any;
}

/**
 * Extract product name from visual metadata
 * Priority:
 * 1. metadata.product.name (if exists)
 * 2. Extract from prompt using pattern matching
 * 3. Fallback to visual ID
 */
export function extractProductName(
  metadata: VisualMetadata | null | undefined,
  visualId: string,
  fallback?: string
): string {
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[extractProductName] Debug:', {
      hasMetadata: !!metadata,
      hasProduct: !!metadata?.product,
      productName: metadata?.product?.name,
      visualId: visualId?.substring(0, 20)
    });
  }

  // Check metadata.product.name first
  if (metadata?.product?.name) {
    return metadata.product.name;
  }

  // Try to extract from prompt
  if (metadata?.prompt) {
    const prompt = metadata.prompt;

    // Pattern 1: "Create a ... of [PRODUCT NAME]"
    const ofPattern = /(?:Create|Generate|Design).*?(?:of|for)\s+(?:a\s+)?([A-ZÀ-ÿ][a-zA-ZÀ-ÿ\s]{2,30})/i;
    const ofMatch = prompt.match(ofPattern);
    if (ofMatch && ofMatch[1]) {
      return cleanProductName(ofMatch[1]);
    }

    // Pattern 2: "PRODUCT NAME - [Category]" or "PRODUCT NAME ([Category])"
    const dashPattern = /^([A-ZÀ-ÿ][a-zA-ZÀ-ÿ\s]{2,30})\s*[-–—(]/;
    const dashMatch = prompt.match(dashPattern);
    if (dashMatch && dashMatch[1]) {
      return cleanProductName(dashMatch[1]);
    }

    // Pattern 3: Look for product types (furniture-specific)
    const furnitureTypes = [
      'canapé', 'sofa', 'table', 'chaise', 'chair', 'lit', 'bed',
      'armoire', 'wardrobe', 'commode', 'dresser', 'étagère', 'shelf',
      'bureau', 'desk', 'fauteuil', 'armchair', 'buffet', 'sideboard'
    ];

    for (const type of furnitureTypes) {
      const typeRegex = new RegExp(`\\b(${type}[a-zà-ÿ]*)\\b`, 'i');
      const typeMatch = prompt.match(typeRegex);
      if (typeMatch) {
        // Look for adjective before the type
        const adjectivePattern = new RegExp(
          `([A-ZÀ-ÿ][a-zà-ÿ]+)\\s+${typeMatch[1]}`,
          'i'
        );
        const adjMatch = prompt.match(adjectivePattern);
        if (adjMatch) {
          return cleanProductName(`${adjMatch[1]} ${typeMatch[1]}`);
        }
        return cleanProductName(typeMatch[1]);
      }
    }

    // Pattern 4: First meaningful capitalized phrase (up to 4 words)
    const firstPhrasePattern = /\b([A-ZÀ-ÿ][a-zA-ZÀ-ÿ]+(?:\s+[A-ZÀ-ÿ]?[a-zA-ZÀ-ÿ]+){0,3})\b/;
    const firstPhraseMatch = prompt.match(firstPhrasePattern);
    if (firstPhraseMatch && firstPhraseMatch[1]) {
      const name = cleanProductName(firstPhraseMatch[1]);
      if (name.length >= 3 && name.length <= 40) {
        return name;
      }
    }
  }

  // Check category as fallback
  if (metadata?.product?.category) {
    return capitalizeWords(metadata.product.category);
  }

  // Fallback to custom fallback or visual ID
  if (fallback) {
    return fallback;
  }

  return `Visual ${visualId.substring(0, 8)}`;
}

/**
 * Clean and format product name
 */
function cleanProductName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Remove extra spaces
    .replace(/^(a|an|the)\s+/i, '') // Remove articles
    .substring(0, 50); // Limit length
}

/**
 * Capitalize each word
 */
function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract format label for display
 */
export function formatLabel(contextPreset: string | undefined): string {
  if (!contextPreset) return 'Image';

  const formatMap: Record<string, string> = {
    'social_media_square': 'Instagram Post',
    'social_media_story': 'Instagram Story',
    'packshot': 'Packshot',
    'lifestyle': 'Lifestyle',
    'banner': 'Bannière',
    'product_card': 'Fiche Produit'
  };

  return formatMap[contextPreset] || capitalizeWords(contextPreset);
}

/**
 * Get short description from metadata
 */
export function getShortDescription(metadata: VisualMetadata | null | undefined): string | null {
  if (!metadata) return null;

  // Check if there's a style or aesthetic
  if (metadata.branding?.aesthetic) {
    return metadata.branding.aesthetic;
  }

  // Check for style keywords in prompt
  if (metadata.prompt) {
    const styleKeywords = ['modern', 'vintage', 'bohème', 'industriel', 'scandinave', 'minimaliste'];
    for (const style of styleKeywords) {
      if (metadata.prompt.toLowerCase().includes(style)) {
        return capitalizeWords(style);
      }
    }
  }

  return null;
}
