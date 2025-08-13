import { ProductProfile, UiSettings, ContextPreset, TextToImagePrompts, getFieldValue } from '@/lib/types';
import { buildFurniturePrompt } from './prompt-templates';
import { buildConstraintEnforcement } from './constraint-enforcement';
import { getFurnitureTypeDescription, buildMaterialSpecification } from './furniture-vocabulary';

// OpenAI GPT-4 image generation prompt limit
const OPENAI_PROMPT_LIMIT = 1000;
const CRITICAL_LENGTH_THRESHOLD = 900; // Alert before hitting limit

export interface PromptValidationResult {
  isValid: boolean;
  length: number;
  limit: number;
  exceedsLimit: boolean;
  isNearLimit: boolean;
  suggestions?: string[];
}

export interface OptimizedPromptResult {
  prompt: string;
  originalLength: number;
  optimizedLength: number;
  optimizationApplied: boolean;
  validationResult: PromptValidationResult;
}

export function buildPrompt(
  profile: ProductProfile,
  settings: UiSettings,
  contextPreset: ContextPreset
): string {
  // Check if we have enhanced textToImagePrompts from GPT-4o analysis
  if (profile.textToImagePrompts && 
      typeof profile.textToImagePrompts === 'object' && 
      'baseDescription' in profile.textToImagePrompts) {
    
    // Use the enhanced furniture-industry prompt system
    return buildEnhancedFurniturePrompt(profile, settings, contextPreset);
  }
  
  // Use new centralized furniture prompt system for legacy data
  return buildFurniturePrompt(profile, settings, contextPreset);
}

// Enhanced furniture-industry prompt builder using GPT-4o analysis data
export function buildEnhancedFurniturePrompt(
  profile: ProductProfile,
  settings: UiSettings,
  contextPreset: ContextPreset
): string {
  const textPrompts = profile.textToImagePrompts!;
  return buildGptImagePrompt(textPrompts, contextPreset, settings, profile);
}

