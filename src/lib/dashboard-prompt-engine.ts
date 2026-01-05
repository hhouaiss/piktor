/**
 * DASHBOARD VISUAL CREATION PROMPT ENGINE
 * 
 * Enhanced AI image generation prompts that fully leverage the dashboard 
 * personalization interface to generate exactly what users configure.
 * 
 * This system translates the French-language dashboard options into
 * sophisticated, professional AI prompts optimized for high-quality
 * furniture photography generation.
 */

// Product dimensions for realistic proportions
export interface ProductDimensions {
  width?: number;  // Width in specified unit
  depth?: number;  // Depth in specified unit
  height?: number; // Height in specified unit
  unit: 'cm' | 'in'; // Measurement unit
}

// Dashboard Settings Interface (matching visual-creation.tsx)
export interface DashboardGenerationSettings {
  style: string;        // moderne, rustique, industriel, scandinave, boheme
  environment: string;  // salon, bureau, cuisine, chambre, studio
  lighting: string;     // naturelle, chaleureuse, professionnelle
  angle: string;        // face, trois-quarts, profile, plongee
  formats: string[];    // instagram-post, instagram-story, facebook, ecommerce, print, web-banner
  imageSize: '1K' | '2K' | '4K'; // Resolution selection for Gemini 3 Pro Image Preview
  dimensions?: ProductDimensions; // Optional product dimensions for realistic proportions
  customPrompt?: string; // User's additional instructions
}

// Enhanced Product Context for Dashboard
export interface DashboardProductProfile {
  productName: string;
  productCategory: string; // canape, chaise, table, lit, armoire, decoration, autre
  uploadedImages: Array<{
    id: string;
    file: File;
    url: string;
    name: string;
    isPrimary?: boolean; // First image is the main reference, others add context
  }>;
}

// Format Specifications for Optimal Generation
const FORMAT_SPECIFICATIONS = {
  'instagram-post': {
    dimensions: '1080x1080px',
    aspectRatio: '1:1',
    optimization: 'Square format optimized for Instagram feed engagement',
    composition: 'Centered product with breathing room for mobile viewing'
  },
  'instagram-story': {
    dimensions: '1080x1920px', 
    aspectRatio: '9:16',
    optimization: 'Vertical mobile story format with thumb-stopping appeal',
    composition: 'Product prominently featured in vertical smartphone frame'
  },
  'facebook': {
    dimensions: '1200x630px',
    aspectRatio: '16:9', 
    optimization: 'Facebook post and ad format with link preview optimization',
    composition: 'Landscape orientation with space for text overlay'
  },
  'ecommerce': {
    dimensions: '1000x1000px',
    aspectRatio: '4:3',
    optimization: 'E-commerce product listing with clean commercial presentation',
    composition: 'Product-focused with minimal distraction for online catalogs'
  },
  'print': {
    dimensions: '2480x3508px',
    aspectRatio: 'A4',
    optimization: 'High-resolution print quality for brochures and catalogs',
    composition: 'Professional layout with print-safe margins and typography space'
  },
  'web-banner': {
    dimensions: '728x90px',
    aspectRatio: '728:90',
    optimization: 'Web banner format for website headers and advertisements',
    composition: 'Horizontal layout with strong visual impact and text space'
  }
};

/**
 * MAIN DASHBOARD PROMPT GENERATION FUNCTION
 * 
 * Transforms user's French dashboard selections into sophisticated 
 * AI prompts that generate exactly what they configured.
 */
