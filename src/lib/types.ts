// Essential types for the SaaS application

export type ContextPreset = 'packshot' | 'social_media_square' | 'social_media_story' | 'hero' | 'lifestyle' | 'detail';

export interface UiSettings {
  backgroundStyle: string;
  productPosition: string;
  reservedTextZone?: string;
  props: string[];
  lighting: string;
  strictMode: boolean;
  contextPreset: ContextPreset;
  variations: number;
  quality: 'high' | 'medium' | 'low';
}

export interface ProductProfile {
  type: string | string[];
  materials: string | string[];
  detectedColor: string | string[];
  style: string | string[];
  features: string | string[];
  placementType?: string;
  realDimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
  notes?: string;
  colorOverride?: string;
  textToImagePrompts?: TextToImagePrompts;
  analysisVersion?: string;
}

export interface TextToImagePrompts {
  baseDescription?: string;
  packshot?: string;
  lifestyle?: string;
  hero?: string;
  social_media_story?: string;
  social_media_square?: string;
  detail?: string;
  photographySpecs?: {
    cameraAngle?: string;
    lightingSetup?: string;
    depthOfField?: string;
    composition?: string;
  };
  visualDetails?: {
    materialTextures?: string;
    colorPalette?: string;
    hardwareDetails?: string;
    proportionalRelationships?: string;
  };
}

export interface ProductImages {
  fusedProfile?: ProductProfile;
  productName?: string;
  images?: unknown[];
}

export interface ProductConfiguration {
  productImages: ProductImages;
  uiSettings: UiSettings;
  id?: string;
  slug?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Utility function to extract field values
export function getFieldValue(field: string | string[] | boolean): string | boolean | string[] {
  if (Array.isArray(field)) {
    return field.length === 1 ? field[0] : field;
  }
  return field;
}

// Storage utilities
export const STORAGE_KEYS = {
  PRODUCT_CONFIGURATIONS: 'piktor_v3_product_configurations',
  ACTIVE_CONFIGURATION_ID: 'piktor_v3_active_configuration_id',
  CONFIG_PREFIX: 'piktor_v3_config_',
  CONFIG_LIST: 'piktor_v3_configurations_list',
} as const;

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}