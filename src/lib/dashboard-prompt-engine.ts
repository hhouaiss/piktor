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

// Style Mapping to Professional Photography Terms
const STYLE_TRANSLATIONS = {
  moderne: {
    aesthetic: 'Modern Contemporary',
    description: 'Clean lines, minimalist design, geometric forms, sophisticated neutral palette',
    lighting: 'Sharp directional lighting with subtle shadows, high contrast',
    environment: 'Minimalist architectural setting with clean backgrounds',
    materials: 'Emphasize sleek surfaces, metal details, glass elements'
  },
  rustique: {
    aesthetic: 'Rustic Farmhouse',
    description: 'Natural textures, weathered finishes, authentic charm, warm earth tones',
    lighting: 'Warm ambient lighting with natural shadows, cozy atmosphere',
    environment: 'Natural wood elements, stone textures, countryside ambiance',
    materials: 'Highlight wood grain, natural imperfections, authentic patina'
  },
  industriel: {
    aesthetic: 'Industrial Loft',
    description: 'Raw materials, exposed elements, urban edge, concrete and metal fusion',
    lighting: 'Dramatic warehouse lighting with strong directional shadows',
    environment: 'Concrete walls, exposed brick, metal framework, urban setting',
    materials: 'Showcase metal patina, concrete textures, industrial hardware'
  },
  scandinave: {
    aesthetic: 'Scandinavian Minimalism',
    description: 'Nordic simplicity, light woods, functional design, hygge atmosphere',
    lighting: 'Soft natural light reminiscent of Nordic daylight, gentle shadows',
    environment: 'Light wood floors, white walls, plants, natural elements',
    materials: 'Emphasize light wood tones, natural textiles, simple forms'
  },
  boheme: {
    aesthetic: 'Bohemian Eclectic',
    description: 'Artistic layering, rich textures, global influences, creative expression',
    lighting: 'Warm atmospheric lighting with artistic shadow play',
    environment: 'Layered textiles, plants, artistic elements, eclectic mix',
    materials: 'Rich fabrics, carved details, mixed textures, artisanal quality'
  }
};

// Environment Mapping to Professional Settings
const ENVIRONMENT_TRANSLATIONS = {
  salon: {
    setting: 'Contemporary Living Room',
    description: 'Sophisticated residential living space with designer furniture arrangement',
    props: 'Elegant side tables, decorative objects, soft lighting fixtures',
    atmosphere: 'Welcoming yet refined, suitable for entertaining and relaxation'
  },
  bureau: {
    setting: 'Professional Office Environment',  
    description: 'Modern commercial workspace with ergonomic design principles',
    props: 'Professional desk accessories, task lighting, organizational elements',
    atmosphere: 'Productive, clean, ergonomically optimized for work efficiency'
  },
  cuisine: {
    setting: 'Designer Kitchen Space',
    description: 'High-end residential kitchen with premium finishes and appliances',
    props: 'Counter surfaces, subtle kitchen elements, natural light from windows',
    atmosphere: 'Clean, functional luxury with attention to culinary lifestyle'
  },
  chambre: {
    setting: 'Luxury Bedroom Suite',
    description: 'Serene bedroom environment with premium bedding and intimate lighting',
    props: 'Bedside elements, soft textiles, reading lights, personal touches',
    atmosphere: 'Restful, intimate, designed for relaxation and comfort'
  },
  studio: {
    setting: 'Professional Photo Studio',
    description: 'Clean commercial photography environment with neutral backdrop',
    props: 'No environmental props - pure product focus with professional lighting',
    atmosphere: 'Commercial catalog quality with zero distractions'
  }
};

// Lighting Translation to Photography Specifications
const LIGHTING_TRANSLATIONS = {
  naturelle: {
    setup: 'Natural Daylight Photography',
    technical: 'Soft window light, 5000K-5500K color temperature, gentle shadows',
    quality: 'Authentic daylight ambiance with natural shadow patterns',
    mood: 'Fresh, organic, life-like illumination'
  },
  chaleureuse: {
    setup: 'Warm Ambient Lighting',
    technical: '2700K-3000K warm white, multiple soft sources, cozy atmosphere',
    quality: 'Inviting warm glow with intimate shadow detail',
    mood: 'Comfortable, welcoming, homestyle ambiance'
  },
  professionnelle: {
    setup: 'Commercial Studio Lighting',
    technical: 'Three-point lighting setup, 5600K daylight balance, controlled shadows',
    quality: 'Professional catalog photography with perfect exposure balance',
    mood: 'Clean, commercial, suitable for marketing materials'
  }
};