export function buildDashboardPrompt(
  productProfile: DashboardProductProfile,
  settings: DashboardGenerationSettings
): string {
  // Count primary and context images
  const contextCount = Math.max(0, productProfile.uploadedImages.length - 1);

  // Build narrative-focused prompt optimized for Gemini 3 Pro Image
  let prompt = `Create a high-resolution, studio-lit product photograph of ${productProfile.productName}, a ${getCategoryDescription(productProfile.productCategory).toLowerCase()}.`;

  // Multi-image reference handling (critical for accuracy)
  if (productProfile.uploadedImages.length > 1) {
    prompt += ` The first reference image shows the definitive product form, design, and color palette that must be faithfully recreated. The ${contextCount} additional reference images reveal supplementary details about materials, textures, and craftsmanship that should inform the fine details of the rendering. Synthesize all references to understand the complete three-dimensional form while maintaining absolute fidelity to the primary image's core design.`;
  } else {
    prompt += ` Use the provided reference image as the authoritative source for all product details, proportions, materials, and design characteristics.`;
  }

  // Photography scene description using narrative style
  prompt += ` Photograph this piece in ${getEnvironmentNarrative(settings.environment)} The scene embodies ${getStyleNarrative(settings.style)}`;

  // Lighting setup with professional photography terminology
  prompt += ` ${getLightingNarrative(settings.lighting)}`;

  // Camera positioning and composition
  prompt += ` ${getCameraPositionNarrative(settings.angle)}`;

  // Format-specific composition guidance (concise)
  if (settings.formats.length === 1) {
    const formatSpec = FORMAT_SPECIFICATIONS[settings.formats[0] as keyof typeof FORMAT_SPECIFICATIONS];
    if (formatSpec) {
      prompt += ` Frame the composition for ${formatSpec.aspectRatio} aspect ratio, ${formatSpec.optimization.toLowerCase()}.`;
    }
  } else {
    prompt += ` Compose the frame to be versatile across multiple aspect ratios while maintaining strong visual hierarchy.`;
  }

  // Product dimensions for realistic scale
  if (settings.dimensions) {
    const dims = settings.dimensions;
    const hasDimensions = dims.width || dims.depth || dims.height;
    if (hasDimensions) {
      const unit = dims.unit || 'cm';
      const dimensionParts = [];
      if (dims.width) dimensionParts.push(`${dims.width}${unit} wide`);
      if (dims.depth) dimensionParts.push(`${dims.depth}${unit} deep`);
      if (dims.height) dimensionParts.push(`${dims.height}${unit} tall`);
      prompt += ` The furniture measures ${dimensionParts.join(', ')}, so render it at realistic scale relative to the surrounding environment, ensuring all proportions appear natural and true to these real-world dimensions.`;
    }
  }

  // User custom instructions seamlessly integrated
  if (settings.customPrompt && settings.customPrompt.trim()) {
    prompt += ` ${settings.customPrompt}`;
  }

  // Professional quality standards (concise)
  prompt += ` Execute this as a professional commercial product photograph with tack-sharp focus throughout, accurate color rendition, and museum-quality detail. The product must be rendered with complete accuracy to the reference images, preserving every design detail, material texture, and structural characteristic. Maintain clean composition with no text, watermarks, or visual distractions. The final image should be indistinguishable from high-end furniture catalog photography shot by a professional commercial photographer using professional-grade equipment.`;

  return prompt;
}

// Helper functions to generate narrative scene descriptions

function getEnvironmentNarrative(environment: string): string {
  const narratives: Record<string, string> = {
    salon: `a sophisticated contemporary living room with designer furniture staging and elegant ambient lighting.`,
    bureau: `a modern professional office space with clean architectural lines and premium commercial finishes.`,
    cuisine: `a high-end designer kitchen featuring premium countertops and refined residential styling.`,
    chambre: `a luxury bedroom suite with soft intimate lighting and premium textile accents.`,
    studio: `a professional photography studio environment with a clean neutral backdrop and controlled commercial lighting setup, zero environmental distractions.`
  };
  return narratives[environment] || narratives['studio'];
}

