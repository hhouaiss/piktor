/**
 * Centralized Prompt Template System for Enterprise Furniture Photography
 * 
 * This module provides standardized, furniture-industry-focused prompt templates
 * that ensure consistent, high-quality results for commercial furniture photography
 * across all AI image generation endpoints.
 */

import {
  getFurnitureTypeDescription,
  getStyleDescription,
  buildMaterialSpecification,
  buildFeatureSpecification
} from './furniture-vocabulary';
import { ContextPreset, ProductProfile, UiSettings, getFieldValue } from './types';

// Core Template Structure for All Contexts
export interface PromptTemplate {
  baseStructure: string;
  contextSpecific: string;
  constraints: string[];
  qualityRequirements: string[];
  photographySpecs: string;
}

// Enhanced Product Analysis Templates
export const FURNITURE_ANALYSIS_TEMPLATES = {
  COMPREHENSIVE_ANALYSIS: `You are analyzing furniture product images for a commercial furniture company. Your analysis will drive AI image generation for enterprise clients who require professional-grade results.

🎯 CRITICAL MISSION: This analysis feeds GPT-image-1 and FLUX text-to-image models. Since these models cannot see reference images, your descriptions must be EXTRAORDINARILY DETAILED and use PROFESSIONAL FURNITURE TERMINOLOGY.

📋 FURNITURE INDUSTRY REQUIREMENTS:
- Use precise furniture trade terminology (e.g., "executive task chair" not "office chair")
- Specify construction methods (mortise-and-tenon, welded frame, etc.)
- Include commercial-grade specifications
- Reference industry-standard materials and finishes
- Identify mounting systems for wall-mounted pieces
- Note ergonomic and functional features

🔍 MATERIAL ANALYSIS FRAMEWORK:
1. PRIMARY CONSTRUCTION: Identify exact material types using furniture industry terms
   - Hardwood species with finish specifications
   - Metal alloys with surface treatments  
   - Upholstery grades and certifications
   - Hardware mechanisms and quality ratings

2. SURFACE TREATMENTS: Document all visible finishes
   - Wood stains, oils, lacquers with sheen levels
   - Metal coatings, platings, brushed textures
   - Fabric weaves, leather grains, vinyl patterns
   - Anti-microbial, stain-resistant properties

3. CONSTRUCTION DETAILS: Analyze build quality indicators
   - Joint types and craftsmanship quality
   - Hardware specifications and mechanisms
   - Structural supports and reinforcements
   - Manufacturing precision and tolerances

🏗️ TECHNICAL SPECIFICATIONS:
- Wall-mounting systems (if applicable): bracket types, load ratings
- Dimensional proportions with furniture industry standards
- Functional mechanisms: adjustability, mobility, storage
- Commercial durability indicators
- Compliance certifications (GREENGUARD, etc.)`,

  CONTEXT_SPECIFIC_GUIDANCE: {
    packshot: `PACKSHOT COMMERCIAL PHOTOGRAPHY STANDARDS:
- Studio lighting setup: three-point lighting with soft boxes
- Seamless white backdrop with gradient lighting
- Product centered with professional composition
- Sharp focus on material textures and construction details
- Commercial catalog photography quality
- No environmental distractions - product as sole focus`,

    lifestyle: `LIFESTYLE ENVIRONMENTAL PHOTOGRAPHY:
- Realistic commercial office or residential environment
- Natural ambient lighting with architectural context
- Product integrated naturally within setting
- Supporting elements that enhance product appeal
- Professional interior design aesthetic
- Lived-in atmosphere with contextual props`,

    hero: `HERO BANNER COMMERCIAL PHOTOGRAPHY:
- Dramatic lighting with architectural backdrop
- Wide composition suitable for website headers
- Strong visual impact with negative space for text
- Professional brand-appropriate aesthetics
- High-end commercial appeal
- Banner-ready composition with text overlay areas`,

    instagram: `SOCIAL MEDIA COMMERCIAL CONTENT:
- Square format optimized for Instagram feeds
- Social media engagement appeal with lifestyle context
- Balanced lighting for mobile device viewing
- Professional yet approachable aesthetic
- Brand-consistent visual identity
- Thumb-stopping visual appeal`,

    story: `VERTICAL MOBILE-OPTIMIZED CONTENT:
- 9:16 aspect ratio for mobile story formats
- Product prominently displayed in vertical composition
- Mobile-first viewing optimization
- Quick visual impact for story format
- Clean, uncluttered composition
- Social media friendly aesthetics`,

    detail: `CLOSE-UP CRAFTSMANSHIP PHOTOGRAPHY:
- Macro-level detail of materials and construction
- Sharp focus on textures, grains, and finishes
- Quality indicators and craftsmanship details
- Professional product detail photography
- Material showcase with excellent clarity
- Construction detail emphasis`
  }
};