// Angle Translation to Camera Positioning
const ANGLE_TRANSLATIONS = {
  face: {
    position: 'Frontal Product View',
    technical: 'Head-on perspective at eye level, symmetrical composition',
    benefit: 'Maximum product detail visibility and formal presentation'
  },
  'trois-quarts': {
    position: 'Three-Quarter Dynamic Angle',
    technical: '45-degree offset angle showing depth and dimensionality',
    benefit: 'Optimal balance of detail visibility and spatial depth'
  },
  profile: {
    position: 'Side Profile View',
    technical: '90-degree side angle emphasizing silhouette and proportions',
    benefit: 'Clear outline definition and proportional accuracy'
  },
  plongee: {
    position: 'Elevated Top-Down Perspective',
    technical: 'Overhead angle showing surface details and spatial context',
    benefit: 'Unique perspective ideal for surface textures and arrangements'
  }
};

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
  // Extract style configuration
  const styleConfig = STYLE_TRANSLATIONS[settings.style as keyof typeof STYLE_TRANSLATIONS];
  const environmentConfig = ENVIRONMENT_TRANSLATIONS[settings.environment as keyof typeof ENVIRONMENT_TRANSLATIONS];
  const lightingConfig = LIGHTING_TRANSLATIONS[settings.lighting as keyof typeof LIGHTING_TRANSLATIONS];
  const angleConfig = ANGLE_TRANSLATIONS[settings.angle as keyof typeof ANGLE_TRANSLATIONS];

  // Count primary and context images
  const primaryImages = productProfile.uploadedImages.filter(img => img.isPrimary !== false);
  const primaryCount = primaryImages.length > 0 ? 1 : 0; // First image is always primary
  const contextCount = Math.max(0, productProfile.uploadedImages.length - 1);

  // Build comprehensive prompt
  let prompt = `🏢 PROFESSIONAL FURNITURE PHOTOGRAPHY COMMISSION

📋 PRODUCT SPECIFICATIONS:
- Product: ${productProfile.productName}
- Category: ${getCategoryDescription(productProfile.productCategory)}
- Reference Images: ${productProfile.uploadedImages.length} high-quality source images provided
- Client Requirements: Generate ${settings.formats.length} format variations

📸 MULTI-IMAGE REFERENCE SYSTEM:
${productProfile.uploadedImages.length > 1 ? `- PRIMARY REFERENCE IMAGE (Image #1): This is the MAIN product image that defines the exact product appearance, design, colors, and overall form. The generated image MUST faithfully recreate this exact product.
- CONTEXT IMAGES (Images #2-${productProfile.uploadedImages.length}): These ${contextCount} additional images provide supplementary context about product details, textures, alternative angles, and specific features. Use them to understand fine details, material textures, and design nuances, but the PRIMARY image defines the core product identity.

MULTI-IMAGE PROCESSING RULES:
1. ALWAYS use the first image as the authoritative reference for product shape, proportions, and main appearance
2. Extract texture details, material quality, and fine craftsmanship from context images
3. If context images show different angles, use them to understand 3D form for accurate rendering from any requested angle
4. Context images may show color variations or accessories - maintain PRIMARY image color/design unless specifically requested otherwise` : `- Single reference image provided - use as the complete product reference`}

🎨 ARTISTIC DIRECTION - ${styleConfig.aesthetic.toUpperCase()}:
${styleConfig.description}

STYLE REQUIREMENTS:
- Aesthetic: ${styleConfig.aesthetic} design philosophy
- Materials Focus: ${styleConfig.materials}
- Visual Treatment: ${styleConfig.lighting}
- Environmental Context: ${styleConfig.environment}

🏠 ENVIRONMENTAL SETTING - ${environmentConfig.setting.toUpperCase()}:
${environmentConfig.description}

ENVIRONMENTAL SPECIFICATIONS:
- Setting: ${environmentConfig.setting}
- Atmosphere: ${environmentConfig.atmosphere}
- Contextual Props: ${environmentConfig.props}
- Spatial Context: Realistic furniture placement within appropriate interior space

💡 LIGHTING CONFIGURATION - ${lightingConfig.setup.toUpperCase()}:
${lightingConfig.technical}

LIGHTING REQUIREMENTS:
- Primary Setup: ${lightingConfig.setup}
- Technical Specs: ${lightingConfig.technical}
- Quality Standard: ${lightingConfig.quality}
- Atmospheric Mood: ${lightingConfig.mood}

📸 CAMERA POSITIONING - ${angleConfig.position.toUpperCase()}:
${angleConfig.technical}

COMPOSITION REQUIREMENTS:
- Camera Angle: ${angleConfig.position}
- Technical Position: ${angleConfig.technical}
- Visual Benefit: ${angleConfig.benefit}
- Professional Standards: Commercial furniture photography composition principles`;

  // Add format-specific optimizations
  if (settings.formats.length === 1) {
    const formatKey = settings.formats[0];
    const formatSpec = FORMAT_SPECIFICATIONS[formatKey as keyof typeof FORMAT_SPECIFICATIONS];
    if (formatSpec) {
      prompt += `\n\n📐 FORMAT OPTIMIZATION - ${formatKey.toUpperCase()}:
- Dimensions: ${formatSpec.dimensions}
- Aspect Ratio: ${formatSpec.aspectRatio}  
- Optimization: ${formatSpec.optimization}
- Composition: ${formatSpec.composition}`;
    }
  } else {
    prompt += `\n\n📐 MULTI-FORMAT REQUIREMENTS:
Generate optimized compositions for ${settings.formats.length} formats:`;
    settings.formats.forEach(format => {
      const spec = FORMAT_SPECIFICATIONS[format as keyof typeof FORMAT_SPECIFICATIONS];
      if (spec) {
        prompt += `\n- ${format}: ${spec.aspectRatio} (${spec.optimization})`;
      }
    });
  }

  // Add product dimensions if provided (for realistic proportions)
  if (settings.dimensions) {
    const dims = settings.dimensions;
    const hasDimensions = dims.width || dims.depth || dims.height;

    if (hasDimensions) {
      const unit = dims.unit || 'cm';
      const dimensionParts = [];
      if (dims.width) dimensionParts.push(`Width: ${dims.width}${unit}`);
      if (dims.depth) dimensionParts.push(`Depth: ${dims.depth}${unit}`);
      if (dims.height) dimensionParts.push(`Height: ${dims.height}${unit}`);

      prompt += `\n\n📏 PRODUCT DIMENSIONS (CRITICAL FOR REALISTIC PROPORTIONS):
${dimensionParts.join(' | ')}

DIMENSIONAL ACCURACY REQUIREMENTS:
- The product MUST be rendered with EXACT real-world proportions based on these dimensions
- All furniture elements (legs, armrests, cushions, etc.) must be proportionally accurate
- The product should appear at realistic scale within the environment
- Compare against standard furniture scales: typical sofa seat height ~45cm, dining table ~75cm, coffee table ~45cm
- Ensure the product does not appear unnaturally large or small relative to the environment
- Use the dimensions to calculate accurate aspect ratios and depth perception in the final image`;
    }
  }

  // Add user's custom instructions if provided
  if (settings.customPrompt && settings.customPrompt.trim()) {
    prompt += `\n\n💬 CLIENT SPECIAL INSTRUCTIONS:
${settings.customPrompt}

INTEGRATION REQUIREMENT: Seamlessly incorporate these client specifications while maintaining all professional photography standards above.`;
  }

  // Add professional quality constraints
  prompt += `\n\n🎯 PROFESSIONAL QUALITY REQUIREMENTS:

MANDATORY STANDARDS:
- Commercial furniture photography quality meeting professional catalog standards
- Exact product fidelity - maintain all design details, proportions, and characteristics
- Professional color accuracy with authentic material representation
- Enterprise-grade lighting and composition following furniture industry best practices
- High-resolution detail suitable for commercial marketing materials

ABSOLUTE PROHIBITIONS:
- No text, labels, watermarks, or written content in image
- No unrealistic modifications to product design or structure
- No amateur photography aesthetics or consumer-grade presentation
- No cluttered composition that detracts from product focus
- No inconsistent lighting or unprofessional shadow patterns

🔧 TECHNICAL EXECUTION:
- Use reference images as authoritative source for product accuracy
- Maintain exact product proportions and design integrity
- Apply style and environmental choices as contextual enhancement only
- Ensure lighting choice enhances rather than alters product characteristics
- Generate composition that showcases product optimally within chosen environment

FINAL REQUIREMENT: The result must be indistinguishable from professional commercial furniture photography while perfectly executing the user's style, environment, lighting, and angle preferences.`;

  return prompt;
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