function getStyleNarrative(style: string): string {
  const narratives: Record<string, string> = {
    moderne: `modern contemporary aesthetics with clean geometric forms, minimalist spatial design, and a sophisticated neutral color palette emphasizing sleek surfaces and precision craftsmanship.`,
    rustique: `rustic farmhouse character with natural wood textures, weathered authentic finishes, warm earth-toned surroundings that highlight organic materials and artisanal details.`,
    industriel: `industrial loft styling with raw concrete textures, exposed architectural elements, urban edge, and dramatic material contrasts between metal and aged surfaces.`,
    scandinave: `Scandinavian minimalist principles featuring light Nordic woods, functional simplicity, soft natural textiles, and an airy hygge atmosphere with gentle natural illumination.`,
    boheme: `bohemian eclectic layering with rich global textiles, artistic accessories, warm atmospheric depth, and creative expressive styling that celebrates handcrafted artisanal quality.`
  };
  return narratives[style] || narratives['moderne'];
}

function getLightingNarrative(lighting: string): string {
  const narratives: Record<string, string> = {
    naturelle: `Light the scene with soft directional window light at 5200K color temperature, creating gentle natural shadows with a 3:1 lighting ratio that evokes authentic daylight ambiance. Allow subtle shadow gradation to reveal form and dimension while maintaining open, airy tonality throughout.`,
    chaleureuse: `Establish warm inviting illumination using 2800K tungsten-balanced light sources with soft multi-point fill creating an intimate 2:1 lighting ratio. The warm golden glow should wrap around the furniture with cozy residential character while preserving detail in both highlights and shadow areas.`,
    professionnelle: `Deploy a classic three-point commercial studio lighting setup with a 5600K key light positioned at 45 degrees, balanced fill light maintaining a 4:1 ratio for controlled shadow detail, and subtle rim lighting to separate the product from the background. Achieve perfectly even exposure with professional catalog precision.`
  };
  return narratives[lighting] || narratives['professionnelle'];
}

function getCameraPositionNarrative(angle: string): string {
  const narratives: Record<string, string> = {
    face: `Position the camera at eye level directly facing the product in a perfectly symmetrical frontal composition, using a 50mm equivalent focal length to minimize distortion and capture maximum design detail with formal balanced presentation.`,
    'trois-quarts': `Shoot from a dynamic three-quarter angle positioned 45 degrees offset from the front face, revealing both frontal design elements and side profile depth. This classic commercial photography angle shows dimensional form while maintaining clear visibility of key product features.`,
    profile: `Capture a pure 90-degree side profile view that emphasizes the furniture's silhouette, proportional accuracy, and lateral design characteristics with architectural precision and clean outline definition.`,
    plongee: `Frame from an elevated overhead perspective looking down at approximately 60 degrees, revealing surface details, spatial footprint, and top-down dimensional context ideal for showcasing surface textures and arrangement.`
  };
  return narratives[angle] || narratives['trois-quarts'];
}

/**
 * Generate multiple format-optimized prompts
 * For when user selects multiple formats requiring different compositions
 */
export function buildMultiFormatPrompts(
  productProfile: DashboardProductProfile,
  settings: DashboardGenerationSettings
): Array<{ format: string; prompt: string; specifications: Record<string, unknown> }> {
  return settings.formats.map(format => {
    // Create format-specific settings
    const formatSettings = { ...settings, formats: [format] };
    
    // Generate base prompt
    const basePrompt = buildDashboardPrompt(productProfile, formatSettings);
    
    // Add format-specific enhancements
    const formatSpec = FORMAT_SPECIFICATIONS[format as keyof typeof FORMAT_SPECIFICATIONS];
    let enhancedPrompt = basePrompt;
    
    if (formatSpec) {
      enhancedPrompt += `\n\n🎯 ${format.toUpperCase()} SPECIFIC OPTIMIZATION:
- Primary Focus: ${formatSpec.optimization}
- Composition Strategy: ${formatSpec.composition}
- Technical Output: ${formatSpec.dimensions} at ${formatSpec.aspectRatio} aspect ratio
- Platform Optimization: Designed specifically for ${format} platform requirements`;
    }

    return {
      format,
      prompt: enhancedPrompt,
      specifications: formatSpec
    };
  });
}