// Base Prompt Templates by Context
export const CONTEXT_PROMPT_TEMPLATES: Record<ContextPreset, PromptTemplate> = {
  packshot: {
    baseStructure: `Professional commercial packshot of {PRODUCT_TYPE} featuring {MATERIAL_SPECS} in {STYLE_DESCRIPTION} design aesthetic, showcasing {CONSTRUCTION_DETAILS} with enterprise-grade construction quality.`,
    contextSpecific: `Studio photography setup with seamless white cyc backdrop, professional three-point lighting configuration using 5600K daylight balanced strobes, and precision-centered product composition. Commercial furniture catalog photography standards with macro-level material detail focus and texture definition. Lighting setup includes key light at 45-degree angle with 1000W strobe power, fill light at 1/3 ratio for shadow detail, and rim light for edge separation.`,
    constraints: [
      'Seamless white cyc studio backdrop only - no gradients or textures',
      'Zero environmental elements, props, or visual distractions',
      'Product as exclusive focus with professional three-point lighting setup',
      'Enterprise furniture catalog photography quality standards',
      'Sharp focus on material textures, grain patterns, and construction details',
      'Commercial furniture industry color accuracy requirements',
      'No shadows cast on backdrop - clean product isolation'
    ],
    qualityRequirements: [
      'Professional three-point studio lighting with 5600K color temperature',
      'High-resolution commercial photography quality suitable for large format printing',
      'Accurate color reproduction maintaining material fidelity and undertones',
      'Sharp focus throughout product with f/8 aperture for optimal depth coverage',
      'Proper exposure maintaining highlight detail and shadow information',
      'Commercial furniture industry professional presentation standards'
    ],
    photographySpecs: 'Three-quarter view angle optimal for furniture detail visibility, eye-level perspective matching human scale reference, soft box key lighting 45-degree placement, fill light ratio 3:1 for shadow detail, rim light for edge definition, seamless backdrop with subtle gradient lighting for depth.'
  },

  lifestyle: {
    baseStructure: `{PRODUCT_TYPE} featuring {MATERIAL_SPECS} in {STYLE_DESCRIPTION} design aesthetic, naturally integrated within a professionally designed {ENVIRONMENT_TYPE} environment that showcases {CONSTRUCTION_DETAILS} in authentic usage context.`,
    contextSpecific: `Environmental context photography utilizing natural window lighting supplemented with bounce fill, architectural interior setting with complementary design elements that enhance furniture appeal. Product positioned naturally within professionally styled interior space following interior design principles. Lighting maintains 5000K-5500K natural daylight balance with soft directional quality. Composition includes supporting furniture and accessories that create lifestyle context without competing for visual attention.`,
    constraints: [
      'Realistic commercial office or upscale residential environment appropriate for furniture category',
      'Natural ambient lighting conditions with minimal artificial fill lighting',
      'Product naturally integrated within setting - no obvious staging or artificial placement',
      'Professional interior design aesthetic following current design trends',
      'Complementary environmental elements that support product story without distraction',
      'Authentic spatial relationships and proportional accuracy',
      'Lifestyle appropriate props that enhance context without overwhelming product'
    ],
    qualityRequirements: [
      'Natural daylight balanced lighting with architectural ambiance and mood',
      'Environmental context that enhances product appeal and demonstrates real usage',
      'Professional interior design composition following design principles',
      'Lifestyle context that resonates with target market demographics and aspirations',
      'Authentic lived-in atmosphere while maintaining commercial photography standards',
      'Color harmony between product and environmental elements'
    ],
    photographySpecs: 'Wide environmental composition showing spatial context, natural lighting balance maintaining shadow detail, contextual framing with product as clear focal point, depth of field separating product from background elements, environmental perspective that tells usage story.'
  },

  hero: {
    baseStructure: `Dramatic hero banner presentation of {PRODUCT_TYPE} featuring {MATERIAL_SPECS} in {STYLE_DESCRIPTION} design aesthetic, showcasing {CONSTRUCTION_DETAILS} with high-impact commercial photography optimized for website header placement and brand representation.`,
    contextSpecific: `Hero banner photography utilizing dramatic directional lighting with architectural or minimalist backdrop, designed specifically for website header integration. Composition follows banner design principles with strategic negative space placement for text overlay integration. Lighting creates strong visual impact while maintaining furniture detail visibility and material authenticity. Wide format composition suitable for responsive web design across desktop and mobile viewing.`,
    constraints: [
      'Dramatic directional lighting creating strong visual impact and depth',
      'Wide banner composition optimized for 16:9 or 21:9 aspect ratios',
      'Strategic negative space reserved for text overlay in specified zones',
      'High-end commercial furniture brand appeal and luxury presentation',
      'Banner-ready composition following web design best practices',
      'Architectural or premium backdrop enhancing furniture prestige',
      'Strong focal point with clear visual hierarchy supporting text integration'
    ],
    qualityRequirements: [
      'Dramatic lighting for maximum visual impact while preserving material detail',
      'Professional luxury brand-appropriate aesthetics and premium presentation',
      'Composition strategically optimized for text overlay integration without compromising product visibility',
      'High-end commercial photography standards suitable for premium brand representation',
      'Visual impact that commands attention in website hero banner placement',
      'Professional color grading and tonal balance supporting brand aesthetic'
    ],
    photographySpecs: 'Wide banner composition 16:9 or wider, dramatic key lighting with architectural shadows, premium backdrop with texture or architectural elements, strategic text overlay space consideration, strong focal point with clear visual hierarchy, depth of field maintaining product sharpness while creating background separation.'
  },

  instagram: {
    baseStructure: `Social media optimized presentation of {PRODUCT_TYPE} with {MATERIAL_SPECS} in {STYLE_DESCRIPTION} design for Instagram engagement.`,
    contextSpecific: `Square format social media photography optimized for Instagram feeds. Professional lifestyle context with social media engagement appeal and mobile viewing optimization.`,
    constraints: [
      'Square 1:1 aspect ratio composition',
      'Social media engagement optimization',
      'Mobile device viewing optimization',
      'Professional yet approachable aesthetic',
      'Brand-consistent visual identity'
    ],
    qualityRequirements: [
      'Balanced lighting for mobile screen viewing',
      'Social media platform optimization',
      'Professional brand consistency',
      'Thumb-stopping visual appeal for feeds'
    ],
    photographySpecs: 'Square composition, social media lighting balance, mobile-optimized clarity, engagement-focused appeal.'
  },

  story: {
    baseStructure: `Vertical mobile-optimized presentation of {PRODUCT_TYPE} with {MATERIAL_SPECS} in {STYLE_DESCRIPTION} design for social media story format.`,
    contextSpecific: `Vertical 9:16 aspect ratio composition optimized for mobile story formats. Product prominently displayed with mobile-first viewing considerations and quick visual impact.`,
    constraints: [
      'Vertical 9:16 aspect ratio format',
      'Mobile-first viewing optimization',
      'Product prominently displayed in vertical space',
      'Quick visual impact for story consumption',
      'Clean, uncluttered vertical composition'
    ],
    qualityRequirements: [
      'Mobile story format optimization',
      'Vertical composition with product prominence',
      'Quick visual impact design',
      'Mobile device viewing clarity'
    ],
    photographySpecs: 'Vertical composition, mobile-optimized lighting, story format clarity, quick visual impact focus.'
  },

  detail: {
    baseStructure: `Close-up craftsmanship photography of {PRODUCT_TYPE} showcasing {MATERIAL_SPECS} and {CONSTRUCTION_DETAILS} in {STYLE_DESCRIPTION} design.`,
    contextSpecific: `Macro-level detail photography focusing on material textures, construction quality, and craftsmanship details. Professional product detail photography with emphasis on quality indicators.`,
    constraints: [
      'Macro-level detail focus on materials and construction',
      'Sharp focus on textures, grains, and surface treatments',
      'Quality indicators and craftsmanship prominence',
      'Professional detail photography standards',
      'Material showcase with maximum clarity'
    ],
    qualityRequirements: [
      'Macro photography clarity and detail',
      'Material texture and grain visibility',
      'Construction detail emphasis',
      'Professional craftsmanship showcase quality'
    ],
    photographySpecs: 'Macro lens detail, sharp focus on materials, texture emphasis lighting, construction detail clarity.'
  }
};

