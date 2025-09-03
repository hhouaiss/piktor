/**
 * ENHANCED CONSTRAINT ENFORCEMENT SYSTEM FOR PRODUCTION QUALITY
 * 
 * This system implements multi-layered constraint enforcement specifically designed
 * to eliminate the critical quality issues identified in production:
 * 
 * 1. NO HUMANS - Zero tolerance for any human elements
 * 2. NO IRRELEVANT OBJECTS - Systematic prevention of unrelated items
 * 3. NO ARTIFACTS - Technical constraints for photorealistic output
 * 4. STRICT ADHERENCE - Enforced compliance with user specifications
 */

import { ContextPreset, UiSettings, ProductSpecs } from '@/components/image-generator/types';
import { ProductIntelligence, PlacementType, MaterialType } from '@/lib/gemini-prompt-engine';

// Constraint Enforcement Levels
export enum ConstraintLevel {
  ABSOLUTE = 'ABSOLUTE',        // Zero tolerance - generation fails if violated
  CRITICAL = 'CRITICAL',        // Multiple enforcement layers
  HIGH = 'HIGH',               // Strong emphasis with validation
  MEDIUM = 'MEDIUM'            // Standard enforcement
}

// Production Quality Issues - Systematic Prevention
export interface QualityIssue {
  category: 'humans' | 'objects' | 'artifacts' | 'placement' | 'adherence';
  severity: ConstraintLevel;
  description: string;
  prevention: string[];
  validation: string[];
}

/**
 * COMPREHENSIVE QUALITY ISSUE PREVENTION SYSTEM
 */
export class EnhancedConstraintSystem {
  
  /**
   * Build multi-layered constraint enforcement block
   */
  static buildEnhancedConstraints(
    specs: ProductSpecs,
    contextPreset: ContextPreset,
    settings: UiSettings,
    productIntel: ProductIntelligence
  ): string {
    
    const constraints = [
      this.buildHumanElementPrevention(),
      this.buildIrrelevantObjectPrevention(contextPreset, settings),
      this.buildArtifactPrevention(),
      this.buildPlacementEnforcement(productIntel),
      this.buildAdherenceEnforcement(specs, settings),
      this.buildContextSpecificConstraints(contextPreset, settings),
      this.buildValidationRequirements()
    ];

    return constraints.join('\n\n');
  }

  /**
   * CRITICAL: Human Element Prevention (Issue #1)
   * Zero tolerance for any human presence or representation
   */
  private static buildHumanElementPrevention(): string {
    return `🚫👥 ABSOLUTE HUMAN ELEMENT PROHIBITION - ZERO TOLERANCE

⛔ PRIMARY HUMAN PROHIBITIONS:
• NO humans, people, persons of any age, gender, or ethnicity
• NO human faces, heads, or facial features
• NO human hands, arms, legs, feet, or any body parts
• NO human torso, chest, back, or body silhouettes
• NO human shadows, outlines, or partial human forms

⛔ EXTENDED HUMAN ELEMENT PROHIBITIONS:
• NO human clothing, garments, or personal accessories
• NO shoes, boots, socks, or footwear of any kind
• NO jewelry, watches, glasses, or personal items
• NO handbags, purses, backpacks, or personal bags
• NO human hair, wigs, or hair accessories

⛔ HUMAN ACTIVITY PROHIBITIONS:
• NO human positioning or staging suggestions
• NO items arranged as if humans were present
• NO human-scale reference objects (except architectural elements)
• NO lifestyle staging that implies recent human use
• NO personal workspace arrangements suggesting human activity

⛔ HUMAN REPRESENTATION PROHIBITIONS:
• NO mannequins, dolls, or humanoid figures
• NO human artwork, portraits, or representations
• NO human-themed decorative elements
• NO anthropomorphic designs or human-like features

VALIDATION REQUIREMENT: The final image must be completely devoid of any human presence, suggestion, or representation. Any hint of human elements constitutes immediate generation failure.`;
  }

