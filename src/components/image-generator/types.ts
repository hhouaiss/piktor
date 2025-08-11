// DetectedField pattern for AI analysis with override capability
export interface DetectedField<T> {
  value: T;
  source: 'detected' | 'override';
}

// Enhanced Product Feature interface
export interface ProductFeature {
  name: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

// Color analysis interface
export interface ColorAnalysis {
  hex: string;
  name: string;
  confidence: number; // 0-1
}

// Dimension estimation interface
export interface DimensionEstimate {
  width: number;
  height: number;
  depth: number;
  unit: 'cm' | 'inches';
  confidence: 'high' | 'medium' | 'low';
}

// Context recommendations interface
export interface ContextRecommendations {
  bestContexts: ContextPreset[];
  backgroundSuggestions: string[];
  lightingRecommendations: string[];
}

// Enhanced text-to-image prompts interface for GPT-image-1 generation
export interface TextToImagePrompts {
  baseDescription: string; // Extremely detailed base description capturing all visual characteristics
  packshot: string; // Complete prompt for clean product packshots
  lifestyle: string; // Detailed prompt for lifestyle scenes
  hero: string; // Comprehensive prompt for hero/banner images
  story: string; // Optimized prompt for vertical story format
  instagram: string; // Instagram post format prompt
  detail: string; // Detail shot format prompt
  photographySpecs: {
    cameraAngle: string; // Optimal camera angles and perspectives
    lightingSetup: string; // Detailed lighting specifications
    depthOfField: string; // Recommended depth of field characteristics
    composition: string; // Composition guidelines
  };
  visualDetails: {
    materialTextures: string; // Detailed description of all material textures
    colorPalette: string; // Complete color palette with undertones
    hardwareDetails: string; // Specific hardware, joints, connections details
    proportionalRelationships: string; // Key proportional relationships between parts
  };
}

// Generation method enum
export type GenerationMethod = 'text-to-image' | 'reference-based' | 'hybrid';

// Generation source interface
export interface GenerationSource {
  method: GenerationMethod;
  model: string;
  confidence: number;
  referenceImageUsed?: boolean;
}

// Enhanced v4 Product Profile with comprehensive analysis
export interface ProductProfile {
  // Core fields (maintaining compatibility)
  type: DetectedField<string>;
  materials: DetectedField<string>;
  detectedColor: DetectedField<string>; // hex color from AI
  style: DetectedField<string>;
  wallMounted: DetectedField<boolean>;
  features: DetectedField<string[]>;
  
  // Enhanced analysis data from GPT-4o
  colorAnalysis?: ColorAnalysis;
  detailedFeatures?: ProductFeature[];
  estimatedDimensions?: DimensionEstimate;
  contextRecommendations?: ContextRecommendations;
  textToImagePrompts?: TextToImagePrompts;
  
  // Override fields
  realDimensions?: {
    width: number; // cm
    height: number; // cm 
    depth: number; // cm
  };
  colorOverride?: string; // hex color override
  notes?: string;
  
  // Analysis metadata
  analysisVersion?: string;
  analysisModel?: string;
  analysisTimestamp?: string;
  sourceImageCount?: number;
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

// Context presets for different image types - expanded for e-commerce
export type ContextPreset = 'packshot' | 'instagram' | 'story' | 'hero' | 'lifestyle' | 'detail';

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

// Enhanced Generated Image interface for hybrid generation
export interface GeneratedImage {
  id: string;
  url: string;
  productConfigId: string;
  settings: UiSettings;
  profile: ProductProfile;
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