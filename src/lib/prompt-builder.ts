import { ProductProfile, UiSettings, ContextPreset, getFieldValue } from '@/components/image-generator/types';

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
    
    // Use the rich prompts from GPT-4o analysis
    return buildGptImagePrompt(profile.textToImagePrompts, contextPreset, settings);
  }
  
  // Fallback to legacy prompt building for backward compatibility
  const result = buildOptimizedPrompt(profile, settings, contextPreset);
  return result.prompt;
}

// New function to build prompts using GPT-4o enhanced analysis
function buildGptImagePrompt(
  textPrompts: any,
  contextPreset: ContextPreset,
  settings: UiSettings
): string {
  const baseDescription = textPrompts.baseDescription || "Professional product image";
  const contextPrompt = textPrompts[contextPreset] || textPrompts.packshot || "Clean product shot";
  const photographySpecs = textPrompts.photographySpecs || {};
  const visualDetails = textPrompts.visualDetails || {};

  // Build comprehensive prompt for GPT-image-1
  let prompt = `${contextPrompt}

PRODUCT DETAILS:
${baseDescription}

VISUAL SPECIFICATIONS:
- Materials: ${visualDetails.materialTextures || 'High-quality materials'}
- Colors: ${visualDetails.colorPalette || 'Accurate product colors'}  
- Hardware: ${visualDetails.hardwareDetails || 'Detailed hardware elements'}
- Proportions: ${visualDetails.proportionalRelationships || 'Correct product proportions'}

PHOTOGRAPHY SPECIFICATIONS:
- Camera Angle: ${photographySpecs.cameraAngle || 'Professional three-quarter view'}
- Lighting: ${photographySpecs.lightingSetup || 'Professional studio lighting'}
- Depth of Field: ${photographySpecs.depthOfField || 'Product in sharp focus'}
- Composition: ${photographySpecs.composition || 'Balanced professional composition'}

CONTEXT SETTINGS:
- Background: ${settings.backgroundStyle || 'neutral'}
- Product Position: ${settings.productPosition || 'center'}
- Lighting Style: ${settings.lighting?.replace('_', ' ') || 'soft daylight'}`;

  // Add context-specific requirements
  switch (contextPreset) {
    case 'packshot':
      prompt += `\n\nPACKSHOT REQUIREMENTS:
- Clean, minimal background
- Studio lighting setup
- Product as primary focus
- Commercial photography quality
- No distracting elements`;
      break;
      
    case 'lifestyle':
      prompt += `\n\nLIFESTYLE REQUIREMENTS:
- Realistic home environment
- Natural lighting conditions
- Contextual scene elements
- Lived-in atmosphere
- Product integrated naturally`;
      break;
      
    case 'hero':
      prompt += `\n\nHERO BANNER REQUIREMENTS:
- Dramatic composition
- Professional lighting
- Visual impact suitable for website headers
- Space for text overlay consideration
- High-end commercial appeal`;
      break;
      
    case 'story':
      prompt += `\n\nSTORY FORMAT REQUIREMENTS:
- Vertical mobile-optimized composition
- Eye-catching visual appeal
- Product prominently displayed
- Social media friendly
- Thumb-stopping quality`;
      break;
      
    case 'instagram':
      prompt += `\n\nINSTAGRAM POST REQUIREMENTS:
- Square composition optimized for feeds
- Social media engagement appeal
- Balanced lighting for mobile screens
- Professional yet approachable aesthetic`;
      break;
  }

  // Add quality constraints
  prompt += `\n\nQUALITY REQUIREMENTS:
- Photorealistic rendering
- High detail and clarity
- Professional commercial photography quality
- Accurate product representation
- No text, labels, or watermarks in image`;

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
  const contextDescriptions = {
    packshot: 'professional product packshot',
    instagram: 'Instagram-ready product post',
    story: 'Instagram/Facebook story format product image',
    hero: 'website hero banner product image',
    lifestyle: 'lifestyle product image in realistic home setting',
    detail: 'detailed close-up product shot'
  };
  
  return `Create a high-quality ${contextDescriptions[contextPreset]} using the uploaded reference image as the foundation. The result should be a commercial-grade product visualization that maintains exact product fidelity while enhancing the presentation.`;
}

