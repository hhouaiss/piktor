// Generation method enum
export type GenerationMethod = 'direct-generation' | 'reference-based' | 'image-editing';

// Generation source interface
export interface GenerationSource {
  method: GenerationMethod;
  model: string;
  confidence: number;
  referenceImageUsed?: boolean;
}

// Simplified Product Profile - user-defined specifications only
export interface ProductSpecs {
  productName: string;
  productType: string; // User-defined product type
  materials: string; // User-defined materials
  dimensions?: {
    width?: number; // cm
    height?: number; // cm 
    depth?: number; // cm
  };
  additionalSpecs?: string; // Any additional specifications
}

// Individual uploaded image (part of product)
export interface UploadedImage extends File {
  id: string;
  preview: string;
}

// Multi-image product input - simplified without analysis
export interface ProductInput {
  images: UploadedImage[];
  specs: ProductSpecs;
}

// Context presets for different image types - expanded for e-commerce
export type ContextPreset = 'packshot' | 'instagram' | 'story' | 'hero' | 'lifestyle' | 'detail';

// Context types for the new two-step flow
export type ContextType = 'packshot' | 'social-media' | 'lifestyle';

// Social media format options
export type SocialMediaFormat = 'square' | 'story';

// Context selection interface for the new two-step flow
export interface ContextSelection {
  contextType: ContextType;
  socialMediaFormat?: SocialMediaFormat; // Only used when contextType is 'social-media'
}

// Asset types for image editing transformations
export type AssetType = 'lifestyle' | 'ad' | 'social' | 'hero' | 'variation';

export interface UiSettings {
  contextPreset: ContextPreset;
  backgroundStyle: 'plain' | 'minimal' | 'lifestyle' | 'gradient';
  productPosition: 'left' | 'right' | 'center';
  reservedTextZone?: 'left' | 'right' | 'top' | 'bottom'; // for text overlay
  props: Array<'plant' | 'lamp' | 'rug' | 'chair' | 'artwork'>;
  lighting: 'soft_daylight' | 'studio_softbox' | 'warm_ambient';
  strictMode: boolean;
  quality: 'high' | 'medium' | 'low';
  variations: 1 | 2 | 3 | 4;
}

// Simplified configuration without analysis dependencies
export interface ProductConfiguration {
  id: string;
  productInput: ProductInput;
  uiSettings: UiSettings;
  createdAt: string;
  updatedAt: string;
}

// Simplified Generated Image interface
export interface GeneratedImage {
  id: string;
  url: string;
  productConfigId: string;
  settings: UiSettings;
  specs: ProductSpecs;
  prompt: string;
  generationSource: GenerationSource;
  metadata: {
    model: string;
    timestamp: string;
    size: string;
    quality: string;
    variation?: number;
    contextPreset?: string;
    processingTime?: number;
  };
  // Optional thumbnail for faster loading
  thumbnail?: string;
}

// Asset editing request interface
export interface EditingRequest {
  sourceImageId: string;
  sourceImageUrl: string;
  assetType: AssetType;
  customPrompt?: string;
  variations?: number;
}

// Edited image result interface
export interface EditedImage {
  id: string;
  sourceImageId: string;
  url: string;
  assetType: AssetType;
  prompt: string;
  metadata: {
    model: string;
    timestamp: string;
    size: string;
    variation: number;
    editingMethod: 'image-to-image';
    processingTime?: number;
  };
}

// Editing progress interface
export interface EditingProgress {
  current: number;
  total: number;
  stage: string;
  assetType?: AssetType;
}

// Extended app state for 4-step flow with context selection
export interface ImageGeneratorState {
  currentStep: 1 | 2; // 2-step flow: Generate (Input + Context + Generate) -> Edit
  contextSelection?: ContextSelection;
  productConfiguration?: ProductConfiguration;
  generatedImages: GeneratedImage[];
  editedImages: Record<string, EditedImage[]>; // Keyed by source image ID
  isGenerating: boolean;
  isEditing: boolean;
  generationProgress?: {
    current: number;
    total: number;
    stage: string;
  };
  editingProgress?: EditingProgress;
  errors: {
    context?: string;
    input?: string;
    generation?: string;
    editing?: string;
  };
}

export const SIZE_MAPPINGS = {
  packshot: "1024x1024" as const,
  instagram: "1024x1024" as const,
  story: "1024x1536" as const,
  hero: "1536x1024" as const,
  lifestyle: "1536x1024" as const,
  detail: "1024x1024" as const,
};

export const CONTEXT_PRESET_SETTINGS = {
  packshot: { size: "1024x1024", description: "Square product shot (1024x1024)", preferredMethod: 'text-to-image' as GenerationMethod },
  instagram: { size: "1024x1024", description: "Instagram post (1024x1024)", preferredMethod: 'text-to-image' as GenerationMethod },
  story: { size: "1024x1536", description: "Instagram/Facebook Story (1024x1536)", preferredMethod: 'text-to-image' as GenerationMethod },
  hero: { size: "1536x1024", description: "Website hero banner (1536x1024)", preferredMethod: 'text-to-image' as GenerationMethod },
  lifestyle: { size: "1536x1024", description: "Lifestyle/contextual scene (1536x1024)", preferredMethod: 'text-to-image' as GenerationMethod },
  detail: { size: "1024x1024", description: "Detail/close-up shot (1024x1024)", preferredMethod: 'text-to-image' as GenerationMethod },
} as const;

export const DEFAULT_UI_SETTINGS: UiSettings = {
  contextPreset: 'packshot',
  backgroundStyle: 'minimal',
  productPosition: 'center',
  props: [],
  lighting: 'soft_daylight',
  strictMode: true,
  quality: 'medium',
  variations: 2,
};