// Constraint Enforcement Templates
export const CONSTRAINT_TEMPLATES = {
  WALL_MOUNTED_ENFORCEMENT: `🚨 CRITICAL WALL-MOUNTED SAFETY REQUIREMENT: This furniture piece MUST remain securely attached to the wall using {MOUNTING_SYSTEM} with {HARDWARE_SPEC} grade commercial installation hardware. NEVER show floor contact, legs touching ground, free-standing placement, or detached positioning. Maintain proper wall-mounted positioning with minimum 2-inch clearance from floor surface. Wall mounting hardware must be visible and appropriate for commercial installations, showing proper attachment points and structural integrity. This is a SAFETY-CRITICAL requirement for commercial furniture specifications.`,

  WALL_MOUNTED_DESK_SPECIFIC: `🏢 CRITICAL WALL-MOUNTED DESK POSITIONING SPECIFICATION: This wall-mounted desk MUST be positioned at exactly 75cm (29.5 inches) from the floor to the desktop surface, which is the standard height for wall-mounted workspace furniture. The desk MUST appear suspended from the wall with NO legs, supports, or contact with the floor. Show visible heavy-duty wall mounting brackets or French cleat system appropriate for supporting desk loads (50-100kg capacity). The desk should appear to "float" above the floor with clear space underneath. Position as if installed in a commercial office environment at ergonomic standing desk height. This is CRITICAL for wall-mounted desk functionality and user safety.`,

  WALL_MOUNTED_HEIGHT_ENFORCEMENT: `📐 MANDATORY HEIGHT POSITIONING: Wall-mounted furniture must be positioned at industry-standard installation heights: Wall-mounted desks at 75cm from floor to surface, wall shelves at appropriate intervals based on function, wall cabinets with proper clearance above counter surfaces. Height positioning must reflect realistic commercial installation practices and ergonomic requirements. Show appropriate wall clearance and mounting hardware suitable for the specified installation height and furniture load requirements.`,

  MATERIAL_FIDELITY: `🔍 ENTERPRISE MATERIAL ACCURACY REQUIREMENT: Maintain EXACT material specifications - {MATERIAL_LIST} with authentic surface textures, grain patterns, finish characteristics, and reflectance properties. Color fidelity must match {COLOR_SPECIFICATION} with precise undertones, highlighting, and shadow characteristics. Material authenticity is critical for enterprise furniture catalog accuracy. Surface properties must reflect realistic material behavior including wear patterns, natural variations, and aging characteristics appropriate for commercial furniture grade materials.`,

  COMMERCIAL_QUALITY: `⭐ COMMERCIAL PHOTOGRAPHY STANDARDS ENFORCEMENT: Professional furniture photography quality meeting enterprise furniture catalog standards, suitable for high-end commercial marketing materials, luxury retail applications, and premium brand representation. Absolutely NO consumer-grade photography aesthetics, amateur lighting, or low-quality presentation. Photography must meet commercial furniture industry professional standards for color accuracy, detail resolution, and brand prestige representation.`,

  NO_TEXT_POLICY: `🚫 ABSOLUTE TEXT EXCLUSION ENFORCEMENT: Zero tolerance for any text, labels, captions, watermarks, logos, product numbers, model identifiers, brand marks, or written content within the image. Image must be completely clean and suitable for text overlay integration by professional design teams. Any visible text will result in rejection of the generated image. This includes reflective text, shadows of text, or partial text visibility.`,

  FURNITURE_SPECIFIC: `🏢 ENTERPRISE FURNITURE INDUSTRY COMPLIANCE: Product must conform to commercial furniture industry standards with accurate proportions meeting furniture industry specifications, professional construction details showing commercial-grade quality, and enterprise-grade quality indicators visible in the photography. No unrealistic interpretations, consumer-grade appearances, or non-commercial furniture aesthetics. Construction details must reflect actual commercial furniture manufacturing standards and quality expectations.`,

  DESK_TYPE_RECOGNITION: `💼 DESK TYPE IDENTIFICATION AND POSITIONING: Clearly distinguish between desk types and their appropriate positioning: Wall-mounted desks MUST be mounted to wall at 75cm height with no floor contact, Standing desks show adjustable legs with floor contact, Traditional desks show four legs with floor contact, Floating desks show wall-mounted with hidden brackets. The AI must recognize the specific desk type from the reference image and maintain that exact mounting/positioning configuration. Wall-mounted desks require specific mounting hardware visibility and proper installation height demonstration.`,

  CONTEXTUAL_INTEGRITY: `🎯 CONTEXT PRESERVATION REQUIREMENT: Maintain exact contextual requirements for {CONTEXT_TYPE} without deviation. Context-specific lighting, composition, and environmental requirements are mandatory and must be followed precisely. Any deviation from specified context parameters will compromise commercial furniture presentation standards.`,

  DIMENSIONAL_ACCURACY: `📏 DIMENSIONAL PRECISION REQUIREMENT: Maintain accurate proportional relationships and dimensional characteristics appropriate for specified furniture type. All proportional elements must reflect realistic commercial furniture dimensions and scaling. No distorted proportions, unrealistic scaling, or dimensionally impossible configurations.`
};