  /**
   * CRITICAL: Irrelevant Object Prevention (Issue #2) 
   * Systematic elimination of unrelated objects and props
   */
  private static buildIrrelevantObjectPrevention(contextPreset: ContextPreset, settings: UiSettings): string {
    const approvedProps = settings.props && settings.props.length > 0 ? 
      settings.props.join(', ') : 'NONE';

    return `🚫🗑️ IRRELEVANT OBJECT ELIMINATION - SYSTEMATIC PREVENTION

⛔ DINING & KITCHEN ITEM PROHIBITIONS:
• NO cups, mugs, glasses, or drinking vessels
• NO plates, bowls, dishes, or serving ware
• NO utensils, cutlery, or dining implements
• NO food items, snacks, or consumables
• NO napkins, placemats, or dining accessories
• NO coffee pots, tea sets, or beverage equipment

⛔ PERSONAL ITEM PROHIBITIONS:
• NO books, magazines, newspapers, or reading materials
• NO phones, tablets, laptops, or electronic devices
• NO stationery, pens, papers, or office supplies
• NO remote controls, chargers, or tech accessories
• NO personal care items or toiletries
• NO games, toys, or recreational objects

⛔ DECORATIVE OBJECT PROHIBITIONS:
• NO vases, pottery, or decorative containers (unless approved)
• NO candles, candle holders, or flame objects
• NO picture frames or artwork (unless environmental)
• NO sculptures, figurines, or decorative objects
• NO clocks, mirrors, or wall hangings (unless environmental)
• NO seasonal decorations or holiday items

⛔ TEXTILE & SOFT FURNISHING PROHIBITIONS:
• NO throw pillows, cushions, or decorative pillows
• NO blankets, throws, or bed linens
• NO rugs, carpets, or floor coverings (unless environmental)
• NO curtains, drapes, or window treatments (unless environmental)
• NO tablecloths, runners, or surface textiles

⛔ PLANT & ORGANIC PROHIBITIONS:
• NO plants, flowers, or greenery (unless specifically approved)
• NO vines, branches, or organic decorative elements
• NO potted plants, planters, or gardening items
• NO floral arrangements or botanical decorations

⛔ LIGHTING FIXTURE PROHIBITIONS:
• NO table lamps, floor lamps, or portable lighting (unless approved)
• NO pendant lights, chandeliers, or overhead fixtures (unless environmental)
• NO candles, oil lamps, or flame-based lighting
• NO decorative lighting or string lights

APPROVED PROPS FOR THIS GENERATION: ${approvedProps}
CONSTRAINT: Only items explicitly listed as approved props may appear in the scene. All other objects are strictly prohibited.

VALIDATION REQUIREMENT: Every object in the scene must serve the furniture presentation purpose. No extraneous, decorative, or unrelated items permitted.`;
  }

  /**
   * CRITICAL: Artifact Prevention (Issue #3)
   * Technical constraints for photorealistic, professional output
   */
  private static buildArtifactPrevention(): string {
    return `🚫🎨 PHOTOGRAPHIC ARTIFACT PREVENTION - TECHNICAL QUALITY CONTROL

⛔ RENDERING ARTIFACT PROHIBITIONS:
• NO cartoon-like, animated, or non-photorealistic rendering
• NO sketch-like, drawing-like, or artistic interpretation
• NO painted, watercolor, or artistic effects
• NO 3D render appearance or computer-generated look
• NO unrealistic lighting or impossible shadows
• NO floating objects or physics violations

⛔ PHOTOGRAPHIC TECHNICAL PROHIBITIONS:
• NO motion blur, camera shake, or focus issues
• NO lens distortion, chromatic aberration, or optical flaws
• NO overexposure, underexposure, or blown highlights
• NO digital noise, grain, or compression artifacts
• NO color banding, posterization, or color processing errors
• NO vignetting unless intentional and professional

⛔ SURFACE & MATERIAL ARTIFACT PROHIBITIONS:
• NO plastic-looking wood or artificial material appearance
• NO unrealistic reflections or mirror effects
• NO harsh glare, hotspots, or reflection artifacts
• NO surface texture errors or material inconsistencies
• NO scale inconsistencies or proportion distortions
• NO impossible material combinations or behaviors

⛔ COMPOSITION ARTIFACT PROHIBITIONS:
• NO multiple instances or duplications of the same product
• NO repeated patterns or cloned elements
• NO impossible perspectives or viewing angles
• NO spatial inconsistencies or depth errors
• NO lighting direction conflicts or multiple light sources issues
• NO composition elements that defy physical laws

⛔ DIGITAL PROCESSING PROHIBITIONS:
• NO social media filters or Instagram-style effects
• NO HDR over-processing or unnatural color enhancement
• NO artificial sharpening halos or edge artifacts
• NO color grading that makes materials look unrealistic
• NO digital makeup or beauty filter effects
• NO artificial bokeh or depth effect errors

VALIDATION REQUIREMENT: The final image must appear as if captured with professional photography equipment by an experienced commercial photographer. Any digital artifacts or non-photorealistic elements constitute generation failure.`;
  }