// Enhanced GPT image prompt builder with furniture industry focus and systematic constraint enforcement
export function buildGptImagePrompt(
  textPrompts: TextToImagePrompts,
  contextPreset: ContextPreset,
  settings: UiSettings,
  profile?: ProductProfile
): string {
  // Enhanced furniture industry base description with technical details
  const baseDescription = textPrompts.baseDescription || "Professional commercial furniture photography meeting enterprise catalog standards";
  const contextPrompt = textPrompts[contextPreset] || textPrompts.packshot || "Clean commercial furniture packshot with professional studio lighting";
  const photographySpecs = textPrompts.photographySpecs || {};
  const visualDetails = textPrompts.visualDetails || {};

  // Determine furniture category for specialized handling
  const furnitureType = profile ? getFurnitureTypeDescription(String(getFieldValue(profile.type) || 'furniture')) : 'commercial_grade_furniture';
  
  // Build comprehensive enterprise furniture industry prompt
  let prompt = `🏢 ENTERPRISE FURNITURE PHOTOGRAPHY SPECIFICATION:
${contextPrompt}

📋 COMMERCIAL FURNITURE TECHNICAL REQUIREMENTS:
${baseDescription}

🔧 ADVANCED MATERIAL & CONSTRUCTION SPECIFICATIONS:
- Primary Materials & Construction: ${visualDetails.materialTextures || 'Commercial-grade furniture materials with authentic surface textures, grain patterns, and finish characteristics meeting furniture industry standards'}
- Color Precision & Fidelity: ${visualDetails.colorPalette || 'Precise color reproduction with accurate undertones, highlights, and material-specific reflectance properties matching commercial furniture specifications'}  
- Hardware & Mechanical Components: ${visualDetails.hardwareDetails || 'Professional furniture hardware with commercial-grade specifications, proper joint construction, and mechanism visibility appropriate for enterprise furniture'}
- Dimensional & Proportional Accuracy: ${visualDetails.proportionalRelationships || 'Industry-standard furniture proportions and scaling meeting commercial furniture dimensional requirements with authentic size relationships'}

📸 PROFESSIONAL COMMERCIAL PHOTOGRAPHY SPECIFICATIONS:
- Camera Position & Perspective: ${photographySpecs.cameraAngle || 'Professional three-quarter view angle with optimal furniture detail visibility and human-scale perspective reference'}
- Advanced Lighting Configuration: ${photographySpecs.lightingSetup || 'Commercial furniture photography lighting setup with three-point lighting, 5600K color temperature, and professional shadow control'}
- Optical Focus Requirements: ${photographySpecs.depthOfField || 'Sharp product focus throughout with f/8 aperture for optimal depth coverage and material detail clarity'}
- Professional Composition Standards: ${photographySpecs.composition || 'Professional furniture catalog composition following commercial photography principles with proper negative space and visual hierarchy'}

⚙️ CLIENT-SPECIFIC CONFIGURATION SETTINGS:
- Background Treatment: ${settings.backgroundStyle || 'professional neutral backdrop'} - enterprise furniture presentation standards with appropriate lighting treatment
- Product Positioning Strategy: ${settings.productPosition || 'centered'} placement with optimal viewing angle for furniture category: ${furnitureType}
- Lighting Style Preference: ${settings.lighting?.replace('_', ' ') || 'soft commercial lighting'} specifically optimized for furniture photography and material enhancement`;

  // Add enhanced furniture industry context-specific requirements with systematic constraint enforcement
  switch (contextPreset) {
    case 'packshot':
      prompt += `\n\n🎯 ENTERPRISE COMMERCIAL PACKSHOT REQUIREMENTS:
- Seamless white cyc studio backdrop meeting furniture catalog industry standards with professional gradient lighting
- Three-point commercial lighting setup: 5600K daylight balanced strobes with key light 45-degree placement, fill light 1:3 ratio, rim light for edge separation
- Furniture product as exclusive visual focus with zero competing elements or distractions
- Enterprise furniture catalog photography quality suitable for large format printing and commercial marketing
- Absolute prohibition of environmental elements, props, or visual distractions not specifically approved
- Professional product isolation optimized for marketing material integration and text overlay capability
- Commercial furniture industry color accuracy and material fidelity standards enforcement`;
      break;
      
    case 'lifestyle':
      prompt += `\n\n🏠 ENTERPRISE FURNITURE LIFESTYLE ENVIRONMENT REQUIREMENTS:
- Authentic commercial office or upscale residential interior environment appropriate for furniture category and target market
- Natural ambient lighting balanced with architectural context: 5000K-5500K daylight with soft directional quality
- Contextual furniture arrangement showing realistic spatial relationships and usage scenarios
- Professionally styled interior design atmosphere following current commercial design trends
- Furniture naturally integrated within realistic setting demonstrating authentic usage and spatial context
- Commercial interior design aesthetic standards with supporting elements that enhance product story
- Environmental context that elevates furniture appeal while maintaining clear product focus and commercial presentation quality`;
      break;
      
    case 'hero':
      prompt += `\n\n🌟 ENTERPRISE FURNITURE HERO BANNER REQUIREMENTS:
- Dramatic architectural composition optimized for website header placement with 16:9 or wider aspect ratio
- Professional commercial lighting creating strong visual impact while preserving material detail and authenticity
- Furniture prominently featured for premium brand representation with luxury commercial appeal
- Strategic negative space reserved for text overlay integration in specified zones without compromising product visibility
- High-end furniture brand commercial appeal meeting luxury market presentation standards
- Banner-ready composition following web design best practices with clear visual hierarchy
- Professional color grading and tonal balance supporting premium brand aesthetic and marketing objectives`;
      break;
      
    case 'story':
      prompt += `\n\n📱 MOBILE STORY FORMAT FURNITURE REQUIREMENTS:
- Vertical 9:16 mobile-optimized furniture composition designed for Instagram/Facebook story formats
- Eye-catching furniture presentation optimized for mobile viewing and social media engagement
- Product prominently displayed within vertical mobile frame with thumb-stopping visual appeal
- Social media furniture marketing optimization with mobile-first viewing considerations
- Clean, uncluttered vertical composition maintaining professional furniture brand standards
- Quick visual impact design suitable for story format consumption patterns and mobile user behavior`;
      break;
      
    case 'instagram':
      prompt += `\n\n📷 ENTERPRISE FURNITURE INSTAGRAM REQUIREMENTS:
- Square 1:1 composition specifically optimized for Instagram feed furniture showcase and social media engagement
- Social media furniture engagement appeal balanced with professional brand consistency
- Mobile-optimized lighting ensuring furniture visibility across various mobile device screens and viewing conditions
- Professional furniture brand aesthetic maintaining commercial quality while achieving social media appeal
- Instagram furniture content standards meeting platform optimization while preserving enterprise furniture presentation quality
- Brand-consistent visual identity supporting social media marketing objectives and furniture brand positioning`;
      break;
      
    case 'detail':
      prompt += `\n\n🔍 ENTERPRISE FURNITURE DETAIL CRAFTSMANSHIP REQUIREMENTS:
- Macro-level furniture craftsmanship photography showcasing commercial construction quality and material authenticity
- Close-up material texture and construction detail emphasis revealing furniture quality indicators
- Furniture workmanship showcase highlighting enterprise-grade construction methods and quality standards
- Professional furniture detail photography standards with macro lens clarity and material texture definition
- Material authenticity and construction clarity demonstrating commercial furniture manufacturing excellence
- Quality indicator emphasis showing construction details, joinery, hardware, and finish quality appropriate for enterprise furniture catalogs`;
      break;
  }

  // Add enhanced furniture industry constraints
  if (profile) {
    prompt += buildConstraintEnforcement(profile, settings, contextPreset);
  } else {
    // Fallback furniture quality requirements
    prompt += `\n\n🎯 FURNITURE INDUSTRY QUALITY STANDARDS:
- Photorealistic commercial furniture rendering
- High-resolution detail with material clarity
- Enterprise furniture photography quality
- Accurate furniture product representation
- Professional furniture catalog standards
- No text, labels, model numbers, or watermarks
- Commercial furniture brand presentation quality`;
  }

  return prompt.trim();
}