/**
 * Validate dashboard settings and provide recommendations
 */
export function validateDashboardSettings(
  settings: DashboardGenerationSettings,
  productProfile: DashboardProductProfile
): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: number; // 0-100%
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let completeness = 0;
  
  // Check required settings
  if (settings.style) completeness += 20;
  else warnings.push('Style selection is required for optimal generation');
  
  if (settings.environment) completeness += 20;
  else warnings.push('Environment selection is required for contextual placement');
  
  if (settings.lighting) completeness += 20;
  else warnings.push('Lighting preference is required for professional quality');
  
  if (settings.angle) completeness += 20;
  else warnings.push('Camera angle selection is required for optimal composition');
  
  if (settings.formats.length > 0) completeness += 20;
  else warnings.push('At least one output format must be selected');

  // Provide contextual recommendations
  if (settings.environment === 'studio' && settings.lighting === 'naturelle') {
    recommendations.push('Consider "professionnelle" lighting for studio environment to achieve commercial catalog quality');
  }

  if (settings.style === 'moderne' && settings.lighting === 'chaleureuse') {
    recommendations.push('Modern style typically pairs well with "naturelle" or "professionnelle" lighting for clean aesthetic');
  }

  if (productProfile.productCategory === 'bureau' && settings.environment === 'chambre') {
    recommendations.push('Office furniture might look more natural in "bureau" or "salon" environment');
  }

  if (settings.formats.length > 3) {
    recommendations.push('Consider generating fewer formats initially to optimize generation time and credits');
  }

  // Add product-specific recommendations
  if (productProfile.uploadedImages.length < 2) {
    recommendations.push('Upload additional product angles for better AI understanding and generation quality');
  }

  return {
    isValid: completeness === 100 && warnings.length === 0,
    warnings,
    recommendations,
    completeness
  };
}

/**
 * Enhanced prompt with fallback handling
 */
export function buildDashboardPromptWithFallbacks(
  productProfile: DashboardProductProfile,
  settings: DashboardGenerationSettings
): string {
  // Apply intelligent fallbacks for incomplete settings
  const enhancedSettings = applyIntelligentFallbacks(settings, productProfile);
  
  // Generate main prompt
  const mainPrompt = buildDashboardPrompt(productProfile, enhancedSettings);
  
  // Add fallback information if applied
  const fallbacks = detectAppliedFallbacks(settings, enhancedSettings);
  if (fallbacks.length > 0) {
    return mainPrompt + `\n\n🔄 INTELLIGENT FALLBACKS APPLIED:
${fallbacks.map(f => `- ${f}`).join('\n')}

Note: These defaults were selected to optimize generation quality based on your other selections.`;
  }
  
  return mainPrompt;
}

// Helper Functions

function getCategoryDescription(category: string): string {
  const descriptions = {
    canape: 'Sofa/Seating Furniture - Upholstered living room seating',
    chaise: 'Chair - Dining, office, or accent seating furniture', 
    table: 'Table - Dining, coffee, or surface furniture',
    lit: 'Bed - Bedroom furniture and sleep solutions',
    armoire: 'Storage Cabinet - Wardrobe and storage solutions',
    decoration: 'Decorative Object - Home decor and accessories',
    autre: 'Specialty Furniture - Custom or unique furniture piece'
  };
  
  return descriptions[category as keyof typeof descriptions] || 'Furniture Product';
}