  /**
   * CRITICAL: Placement Enforcement (Issue #4)
   * Intelligent furniture placement with zero-tolerance validation
   */
  private static buildPlacementEnforcement(productIntel: ProductIntelligence): string {
    const placementType = productIntel.placementType;
    
    let placementConstraints = `🚫🏗️ PLACEMENT ENFORCEMENT - INTELLIGENT POSITIONING CONTROL

DETECTED FURNITURE TYPE: ${productIntel.category.toUpperCase()}
REQUIRED PLACEMENT: ${placementType.toUpperCase().replace('_', ' ')}

`;

    switch (placementType) {
      case 'wall_mounted':
        placementConstraints += `⛔ WALL-MOUNTED FURNITURE ABSOLUTE PROHIBITIONS:
• ABSOLUTELY NO floor contact - not even partial or implied contact
• NO legs, supports, feet, or any structural elements touching ground
• NO desk legs extending to floor for wall-mounted desks
• NO table legs for wall-mounted tables or surfaces
• NO pedestals, stands, or floor-based support systems
• NO free-standing installation when wall mounting is required
• NO floating appearance without visible mounting system

✅ WALL-MOUNTED REQUIREMENTS:
• MUST show wall attachment point with appropriate hardware
• MUST display realistic mounting brackets, cleats, or cantilever system
• MUST show proper wall surface interaction and attachment
• MUST maintain clearance beneath product (minimum 5cm)
• MUST appear securely mounted with weight properly supported
• MUST show wall material appropriate for mounting system

CRITICAL VALIDATION: Wall-mounted furniture MUST appear to be professionally installed on a wall surface with NO connection to the floor. Any floor contact invalidates the generation.`;
        break;

      case 'floor_standing':
        placementConstraints += `⛔ FLOOR-STANDING FURNITURE PROHIBITIONS:
• NO floating or suspended appearance unless designed for that
• NO incomplete floor contact or unstable positioning  
• NO wall mounting when floor-standing is intended
• NO tabletop placement for large floor furniture

✅ FLOOR-STANDING REQUIREMENTS:
• ALL support points MUST make proper floor contact
• MUST show stable, level positioning appropriate for furniture weight
• MUST maintain realistic clearances from walls (typically 5-15cm)
• MUST demonstrate proper weight distribution and stability
• MUST show appropriate floor material interaction

CRITICAL VALIDATION: Floor-standing furniture MUST show complete structural support through floor contact. Incomplete support or unstable appearance invalidates the generation.`;
        break;

      case 'tabletop':
        placementConstraints += `⛔ TABLETOP FURNITURE PROHIBITIONS:
• NO floor placement for tabletop-designed furniture
• NO oversized table surfaces inappropriate for product
• NO unstable or precarious surface positioning
• NO surfaces inappropriate for furniture weight or size

✅ TABLETOP REQUIREMENTS:
• MUST be positioned on appropriately sized supporting surface
• MUST show stable placement with proper surface contact
• MUST demonstrate realistic size relationship to supporting surface
• MUST show appropriate surface material and finish

CRITICAL VALIDATION: Tabletop furniture MUST be placed on an appropriate supporting surface with stable, realistic positioning.`;
        break;

      case 'ceiling_mounted':
        placementConstraints += `⛔ CEILING-MOUNTED FURNITURE PROHIBITIONS:
• NO floor or wall contact for ceiling-mounted items
• NO tabletop or surface placement
• NO invisible suspension without mounting hardware

✅ CEILING-MOUNTED REQUIREMENTS:  
• MUST show ceiling attachment point and hardware
• MUST display appropriate suspension system
• MUST maintain proper hanging height and clearances
• MUST show secure attachment appropriate for product weight

CRITICAL VALIDATION: Ceiling-mounted furniture MUST appear properly suspended from ceiling with appropriate hardware and no other surface contact.`;
        break;
    }

    return placementConstraints;
  }