export function buildOptimizedPrompt(
  profile: ProductProfile,
  settings: UiSettings,
  contextPreset: ContextPreset
): OptimizedPromptResult {
  // Build initial prompt
  const initialPrompt = buildFullPrompt(profile, settings, contextPreset);
  const originalLength = initialPrompt.length;
  
  // Validate prompt length
  let validation = validatePromptLength(initialPrompt);
  let finalPrompt = initialPrompt;
  let optimizationApplied = false;

  // Apply optimization if needed
  if (validation.exceedsLimit || validation.isNearLimit) {
    const optimized = optimizePromptLength(profile, settings, contextPreset, OPENAI_PROMPT_LIMIT - 50);
    finalPrompt = optimized;
    validation = validatePromptLength(finalPrompt);
    optimizationApplied = true;
  }

  return {
    prompt: finalPrompt,
    originalLength,
    optimizedLength: finalPrompt.length,
    optimizationApplied,
    validationResult: validation
  };
}

function buildFullPrompt(
  profile: ProductProfile,
  settings: UiSettings,
  contextPreset: ContextPreset
): string {
  const basePrompt = getBasePrompt(contextPreset);
  const productDescription = buildProductDescription(profile);
  const layoutInstructions = buildLayoutInstructions(settings, contextPreset);
  const constraintsBlock = buildConstraintsBlock(settings, profile);
  const contextSpecificInstructions = getContextSpecificInstructions(contextPreset, settings);
  const negativePrompt = getNegativePrompt();

  const prompt = `${basePrompt}

${productDescription}

${layoutInstructions}

${constraintsBlock}

${contextSpecificInstructions}

${negativePrompt}`.trim();

  return prompt;
}

function getBasePrompt(contextPreset: ContextPreset): string {
  const furnitureContextDescriptions = {
    packshot: 'professional commercial furniture packshot',
    instagram: 'Instagram-ready furniture showcase post',
    story: 'Instagram/Facebook story format furniture presentation',
    hero: 'website hero banner furniture showcase',
    lifestyle: 'lifestyle furniture image in realistic interior setting',
    detail: 'detailed close-up furniture craftsmanship shot'
  };
  
  return `Create a high-quality ${furnitureContextDescriptions[contextPreset]} using professional furniture photography standards. The result should be enterprise-grade furniture visualization that maintains exact product fidelity while meeting commercial furniture industry presentation requirements.`;
}