// Template Building Functions
export function buildEnhancedPrompt(
  profile: ProductProfile,
  settings: UiSettings,
  contextPreset: ContextPreset
): string {
  const template = CONTEXT_PROMPT_TEMPLATES[contextPreset];
  
  // Extract and enhance product information
  const productType = getFurnitureTypeDescription(String(getFieldValue(profile.type) || 'furniture'));
  const materials = buildMaterialSpecification(
    Array.isArray(profile.materials) ? profile.materials : [String(getFieldValue(profile.materials) || 'standard')]
  );
  const style = getStyleDescription(String(getFieldValue(profile.style) || 'modern'));
  
  // Build base description
  let enhancedPrompt = template.baseStructure
    .replace('{PRODUCT_TYPE}', productType)
    .replace('{MATERIAL_SPECS}', materials)
    .replace('{STYLE_DESCRIPTION}', style)
    .replace('{ENVIRONMENT_TYPE}', determineEnvironmentType(contextPreset, settings))
    .replace('{CONSTRUCTION_DETAILS}', buildConstructionDetails(profile))
    .replace('{MOUNTING_SYSTEM}', determineMountingSystem(profile))
    .replace('{HARDWARE_SPEC}', 'commercial-grade')
    .replace('{MATERIAL_LIST}', materials)
    .replace('{COLOR_SPECIFICATION}', getColorSpecification(profile));

  // Add context-specific requirements
  enhancedPrompt += `\n\nCONTEXT REQUIREMENTS:\n${template.contextSpecific}`;

  // Add furniture-specific constraints
  enhancedPrompt += '\n\nFURNITURE INDUSTRY CONSTRAINTS:';
  template.constraints.forEach(constraint => {
    enhancedPrompt += `\n- ${constraint}`;
  });

  // Add wall-mounted enforcement if applicable
  if (getFieldValue(profile.wallMounted)) {
    enhancedPrompt += `\n\n${CONSTRAINT_TEMPLATES.WALL_MOUNTED_ENFORCEMENT
      .replace('{MOUNTING_SYSTEM}', determineMountingSystem(profile))
      .replace('{HARDWARE_SPEC}', 'commercial-grade')}`;
    
    // Add desk-specific wall mounting if it's a desk
    const wallMountedProductType = String(getFieldValue(profile.type) || '').toLowerCase();
    if (wallMountedProductType.includes('desk') || wallMountedProductType.includes('workstation')) {
      enhancedPrompt += `\n\n${CONSTRAINT_TEMPLATES.WALL_MOUNTED_DESK_SPECIFIC}`;
    }
    
    enhancedPrompt += `\n\n${CONSTRAINT_TEMPLATES.WALL_MOUNTED_HEIGHT_ENFORCEMENT}`;
  }

  // Add material fidelity requirements
  enhancedPrompt += `\n\n${CONSTRAINT_TEMPLATES.MATERIAL_FIDELITY
    .replace('{MATERIAL_LIST}', materials)
    .replace('{COLOR_SPECIFICATION}', getColorSpecification(profile))}`;

  // Add commercial quality requirements
  enhancedPrompt += `\n\n${CONSTRAINT_TEMPLATES.COMMERCIAL_QUALITY}`;

  // Add no-text policy and desk type recognition
  if (settings.strictMode) {
    enhancedPrompt += `\n\n${CONSTRAINT_TEMPLATES.NO_TEXT_POLICY}`;
    enhancedPrompt += `\n\n${CONSTRAINT_TEMPLATES.FURNITURE_SPECIFIC}`;
  }
  
  // Always add desk type recognition for desks
  const deskProductType = String(getFieldValue(profile.type) || '').toLowerCase();
  if (deskProductType.includes('desk') || deskProductType.includes('workstation')) {
    enhancedPrompt += `\n\n${CONSTRAINT_TEMPLATES.DESK_TYPE_RECOGNITION}`;
  }

  // Add photography specifications
  enhancedPrompt += `\n\nPHOTOGRAPHY SPECIFICATIONS:\n${template.photographySpecs}`;

  // Add quality requirements
  enhancedPrompt += '\n\nQUALITY REQUIREMENTS:';
  template.qualityRequirements.forEach(req => {
    enhancedPrompt += `\n- ${req}`;
  });

  // Add settings-specific requirements
  enhancedPrompt += buildSettingsSpecifications(settings, contextPreset);

  return enhancedPrompt.trim();
}