  /**
   * CRITICAL: Adherence Enforcement (Issue #5)
   * Strict compliance with user specifications without creative liberties
   */
  private static buildAdherenceEnforcement(specs: ProductSpecs, settings: UiSettings): string {
    return `🚫🎯 SPECIFICATION ADHERENCE ENFORCEMENT - ZERO CREATIVE LIBERTIES

⛔ DESIGN MODIFICATION PROHIBITIONS:
• NO changes to product design, style, or aesthetic
• NO alternative color schemes unless specifically requested
• NO material substitutions or finish modifications
• NO proportional changes or size modifications
• NO hardware changes or detail modifications
• NO stylistic interpretation or artistic license

⛔ SPECIFICATION VIOLATION PROHIBITIONS:
• NO deviation from stated materials: "${specs.materials}"
• NO ignoring of product type requirements: "${specs.productType}"
• NO changes to specified dimensions or proportions
• NO modifications to additional specifications: "${specs.additionalSpecs || 'None specified'}"
• NO brand interpretation beyond exact product identity
• NO feature additions or removals not specified

⛔ SETTING OVERRIDE PROHIBITIONS:
• Background MUST be: "${settings.backgroundStyle}"
• Product position MUST be: "${settings.productPosition}"
• Lighting MUST be: "${settings.lighting.replace('_', ' ')}"
• Props limited to: ${settings.props.length > 0 ? settings.props.join(', ') : 'NONE'}
${settings.reservedTextZone ? `• Text zone MUST be reserved: "${settings.reservedTextZone}"` : ''}
${settings.strictMode ? '• STRICT MODE: Zero tolerance for any deviation' : ''}

⛔ CONTEXTUAL DEVIATION PROHIBITIONS:
• NO context changes from specified preset requirements
• NO style mixing between different context types
• NO format violations for specified context preset
• NO composition changes that conflict with context requirements

VALIDATION REQUIREMENT: The generated image must exactly match ALL user specifications without any creative interpretation, modification, or enhancement beyond explicit instructions. Any deviation from specifications constitutes generation failure.`;
  }

  /**
   * Context-specific constraint additions
   */
  private static buildContextSpecificConstraints(contextPreset: ContextPreset, settings: UiSettings): string {
    let contextConstraints = `🚫📋 CONTEXT-SPECIFIC CONSTRAINT ENFORCEMENT: ${contextPreset.toUpperCase()}

`;

    switch (contextPreset) {
      case 'packshot':
        contextConstraints += `⛔ PACKSHOT-SPECIFIC PROHIBITIONS:
• NO environmental elements, rooms, or architectural context
• NO lifestyle props or contextual staging elements
• NO background textures, patterns, or visual interest
• NO environmental lighting (studio lighting only)
• NO compositional elements beyond product and background
• NO shadows that create environmental suggestions

✅ PACKSHOT ABSOLUTE REQUIREMENTS:
• Pure white seamless studio background only
• Product isolation with no competing elements
• Professional three-point studio lighting
• Commercial catalog presentation standards`;
        break;

      case 'lifestyle':
        contextConstraints += `⛔ LIFESTYLE-SPECIFIC PROHIBITIONS:
• NO unrealistic or impossibly perfect staging
• NO over-styled or magazine-perfect arrangements
• NO competing furniture that overshadows main product
• NO cluttered or chaotic environmental elements
• NO inappropriate scale between product and environment
• NO lifestyle elements that distract from product

✅ LIFESTYLE ABSOLUTE REQUIREMENTS:
• Realistic, achievable interior environment
• Natural product integration without artificial staging
• Appropriate architectural context for furniture type
• Contextual elements enhance rather than compete`;
        break;

      case 'social_media_square':
        contextConstraints += `⛔ SOCIAL MEDIA SQUARE PROHIBITIONS:
• NO aspect ratio deviation from perfect 1:1 square
• NO composition that doesn't work in mobile feeds
• NO overly complex backgrounds unsuitable for social media
• NO elements that don't translate to small screen viewing

✅ SOCIAL MEDIA SQUARE REQUIREMENTS:
• Perfect 1:1 aspect ratio composition
• Mobile-optimized brightness and contrast
• Social media engagement appropriate presentation`;
        break;

      case 'social_media_story':
        contextConstraints += `⛔ SOCIAL MEDIA STORY PROHIBITIONS:
• NO aspect ratio deviation from 9:16 vertical format
• NO product placement that interferes with story interface
• NO horizontal composition elements
• NO text overlay zone violations

✅ SOCIAL MEDIA STORY REQUIREMENTS:
• Perfect 9:16 vertical aspect ratio
• Product in upper two-thirds of frame
• Bottom area reserved for story interface and text`;
        break;

      case 'hero':
        contextConstraints += `⛔ HERO BANNER PROHIBITIONS:
• NO text or graphics embedded in the image
• NO elements in reserved text overlay zones
• NO composition unsuitable for website header usage
• NO busy backgrounds that compete with text readability
${settings.reservedTextZone ? `• NO elements in ${settings.reservedTextZone} text zone` : ''}

✅ HERO BANNER REQUIREMENTS:
• Wide banner format suitable for website headers
• Strategic negative space for text overlay
• Premium brand presentation quality
• Dramatic lighting with marketing impact`;
        break;
    }

    return contextConstraints;
  }

