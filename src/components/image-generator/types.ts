// DetectedField pattern for AI analysis with override capability
export interface DetectedField<T> {
  value: T;
  source: 'detected' | 'override';
}

// New v3 Product Profile with DetectedField pattern
export interface ProductProfile {
  type: DetectedField<string>;
  materials: DetectedField<string>;
  detectedColor: DetectedField<string>; // hex color from AI
  style: DetectedField<string>;
  wallMounted: DetectedField<boolean>;
  features: DetectedField<string[]>;
  // Override fields
  realDimensions?: {
    width: number; // cm
    height: number; // cm 
    depth: number; // cm
  };
  colorOverride?: string; // hex color override
  notes?: string;
}

// Individual uploaded image (part of product)
export interface UploadedImage extends File {
  id: string;
  preview: string;
  isPrimary?: boolean; // for primary reference selection
}

// Multi-image product represents THE SAME product from multiple angles
export interface ProductImages {
  productName: string;
  images: UploadedImage[];
  primaryImageId?: string; // ID of primary reference image for OpenAI
  fusedProfile?: ProductProfile; // Generated from all images
  isAnalyzing?: boolean;
  analysisError?: string;
}

// Context presets for different image types
export type ContextPreset = 'packshot' | 'instagram' | 'story' | 'hero';

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

// Configuration that can be saved/loaded from localStorage
export interface ProductConfiguration {
  id: string;
  name: string;
  slug: string; // for localStorage key
  productImages: ProductImages;
  uiSettings: UiSettings;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  productConfigId: string;
  settings: UiSettings;
  profile: ProductProfile;
  prompt: string;
  metadata: {
    model: string;
    timestamp: string;
    size: string;
    quality: string;
  };
}

// Main app state for v3
export interface ImageGeneratorState {
  currentStep: 1 | 2 | 3 | 4; // 4-step flow
  productConfiguration?: ProductConfiguration;
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  generationProgress?: {
    current: number;
    total: number;
    stage: string;
  };
  errors: {
    upload?: string;
    analysis?: string;
    generation?: string;
    configuration?: string;
  };
}

export const SIZE_MAPPINGS = {
  packshot: "1024x1024" as const,
  instagram: "1024x1024" as const,
  story: "1024x1536" as const,
  hero: "1536x1024" as const,
};

export const CONTEXT_PRESET_SETTINGS = {
  packshot: { size: "1024x1024", description: "Square product shot (1024x1024)" },
  instagram: { size: "1024x1024", description: "Instagram post (1024x1024)" },
  story: { size: "1024x1536", description: "Instagram/Facebook Story (1024x1536)" },
  hero: { size: "1536x1024", description: "Website hero banner (1536x1024)" },
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

// Helper functions for DetectedField
export function createDetectedField<T>(value: T): DetectedField<T> {
  return { value, source: 'detected' };
}

export function createOverrideField<T>(value: T): DetectedField<T> {
  return { value, source: 'override' };
}

export function getFieldValue<T>(field: DetectedField<T>): T {
  return field.value;
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