function buildProductDescription(profile: ProductProfile): string {
  const featuresValue = getFieldValue(profile.features);
  const furnitureFeatures = Array.isArray(featuresValue) && featuresValue.length > 0
    ? `Commercial Features: ${featuresValue.map(f => `professional ${f}`).join(', ')}.` 
    : '';
  
  // Enhanced furniture type description
  const furnitureType = getFurnitureTypeDescription(String(getFieldValue(profile.type) || 'furniture'));
  
  // Enhanced material specification
  const materialsValue = getFieldValue(profile.materials);
  const furnitureMaterials = materialsValue ? 
    buildMaterialSpecification(Array.isArray(materialsValue) ? materialsValue : [String(materialsValue)]) :
    'commercial-grade furniture materials';
  
  // Use color override if available, otherwise use detected color
  const effectiveColor = profile.colorOverride || getFieldValue(profile.detectedColor);
  
  const wallMountedNote = getFieldValue(profile.wallMounted)
    ? buildWallMountedNote(profile)
    : '';

  const dimensionsNote = profile.realDimensions && 
    (profile.realDimensions.width || profile.realDimensions.height || profile.realDimensions.depth)
    ? `Commercial Dimensions: ${profile.realDimensions.width}cm W × ${profile.realDimensions.height}cm H × ${profile.realDimensions.depth}cm D (industry standard proportions).`
    : '';

  const additionalNotes = profile.notes ? `Enterprise Context: ${profile.notes}` : '';

  return `🏢 COMMERCIAL FURNITURE SPECIFICATIONS:
- Furniture Type: ${furnitureType}
- Construction Materials: ${furnitureMaterials}
- Color Specification: ${effectiveColor} (with accurate material undertones)
- Design Style: ${getFieldValue(profile.style)} commercial aesthetic
${furnitureFeatures}
${dimensionsNote}
${wallMountedNote}
${additionalNotes}`.trim();
}

function buildLayoutInstructions(settings: UiSettings, contextPreset: ContextPreset): string {
  const positionInstruction = (contextPreset === 'hero' || contextPreset === 'packshot') 
    ? `- Product position: ${settings.productPosition}`
    : '';

  const textZoneInstruction = settings.reservedTextZone
    ? `- Reserved text zone: ${settings.reservedTextZone} (leave this area clear for text overlay)`
    : '';

  const propsInstruction = settings.props.length > 0
    ? `- Props allowed: ${settings.props.join(', ')}`
    : '- Props: none (clean focus on product)';

  return `LAYOUT & COMPOSITION:
- Background: ${settings.backgroundStyle}
${positionInstruction}
${textZoneInstruction}
${propsInstruction}
- Lighting: ${settings.lighting.replace('_', ' ')}`.trim();
}

function buildConstraintsBlock(settings: UiSettings, profile: ProductProfile): string {
  // Use the new comprehensive constraint enforcement system
  return buildConstraintEnforcement(profile, settings, settings.contextPreset);
}

function getContextSpecificInstructions(contextPreset: ContextPreset, settings: UiSettings): string {
  switch (contextPreset) {
    case 'hero':
      return `🌟 FURNITURE HERO BANNER REQUIREMENTS:
- Ensure visual balance and negative space for text overlay placement
- Leave breathing room ${settings.reservedTextZone ? `on the ${settings.reservedTextZone} side` : 'opposite the furniture positioning'}
- High-impact furniture composition suitable for commercial website headers
- Professional furniture brand presentation - no text in image (added by website)
- Commercial furniture hero banner standards`;
      
    case 'story':
      return `📱 FURNITURE STORY FORMAT REQUIREMENTS:
- Vertical composition optimized for mobile furniture showcase
- Furniture should be prominently centered and featured
- Mobile story format considerations for furniture visibility
- Clean, thumb-stopping furniture visual appeal
- Social media furniture content standards`;
      
    case 'packshot':
      return `🎯 COMMERCIAL FURNITURE PACKSHOT REQUIREMENTS:
- Clean, neutral presentation focusing entirely on furniture product
- Minimal distractions - furniture as exclusive focus
- Suitable for furniture catalogs and commercial product listings
- Professional studio-quality lighting for furniture photography
- Enterprise furniture packshot standards`;
      
    case 'instagram':
      return `📷 FURNITURE INSTAGRAM REQUIREMENTS:
- Engaging, social-media ready furniture composition
- Consider furniture visibility in Instagram feed context
- Balanced lighting optimized for furniture on mobile screens
- Professional yet approachable furniture aesthetic
- Commercial furniture brand social media standards`;
      
    case 'lifestyle':
      return `🏠 FURNITURE LIFESTYLE REQUIREMENTS:
- Furniture shown in realistic commercial or residential environment
- Natural lighting with architectural context for furniture
- Lived-in atmosphere with complementary interior elements
- Furniture naturally integrated within professional interior scene
- Commercial furniture environmental showcase standards`;
      
    case 'detail':
      return `🔍 FURNITURE DETAIL REQUIREMENTS:
- Close-up focus on furniture craftsmanship and construction quality
- High detail clarity of materials, joinery, and hardware
- Showcase furniture quality indicators and workmanship
- Professional furniture detail photography standards
- Commercial furniture construction detail emphasis`;
      
    default:
      return '';
  }
}