function buildProductDescription(profile: ProductProfile): string {
  const features = getFieldValue(profile.features).length > 0
    ? `Features: ${getFieldValue(profile.features).join(', ')}.` 
    : '';
  
  // Use color override if available, otherwise use detected color
  const effectiveColor = profile.colorOverride || getFieldValue(profile.detectedColor);
  
  const wallMountedNote = getFieldValue(profile.wallMounted)
    ? 'IMPORTANT: This is a wall-mounted product - keep it attached to the wall; no floor contact.'
    : '';

  const dimensionsNote = profile.realDimensions && 
    (profile.realDimensions.width || profile.realDimensions.height || profile.realDimensions.depth)
    ? `Real dimensions: ${profile.realDimensions.width}cm W × ${profile.realDimensions.height}cm H × ${profile.realDimensions.depth}cm D.`
    : '';

  const additionalNotes = profile.notes ? `Additional context: ${profile.notes}` : '';

  return `PRODUCT SPECIFICATIONS:
- Type: ${getFieldValue(profile.type)}
- Materials: ${getFieldValue(profile.materials)}
- Color: ${effectiveColor}
- Style: ${getFieldValue(profile.style)}
${features}
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
  const constraints = [
    'PRODUCT FIDELITY: Maintain exact product shape, proportions, materials, and color from reference.',
    'PHOTOREALISTIC: Achieve commercial photography quality suitable for e-commerce.',
  ];

  if (settings.strictMode) {
    constraints.push('NO TEXT: Absolutely no text, labels, numbers, watermarks, logos, or UI elements.');
    constraints.push('NO EXTRA OBJECTS: Do not add furniture or products not specifically listed in props.');
    
    if (getFieldValue(profile.wallMounted)) {
      constraints.push('WALL-MOUNTED: Product must remain attached to wall - never place on floor or furniture.');
    }
    
    constraints.push('COMMERCIAL QUALITY: Clean, professional look suitable for premium e-commerce.');
  }

  // Add color override constraint if applicable
  if (profile.colorOverride && profile.colorOverride !== getFieldValue(profile.detectedColor)) {
    constraints.push(`COLOR OVERRIDE: Use color ${profile.colorOverride} instead of detected color - preserve exact geometry but change color only.`);
  }

  return `CONSTRAINTS (STRICT ADHERENCE REQUIRED):
${constraints.map(c => `- ${c}`).join('\n')}`;
}

function getContextSpecificInstructions(contextPreset: ContextPreset, settings: UiSettings): string {
  switch (contextPreset) {
    case 'hero':
      return `HERO BANNER REQUIREMENTS:
- Ensure visual balance and negative space for text overlay placement
- Leave breathing room ${settings.reservedTextZone ? `on the ${settings.reservedTextZone} side` : 'opposite the product position'}
- High-impact composition that works as a website header
- Do not render any text in the image - text will be added later by the website`;
      
    case 'story':
      return `STORY FORMAT REQUIREMENTS:
- Vertical composition optimized for mobile viewing
- Product should be well-centered and prominent
- Consider how this will appear in a mobile story format
- Clean, thumb-stopping visual appeal`;
      
    case 'packshot':
      return `PACKSHOT REQUIREMENTS:
- Clean, neutral presentation focusing entirely on the product
- Minimal distractions - product is the hero
- Suitable for catalog and product listing pages
- Professional studio-quality lighting and composition`;
      
    case 'instagram':
      return `INSTAGRAM POST REQUIREMENTS:
- Engaging, social-media ready composition
- Consider how this will appear in Instagram feeds
- Balanced lighting that looks great on mobile screens
- Professional yet approachable aesthetic`;
      
    case 'lifestyle':
      return `LIFESTYLE REQUIREMENTS:
- Product shown in realistic home environment
- Natural lighting and contextual elements
- Lived-in atmosphere with complementary props
- Product integrated naturally into the scene`;
      
    case 'detail':
      return `DETAIL SHOT REQUIREMENTS:
- Close-up focus on product features and craftsmanship
- High detail and clarity of materials and construction
- Suitable for showcasing quality and workmanship
- Minimal background distractions`;
      
    default:
      return '';
  }
}

function getNegativePrompt(): string {
  return `AVOID AT ALL COSTS: text overlays, captions, logos, stickers, price tags, annotations, extra furniture not listed in props, floor contact for wall-mounted items, unrealistic reflections, heavy noise, over-saturation, cartoonish appearance, duplicate products, cluttered composition.`;
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
  const type = getFieldValue(profile.type);
  const materials = truncateText(getFieldValue(profile.materials), 80);
  const color = profile.colorOverride || getFieldValue(profile.detectedColor);
  const style = truncateText(getFieldValue(profile.style), 50);
  
  // Limit features to most important ones
  const features = getFieldValue(profile.features);
  const topFeatures = features.slice(0, 3).map(f => truncateText(f, 30));
  
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