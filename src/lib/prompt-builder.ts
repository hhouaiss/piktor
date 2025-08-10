import { ProductProfile, UiSettings, ContextPreset, getFieldValue } from '@/components/image-generator/types';

export function buildPrompt(
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
    hero: 'website hero banner product image'
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
  };

  return sizeMapping[contextPreset];
}