function getNegativePrompt(): string {
  return `🚫 FURNITURE PHOTOGRAPHY PROHIBITIONS (AVOID AT ALL COSTS): 
text overlays, captions, logos, stickers, price tags, model numbers, annotations, extra furniture not listed in approved props, floor contact for wall-mounted furniture, unrealistic reflections, heavy noise, over-saturation, cartoonish appearance, duplicate furniture pieces, cluttered composition, consumer-grade photography aesthetics, amateur furniture staging, non-commercial presentation quality.`;
}

export function getImageSize(contextPreset: ContextPreset): "1024x1024" | "1024x1536" | "1536x1024" {
  const sizeMapping = {
    packshot: "1024x1024" as const,
    instagram: "1024x1024" as const,
    story: "1024x1536" as const,
    hero: "1536x1024" as const,
    lifestyle: "1536x1024" as const,
    detail: "1024x1024" as const,
  };

  return sizeMapping[contextPreset];
}

export function validatePromptLength(prompt: string): PromptValidationResult {
  const length = prompt.length;
  const exceedsLimit = length > OPENAI_PROMPT_LIMIT;
  const isNearLimit = length > CRITICAL_LENGTH_THRESHOLD;
  
  const suggestions = [];
  
  if (exceedsLimit) {
    suggestions.push(`Prompt is ${length - OPENAI_PROMPT_LIMIT} characters over the ${OPENAI_PROMPT_LIMIT} character limit`);
    suggestions.push("Consider reducing product features, simplifying descriptions, or enabling optimization");
  } else if (isNearLimit) {
    suggestions.push(`Prompt is ${length}/${OPENAI_PROMPT_LIMIT} characters - close to limit`);
    suggestions.push("Consider enabling optimization to ensure reliable generation");
  }

  return {
    isValid: !exceedsLimit,
    length,
    limit: OPENAI_PROMPT_LIMIT,
    exceedsLimit,
    isNearLimit: isNearLimit && !exceedsLimit,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
}

function optimizePromptLength(
  profile: ProductProfile,
  settings: UiSettings,
  contextPreset: ContextPreset,
  targetLength: number
): string {
  // Start with a condensed version of each section
  const basePrompt = getOptimizedBasePrompt(contextPreset);
  const productDescription = buildOptimizedProductDescription(profile);
  const layoutInstructions = buildOptimizedLayoutInstructions(settings, contextPreset);
  const constraints = getOptimizedConstraints(settings, profile);
  const contextInstructions = getOptimizedContextInstructions(contextPreset, settings);
  
  // Build sections in order of importance
  const sections = [
    basePrompt,
    productDescription,
    layoutInstructions,
    constraints,
    contextInstructions
  ];

  let optimizedPrompt = sections.filter(section => section.trim()).join('\n\n').trim();

  // If still too long, apply progressive optimization
  if (optimizedPrompt.length > targetLength) {
    optimizedPrompt = applyProgressiveOptimization(optimizedPrompt, targetLength);
  }

  return optimizedPrompt;
}

function getOptimizedBasePrompt(contextPreset: ContextPreset): string {
  const contextMap = {
    packshot: 'Professional product packshot',
    instagram: 'Instagram product post', 
    story: 'Instagram story product image',
    hero: 'Website hero product image',
    lifestyle: 'Lifestyle product scene',
    detail: 'Detailed product close-up'
  };
  
  return `Create ${contextMap[contextPreset]} using reference image. Commercial-grade product visualization with exact fidelity.`;
}

function buildOptimizedProductDescription(profile: ProductProfile): string {
  // Prioritize essential information
  const type = String(getFieldValue(profile.type) || 'product');
  const materialsValue = getFieldValue(profile.materials);
  const materials = materialsValue ? truncateText(String(materialsValue), 80) : '';
  const color = profile.colorOverride || String(getFieldValue(profile.detectedColor) || 'neutral');
  const styleValue = getFieldValue(profile.style);
  const style = styleValue ? truncateText(String(styleValue), 50) : '';
  
  // Limit features to most important ones
  const featuresValue = getFieldValue(profile.features);
  const topFeatures = Array.isArray(featuresValue) ? featuresValue.slice(0, 3).map(f => truncateText(String(f), 30)) : [];
  
  const wallMounted = getFieldValue(profile.wallMounted) ? 'Wall-mounted.' : '';
  
  const parts = [
    `Type: ${type}`,
    materials ? `Materials: ${materials}` : '',
    `Color: ${color}`,
    style ? `Style: ${style}` : '',
    topFeatures.length > 0 ? `Features: ${topFeatures.join(', ')}` : '',
    wallMounted
  ].filter(Boolean);

  return parts.join('. ');
}

function buildOptimizedLayoutInstructions(settings: UiSettings, contextPreset: ContextPreset): string {
  const parts = [
    `Background: ${truncateText(settings.backgroundStyle, 40)}`,
    (contextPreset === 'hero' || contextPreset === 'packshot') ? `Position: ${settings.productPosition}` : '',
    settings.reservedTextZone ? `Text zone: ${settings.reservedTextZone}` : '',
    settings.props.length > 0 ? `Props: ${settings.props.slice(0, 2).join(', ')}` : 'No props',
    `Lighting: ${settings.lighting.replace('_', ' ')}`
  ].filter(Boolean);

  return parts.join('. ');
}

function getOptimizedConstraints(settings: UiSettings, profile: ProductProfile): string {
  const constraints = ['Exact product fidelity', 'Commercial quality'];
  
  if (settings.strictMode) {
    constraints.push('No text/labels');
    if (getFieldValue(profile.wallMounted)) {
      constraints.push('Wall-mounted only');
    }
  }

  if (profile.colorOverride && profile.colorOverride !== getFieldValue(profile.detectedColor)) {
    constraints.push(`Color: ${profile.colorOverride}`);
  }

  return `Constraints: ${constraints.join(', ')}.`;
}

function getOptimizedContextInstructions(contextPreset: ContextPreset, settings: UiSettings): string {
  switch (contextPreset) {
    case 'hero':
      return `Hero banner: Visual balance, breathing room ${settings.reservedTextZone || 'opposite product'}, no text in image.`;
    case 'story':
      return 'Vertical mobile format, centered product, thumb-stopping appeal.';
    case 'packshot':
      return 'Clean neutral focus, minimal distractions, catalog-quality.';
    case 'instagram':
      return 'Social-ready composition, mobile-optimized, professional aesthetic.';
    case 'lifestyle':
      return 'Realistic home environment, natural lighting, contextual integration.';
    case 'detail':
      return 'Close-up focus, high detail, craftsmanship showcase.';
    default:
      return '';
  }
}

function applyProgressiveOptimization(prompt: string, targetLength: number): string {
  if (prompt.length <= targetLength) return prompt;

  // Progressive optimization strategies
  let optimized = prompt;

  // 1. Remove redundant phrases
  optimized = optimized
    .replace(/\s+/g, ' ')
    .replace(/\.\s+/g, '. ')
    .replace(/:\s+/g, ': ')
    .trim();

  if (optimized.length <= targetLength) return optimized;

  // 2. Abbreviate common words
  const abbreviations = {
    'professional': 'pro',
    'commercial': 'comm.',
    'high-quality': 'hi-qual',
    'specifications': 'specs',
    'requirements': 'req.',
    'composition': 'comp.',
    'lighting': 'light',
    'background': 'bg',
    'product': 'prod'
  };

  for (const [full, abbrev] of Object.entries(abbreviations)) {
    optimized = optimized.replace(new RegExp(full, 'gi'), abbrev);
  }

  if (optimized.length <= targetLength) return optimized;

  // 3. Final truncation with ellipsis
  return optimized.substring(0, targetLength - 3) + '...';
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function buildWallMountedNote(profile: ProductProfile): string {
  const productType = String(getFieldValue(profile.type) || '').toLowerCase();
  
  if (productType.includes('desk') || productType.includes('workstation')) {
    return 'CRITICAL WALL-MOUNTED DESK REQUIREMENT: This desk MUST be wall-mounted at exactly 75cm (29.5 inches) from floor to desktop surface - never show floor contact, legs, or free-standing placement. Show heavy-duty mounting brackets and clear space underneath. The desk must appear suspended at standard ergonomic working height.';
  }
  
  return 'CRITICAL WALL-MOUNTED REQUIREMENT: This furniture piece MUST remain securely wall-mounted - never show floor contact or free-standing placement. Maintain proper commercial wall-mounting system visibility.';
}