  /**
   * Build comprehensive validation requirements
   */
  private static buildValidationRequirements(): string {
    return `🔍 COMPREHENSIVE VALIDATION REQUIREMENTS

⚡ IMMEDIATE DISQUALIFICATION CRITERIA:
Any presence of the following immediately disqualifies the generation:
• Human elements of any kind (body parts, clothing, accessories, shadows)
• Irrelevant objects not explicitly approved (cups, books, electronics, etc.)
• Artificial rendering artifacts (cartoon-like, non-photorealistic)
• Placement violations for detected furniture type
• Specification deviations or creative liberties
• Text, labels, or written content of any kind
• Multiple product instances or duplications

✅ PRODUCTION QUALITY VALIDATION CHECKLIST:
Before accepting any generation, verify:
• Professional commercial photography quality achieved
• All constraint categories fully satisfied
• Product appears exactly as specified without modifications
• Placement logic correctly applied for furniture type
• Material authenticity and surface realism maintained
• Context preset requirements fully met
• Background and lighting appropriate for specified context
• Composition suitable for intended commercial use

🎯 SUCCESS CRITERIA:
The generated image must be immediately ready for:
• E-commerce product catalogs and listings
• Professional marketing materials and campaigns
• Website headers and digital marketing applications
• Print advertising and promotional materials
• Brand representation across all commercial channels

FINAL VALIDATION: Only images that pass ALL validation requirements and meet enterprise production standards should be accepted. Any quality issues require immediate regeneration with enhanced constraint emphasis.`;
  }

  /**
   * Get constraint statistics for monitoring and optimization
   */
  static getConstraintStats(
    specs: ProductSpecs,
    contextPreset: ContextPreset,
    settings: UiSettings,
    productIntel: ProductIntelligence
  ): {
    totalConstraints: number;
    absoluteConstraints: number;
    criticalConstraints: number;
    placementSpecific: number;
    contextSpecific: number;
    materialSpecific: number;
  } {
    const constraints = this.buildEnhancedConstraints(specs, contextPreset, settings, productIntel);
    
    return {
      totalConstraints: (constraints.match(/⛔/g) || []).length,
      absoluteConstraints: (constraints.match(/ABSOLUTE/g) || []).length,
      criticalConstraints: (constraints.match(/CRITICAL/g) || []).length,
      placementSpecific: (constraints.match(/PLACEMENT/g) || []).length,
      contextSpecific: (constraints.match(/CONTEXT/g) || []).length,
      materialSpecific: (constraints.match(/MATERIAL/g) || []).length,
    };
  }
}

/**
 * PRODUCTION CONSTRAINT ENFORCEMENT INTEGRATION
 */

/**
 * Build production-ready constraints for immediate use
 */
export function buildProductionConstraints(
  specs: ProductSpecs,
  contextPreset: ContextPreset,
  settings: UiSettings,
  productIntel: ProductIntelligence
): string {
  return EnhancedConstraintSystem.buildEnhancedConstraints(
    specs,
    contextPreset,
    settings,
    productIntel
  );
}

/**
 * Validate constraint coverage for quality assurance
 */
export function validateConstraintCoverage(
  constraints: string
): {
  isComprehensive: boolean;
  missingCategories: string[];
  coverageScore: number;
} {
  const requiredCategories = [
    'human element prohibition',
    'irrelevant object prevention', 
    'artifact prevention',
    'placement enforcement',
    'specification adherence'
  ];

  const missingCategories: string[] = [];
  let coverageScore = 0;

  const constraintsLower = constraints.toLowerCase();

  if (constraintsLower.includes('human') && constraintsLower.includes('prohibition')) {
    coverageScore += 20;
  } else {
    missingCategories.push('human element prohibition');
  }

  if (constraintsLower.includes('irrelevant') && constraintsLower.includes('object')) {
    coverageScore += 20;
  } else {
    missingCategories.push('irrelevant object prevention');
  }

  if (constraintsLower.includes('artifact') && constraintsLower.includes('prevention')) {
    coverageScore += 20;
  } else {
    missingCategories.push('artifact prevention');
  }

  if (constraintsLower.includes('placement') && constraintsLower.includes('enforcement')) {
    coverageScore += 20;
  } else {
    missingCategories.push('placement enforcement');
  }

  if (constraintsLower.includes('specification') && constraintsLower.includes('adherence')) {
    coverageScore += 20;
  } else {
    missingCategories.push('specification adherence');
  }

  return {
    isComprehensive: coverageScore >= 80,
    missingCategories,
    coverageScore
  };
}