// Helper Functions
function determineEnvironmentType(contextPreset: ContextPreset, settings: UiSettings): string {
  if (contextPreset !== 'lifestyle') return '';
  
  const backgroundMap: Record<string, string> = {
    'office': 'modern commercial office',
    'residential': 'contemporary residential interior',
    'hospitality': 'upscale hospitality environment',
    'healthcare': 'professional healthcare facility',
    'education': 'modern educational facility'
  };
  
  return backgroundMap[settings.backgroundStyle] || 'professional commercial interior';
}

function buildConstructionDetails(profile: ProductProfile): string {
  const features = getFieldValue(profile.features);
  if (!features || (Array.isArray(features) && features.length === 0)) {
    return 'professional construction details';
  }
  
  return buildFeatureSpecification(Array.isArray(features) ? features : [String(features)]);
}

function determineMountingSystem(profile: ProductProfile): string {
  if (!getFieldValue(profile.wallMounted)) return '';
  
  // Determine mounting system based on product type
  const productType = String(getFieldValue(profile.type) || '').toLowerCase();
  
  if (productType.includes('shelf') || productType.includes('cabinet')) {
    return 'heavy-duty bracket mounting system';
  }
  if (productType.includes('desk') || productType.includes('table')) {
    return 'fold-down wall mounting mechanism';
  }
  if (productType.includes('light') || productType.includes('lamp')) {
    return 'adjustable wall mounting arm';
  }
  
  return 'commercial-grade wall mounting system';
}