function applyIntelligentFallbacks(
  settings: DashboardGenerationSettings,
  productProfile: DashboardProductProfile
): DashboardGenerationSettings {
  const enhanced = { ...settings };
  
  // Style fallbacks based on product category
  if (!enhanced.style) {
    if (productProfile.productCategory === 'bureau') {
      enhanced.style = 'moderne';
    } else if (productProfile.productCategory === 'decoration') {
      enhanced.style = 'boheme';
    } else {
      enhanced.style = 'moderne'; // Safe default
    }
  }
  
  // Environment fallbacks based on product category
  if (!enhanced.environment) {
    const categoryEnvironmentMap = {
      canape: 'salon',
      chaise: 'salon', 
      table: 'salon',
      lit: 'chambre',
      armoire: 'chambre',
      decoration: 'salon',
      autre: 'studio'
    };
    enhanced.environment = categoryEnvironmentMap[productProfile.productCategory as keyof typeof categoryEnvironmentMap] || 'studio';
  }
  
  // Lighting fallbacks based on environment
  if (!enhanced.lighting) {
    const environmentLightingMap = {
      studio: 'professionnelle',
      bureau: 'professionnelle',
      salon: 'naturelle',
      cuisine: 'naturelle', 
      chambre: 'chaleureuse'
    };
    enhanced.lighting = environmentLightingMap[enhanced.environment as keyof typeof environmentLightingMap] || 'naturelle';
  }
  
  // Angle fallback
  if (!enhanced.angle) {
    enhanced.angle = 'trois-quarts'; // Most versatile angle
  }
  
  // Format fallback
  if (enhanced.formats.length === 0) {
    enhanced.formats = ['ecommerce']; // Safe commercial default
  }
  
  return enhanced;
}

function detectAppliedFallbacks(
  original: DashboardGenerationSettings,
  enhanced: DashboardGenerationSettings
): string[] {
  const fallbacks: string[] = [];
  
  if (!original.style && enhanced.style) {
    fallbacks.push(`Style defaulted to "${enhanced.style}" based on product category`);
  }
  if (!original.environment && enhanced.environment) {
    fallbacks.push(`Environment defaulted to "${enhanced.environment}" based on product type`);
  }
  if (!original.lighting && enhanced.lighting) {
    fallbacks.push(`Lighting defaulted to "${enhanced.lighting}" based on environment choice`);
  }
  if (!original.angle && enhanced.angle) {
    fallbacks.push(`Camera angle defaulted to "${enhanced.angle}" for optimal composition`);
  }
  if (original.formats.length === 0 && enhanced.formats.length > 0) {
    fallbacks.push(`Format defaulted to "${enhanced.formats[0]}" for commercial presentation`);
  }
  
  return fallbacks;
}

/**
 * Integration function for existing API endpoints
 */
export function convertDashboardToProductionSpecs(
  productProfile: DashboardProductProfile,
  settings: DashboardGenerationSettings
) {
  return {
    productSpecs: {
      productName: productProfile.productName,
      productType: getCategoryDescription(productProfile.productCategory),
      materials: 'Based on reference images', // Will be analyzed from uploaded images
      additionalSpecs: settings.customPrompt
    },
    generationParams: {
      contextPreset: determineContextPreset(settings),
      variations: settings.formats.length,
      quality: 'high' as const
    },
    referenceImages: productProfile.uploadedImages.map(img => ({
      data: img.url, // This would need to be converted to base64 in real implementation
      mimeType: 'image/jpeg' // Would detect from file
    })),
    dashboardEnhancedPrompt: buildDashboardPromptWithFallbacks(productProfile, settings)
  };
}

function determineContextPreset(settings: DashboardGenerationSettings): string {
  // Map dashboard formats to existing context presets
  const formatContextMap = {
    'instagram-post': 'social_media_square',
    'instagram-story': 'social_media_story', 
    'facebook': 'social_media_square',
    'ecommerce': 'packshot',
    'print': 'lifestyle',
    'web-banner': 'hero'
  };
  
  // Use the first format to determine context, or default to packshot
  const primaryFormat = settings.formats[0];
  return formatContextMap[primaryFormat as keyof typeof formatContextMap] || 'packshot';
}