// Helper function to create product specifications
export function createProductSpecs(
  productName: string,
  productType: string = '',
  materials: string = '',
  dimensions?: { width: number; height: number; depth: number },
  additionalSpecs?: string
): ProductSpecs {
  return {
    productName,
    productType,
    materials,
    dimensions,
    additionalSpecs
  };
}

// LocalStorage utilities
export const STORAGE_KEYS = {
  CONFIG_PREFIX: 'piktor.product.',
  CONFIG_LIST: 'piktor.configs',
} as const;

// Utility to generate slug from product name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to create product input
export function createProductInput(images: UploadedImage[], specs: ProductSpecs): ProductInput {
  return { images, specs };
}

// Asset type configuration
export const ASSET_TYPE_CONFIG = {
  lifestyle: {
    name: 'Lifestyle',
    description: 'Transform into real-world contextual scenes',
    prompt: 'create a lifestyle scene with the product naturally placed in a real-world environment like a modern living room, bedroom, or office space, with complementary furniture, good lighting, and an inviting atmosphere',
    contextPreset: 'lifestyle' as ContextPreset,
    variations: 2,
  },
  ad: {
    name: 'Ad Creative',
    description: 'Create commercial advertising visuals',
    prompt: 'transform into a professional advertising image with commercial photography style, dramatic lighting, perfect composition for marketing campaigns and promotional materials',
    contextPreset: 'hero' as ContextPreset,
    variations: 2,
  },
  social: {
    name: 'Social Media',
    description: 'Optimize for social media platforms',
    prompt: 'create an engaging social media post image with trendy aesthetic, perfect for Instagram, Facebook, or Pinterest, with eye-catching composition and modern styling',
    contextPreset: 'instagram' as ContextPreset,
    variations: 3,
  },
  hero: {
    name: 'Hero Banner',
    description: 'Create website hero images',
    prompt: 'transform into a stunning hero banner image perfect for website headers, with professional composition, clean background space for text overlay, and premium brand presentation',
    contextPreset: 'hero' as ContextPreset,
    variations: 2,
  },
  variation: {
    name: 'Product Variations',
    description: 'Generate color and material variations',
    prompt: 'create variations of the product with different colors, materials, or finishes while maintaining the same style and composition, showing alternative versions customers might prefer',
    contextPreset: 'packshot' as ContextPreset,
    variations: 3,
  },
} as const;

// Helper to get asset type configuration
export function getAssetTypeConfig(assetType: AssetType) {
  return ASSET_TYPE_CONFIG[assetType];
}

// Helper to create editing request
export function createEditingRequest(
  sourceImageId: string,
  sourceImageUrl: string,
  assetType: AssetType,
  customPrompt?: string,
  variations?: number
): EditingRequest {
  return {
    sourceImageId,
    sourceImageUrl,
    assetType,
    customPrompt,
    variations: variations || ASSET_TYPE_CONFIG[assetType].variations,
  };
}

// Context type configurations for the new two-step flow
export const CONTEXT_TYPE_CONFIG = {
  packshot: {
    name: 'Packshot',
    description: 'Clean product photos with minimal backgrounds',
    icon: '📦',
    contextPreset: 'packshot' as ContextPreset,
    size: '1024x1024',
    examples: ['Studio lighting', 'White background', 'Product focus']
  },
  'social-media': {
    name: 'Social Media',
    description: 'Engaging posts for Instagram, Facebook, and more',
    icon: '📱',
    contextPreset: 'instagram' as ContextPreset, // Default, can be overridden
    size: '1024x1024', // Default, can be overridden
    examples: ['Trendy layouts', 'Eye-catching design', 'Platform optimized'],
    formats: {
      square: {
        name: 'Square Post',
        description: 'Perfect for Instagram posts and Facebook',
        contextPreset: 'instagram' as ContextPreset,
        size: '1024x1024'
      },
      story: {
        name: 'Story Format',
        description: 'Vertical format for Instagram and Facebook Stories',
        contextPreset: 'story' as ContextPreset,
        size: '1024x1536'
      }
    }
  },
  lifestyle: {
    name: 'Lifestyle',
    description: 'Products in real-world settings and contexts',
    icon: '🏠',
    contextPreset: 'lifestyle' as ContextPreset,
    size: '1536x1024',
    examples: ['Home settings', 'Natural environments', 'Contextual scenes']
  }
} as const;

// Helper function to get context preset from context selection
export function getContextPresetFromSelection(contextSelection: ContextSelection): ContextPreset {
  if (contextSelection.contextType === 'social-media' && contextSelection.socialMediaFormat) {
    return CONTEXT_TYPE_CONFIG['social-media'].formats[contextSelection.socialMediaFormat].contextPreset;
  }
  return CONTEXT_TYPE_CONFIG[contextSelection.contextType].contextPreset;
}

// Helper function to get size from context selection
export function getSizeFromSelection(contextSelection: ContextSelection): string {
  if (contextSelection.contextType === 'social-media' && contextSelection.socialMediaFormat) {
    return CONTEXT_TYPE_CONFIG['social-media'].formats[contextSelection.socialMediaFormat].size;
  }
  return CONTEXT_TYPE_CONFIG[contextSelection.contextType].size;
}

// Helper function to create context selection
export function createContextSelection(
  contextType: ContextType,
  socialMediaFormat?: SocialMediaFormat
): ContextSelection {
  return {
    contextType,
    socialMediaFormat: contextType === 'social-media' ? socialMediaFormat : undefined
  };
}