function getColorSpecification(profile: ProductProfile): string {
  const colorOverride = profile.colorOverride;
  const detectedColor = getFieldValue(profile.detectedColor);
  
  if (colorOverride) {
    return `${colorOverride} with accurate color fidelity and undertones`;
  }
  
  if (detectedColor) {
    return `${detectedColor} with authentic material color characteristics`;
  }
  
  return 'accurate material color representation';
}

function buildSettingsSpecifications(settings: UiSettings, contextPreset: ContextPreset): string {
  let specs = '\n\nUSER SETTINGS REQUIREMENTS:';
  
  // Background requirements
  specs += `\n- Background Style: ${settings.backgroundStyle} with professional presentation`;
  
  // Product positioning (for relevant contexts)
  if (contextPreset === 'packshot' || contextPreset === 'hero') {
    specs += `\n- Product Position: ${settings.productPosition} placement with optimal composition`;
  }
  
  // Reserved text zone
  if (settings.reservedTextZone) {
    specs += `\n- Reserved Text Zone: Keep ${settings.reservedTextZone} area clear for text overlay integration`;
  }
  
  // Props handling
  if (settings.props.length > 0) {
    specs += `\n- Approved Props: Include only ${settings.props.join(', ')} as complementary elements`;
  } else {
    specs += `\n- No Props: Clean focus on furniture product without additional objects`;
  }
  
  // Lighting requirements
  specs += `\n- Lighting Style: ${settings.lighting.replace('_', ' ')} with professional photography standards`;
  
  return specs;
}

// Export enhanced prompt building function
export function buildFurniturePrompt(
  profile: ProductProfile,
  settings: UiSettings,
  contextPreset: ContextPreset
): string {
  return buildEnhancedPrompt(profile, settings, contextPreset);
}