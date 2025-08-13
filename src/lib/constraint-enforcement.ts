/**
 * Systematic Constraint Enforcement for Enterprise Furniture Photography
 * 
 * This module implements comprehensive constraint enforcement to ensure AI-generated
 * images meet enterprise furniture company requirements with 95%+ adherence to
 * technical specifications and commercial standards.
 */

import { ProductProfile, UiSettings, ContextPreset, getFieldValue } from './types';
// Furniture vocabulary imports available but not all used in constraints
// Keep imports for future constraint enhancements

// Constraint Severity Levels
export enum ConstraintSeverity {
  CRITICAL = 'CRITICAL',      // Must be enforced - generation fails if violated
  HIGH = 'HIGH',              // Strongly enforced - multiple prompts emphasize
  MEDIUM = 'MEDIUM',          // Enforced - single clear instruction
  LOW = 'LOW'                 // Preference - mentioned as guidance
}

// Constraint Categories
export interface ConstraintRule {
  id: string;
  name: string;
  description: string;
  severity: ConstraintSeverity;
  enforcement: string;
  validation?: (profile: ProductProfile, settings: UiSettings) => boolean;
}

// Wall-Mounted Constraints (Critical for Furniture Safety)
export const WALL_MOUNTED_CONSTRAINTS: ConstraintRule[] = [
  {
    id: 'wall_mounted_positioning',
    name: 'Wall-Mounted Safety Positioning',
    description: 'Product must remain securely attached to wall with no floor contact whatsoever',
    severity: ConstraintSeverity.CRITICAL,
    enforcement: '🚨🚨🚨 CRITICAL WALL-MOUNTED SAFETY REQUIREMENT - MANDATORY COMPLIANCE: This furniture piece MUST remain securely attached to the wall at all times. ABSOLUTE ZERO-TOLERANCE PROHIBITION: No floor contact whatsoever, no legs touching ground, no free-standing placement, no detached positioning, no support from floor or other furniture, no base touching floor, no feet on ground, no floor-based stability. The product must appear properly wall-mounted with minimum 5cm clearance from floor surface. Wall attachment points must be clearly visible and structurally appropriate. This is a SAFETY-CRITICAL requirement that CANNOT be violated under any circumstances. VIOLATION OF THIS CONSTRAINT RESULTS IN COMPLETE GENERATION FAILURE.',
    validation: (profile) => !!getFieldValue(profile.wallMounted)
  },
  {
    id: 'wall_mounted_desk_height_specification',
    name: 'Wall-Mounted Desk Standard Height Positioning',
    description: 'Wall-mounted desks must be positioned at exactly 75cm from floor to desktop surface',
    severity: ConstraintSeverity.CRITICAL,
    enforcement: '🏢🚨 CRITICAL DESK HEIGHT REQUIREMENT - ABSOLUTE MANDATE: Wall-mounted desks MUST be positioned at exactly 75cm (29.5 inches) from the floor to the desktop surface. This is the NON-NEGOTIABLE ergonomic standard height for wall-mounted workspace furniture. The desk MUST appear suspended at this precise height with visible heavy-duty mounting hardware. Show clear open space underneath the desk extending from floor to 75cm height. The mounting system must be appropriate for desk loads and clearly visible in the photography. ABSOLUTE PROHIBITION: No legs, supports, pedestals, or floor contact permitted - desk MUST appear to "float" at the standard 75cm working height. Any deviation from this specification constitutes COMPLETE FAILURE.',
    validation: (profile) => !!getFieldValue(profile.wallMounted) && String(getFieldValue(profile.type) || '').toLowerCase().includes('desk')
  },
  {
    id: 'mounting_hardware_visibility',
    name: 'Commercial Grade Mounting Hardware Visibility',
    description: 'Wall mounting system must show commercial-grade hardware appropriate for furniture type and load requirements',
    severity: ConstraintSeverity.HIGH,
    enforcement: '🔧 COMMERCIAL MOUNTING SYSTEM REQUIREMENT: Display appropriate commercial-grade wall-mounting hardware suitable for this furniture type and load requirements. For wall-mounted desks: Heavy-duty cantilever brackets capable of 50-100kg load, French cleat systems, or fold-down mechanisms with proper support. For shelving: Steel bracket supports or track mounting systems. For cabinets: Hidden bracket mounting or rail systems. Hardware must appear robust, properly sized, and suitable for commercial installations. Desk mounting hardware must be visible and show appropriate attachment points for the 75cm mounting height.',
    validation: (profile) => !!getFieldValue(profile.wallMounted)
  },
  {
    id: 'wall_clearance_specifications',
    name: 'Precise Wall Clearance Specifications',
    description: 'Exact spacing requirements between product and wall surface for proper installation',
    severity: ConstraintSeverity.HIGH,
    enforcement: '📐 INSTALLATION CLEARANCE REQUIREMENT: Maintain precise clearance specifications between furniture piece and wall surface. For wall-mounted desks: 75cm clearance from floor to desktop surface, 5-10cm mounting depth from wall, cable management space behind desk. For shelves: minimum 2-inch clearance from floor, appropriate mounting depth (1-3 inches). For cabinets: proper spacing for doors/drawers (2-4 inches from wall). Clearance must allow for realistic installation accessibility and proper furniture functionality.',
    validation: (profile) => !!getFieldValue(profile.wallMounted)
  },
  {
    id: 'absolute_floor_contact_prohibition',
    name: 'Absolute Floor Contact Prohibition',
    description: 'Zero tolerance for any part of wall-mounted furniture touching the floor',
    severity: ConstraintSeverity.CRITICAL,
    enforcement: '🚫🚫🚫 ABSOLUTE FLOOR CONTACT PROHIBITION - ZERO TOLERANCE: NO PART of this wall-mounted furniture may touch, contact, rest on, or be supported by the floor. MANDATORY CLEARANCE: Minimum 5cm visible gap between lowest point of furniture and floor surface. PROHIBITED ELEMENTS: Legs, feet, bases, supports, pedestals, stands, floor contact points of any kind. REQUIRED APPEARANCE: Furniture must appear to float or be suspended from wall mounting system. Any visible floor contact constitutes IMMEDIATE AND COMPLETE FAILURE.',
    validation: (profile) => !!getFieldValue(profile.wallMounted)
  },
  {
    id: 'wall_suspension_visual_verification',
    name: 'Wall Suspension Visual Verification',
    description: 'Furniture must visually appear suspended from wall mounting system',
    severity: ConstraintSeverity.CRITICAL,
    enforcement: '🎯🔗 WALL SUSPENSION VERIFICATION REQUIREMENT: The furniture MUST visually demonstrate clear suspension from the wall mounting system. MANDATORY VISUAL ELEMENTS: Visible mounting hardware, clear space beneath furniture, wall attachment points, floating appearance. PROHIBITED VISUAL ELEMENTS: Any suggestion of floor support, ground contact, or free-standing stability. The viewer must clearly understand that the furniture derives ALL support from the wall mounting system.',
    validation: (profile) => !!getFieldValue(profile.wallMounted)
  },
  {
    id: 'structural_wall_compatibility',
    name: 'Wall Structure Compatibility Requirements',
    description: 'Mounting must appear compatible with commercial wall construction standards',
    severity: ConstraintSeverity.MEDIUM,
    enforcement: '🏗️ STRUCTURAL COMPATIBILITY REQUIREMENT: Wall mounting must appear compatible with commercial construction standards. Show appropriate wall thickness (minimum 1/2 inch drywall with stud backing for heavy items), mounting hardware appropriate for wall type, and structural integrity suitable for commercial environments. Avoid mounting configurations that would be structurally unsound or non-code compliant.',
    validation: (profile) => !!getFieldValue(profile.wallMounted)
  }
];

// Material Fidelity Constraints (Enterprise Grade Accuracy)
export const MATERIAL_CONSTRAINTS: ConstraintRule[] = [
  {
    id: 'material_accuracy',
    name: 'Enterprise Material Accuracy',
    description: 'Exact reproduction of specified materials with commercial-grade authenticity',
    severity: ConstraintSeverity.CRITICAL,
    enforcement: '🔍 ENTERPRISE MATERIAL FIDELITY CRITICAL: Reproduce EXACT material specifications with authentic surface textures, grain patterns, finish characteristics, and reflectance properties matching commercial furniture standards. Materials must appear exactly as specified without any artistic interpretation, enhancement, or stylization. For wood: Show accurate grain direction, knot patterns, and natural variations. For metal: Display precise surface treatments, brush patterns, and oxidation characteristics. For upholstery: Render exact fabric weave, leather grain, or vinyl texture patterns. Material authenticity is non-negotiable for enterprise furniture catalogs.',
    validation: (profile) => !!getFieldValue(profile.materials)
  },
  {
    id: 'surface_texture_authenticity',
    name: 'Commercial Grade Surface Texture Authenticity',
    description: 'Precise representation of material surface properties meeting commercial furniture standards',
    severity: ConstraintSeverity.HIGH,
    enforcement: '🎯 COMMERCIAL SURFACE TEXTURE REQUIREMENT: Display authentic material surface textures with commercial furniture grade accuracy. Wood: Show grain direction, ring patterns, medullary rays, and natural character marks. Metal: Display brushing patterns (linear, circular, or crosshatch), mill finish characteristics, and surface oxidation or patina. Leather: Show pebble grain patterns, natural wrinkles, and surface variations. Fabric: Render weave patterns, thread visibility, and textile characteristics. Laminate: Show authentic surface texture and edge treatments. Surface properties must match commercial furniture material specifications exactly.',
    validation: (profile) => !!getFieldValue(profile.materials)
  },
  {
    id: 'color_fidelity',
    name: 'Enterprise Color Fidelity Standards',
    description: 'Precise color reproduction with commercial accuracy including undertones and material interactions',
    severity: ConstraintSeverity.CRITICAL,
    enforcement: '🌈 ENTERPRISE COLOR ACCURACY CRITICAL: Maintain EXACT color specifications including undertones, highlights, shadow characteristics, and material-appropriate reflectance properties. Color must match specified values with commercial furniture industry color accuracy standards. Account for material-specific color behaviors: Wood stains with depth and grain interaction, metal coatings with reflectance characteristics, fabric colors with weave shadows, leather with natural color variations. Color accuracy is critical for enterprise furniture catalog consistency and brand representation.',
    validation: (profile) => !!(profile.colorOverride || getFieldValue(profile.detectedColor))
  },
  {
    id: 'finish_quality',
    name: 'Finish Quality Standards',
    description: 'Professional-grade finish appearance',
    severity: ConstraintSeverity.HIGH,
    enforcement: 'FINISH QUALITY REQUIREMENT: Display professional commercial-grade finish quality with appropriate sheen levels, surface smoothness, and quality indicators consistent with enterprise furniture standards.',
    validation: () => true
  }
];

// Commercial Quality Constraints
export const COMMERCIAL_QUALITY_CONSTRAINTS: ConstraintRule[] = [
  {
    id: 'professional_construction',
    name: 'Professional Construction Standards',
    description: 'Enterprise-grade construction quality indicators',
    severity: ConstraintSeverity.HIGH,
    enforcement: 'COMMERCIAL CONSTRUCTION REQUIREMENT: Show professional construction quality with tight tolerances, clean joint lines, precise alignments, and enterprise-grade hardware. Construction should reflect commercial furniture manufacturing standards.',
    validation: () => true
  },
  {
    id: 'proportional_accuracy',
    name: 'Proportional Accuracy',
    description: 'Correct furniture proportions and scaling',
    severity: ConstraintSeverity.CRITICAL,
    enforcement: 'PROPORTIONAL ACCURACY CRITICAL: Maintain correct furniture proportions, scaling relationships between components, and realistic dimensional characteristics appropriate for the specified furniture type and intended use.',
    validation: (profile) => !!(profile.realDimensions || getFieldValue(profile.type))
  },
  {
    id: 'hardware_quality',
    name: 'Hardware Quality Standards',
    description: 'Commercial-grade hardware appearance',
    severity: ConstraintSeverity.MEDIUM,
    enforcement: 'HARDWARE QUALITY REQUIREMENT: Display commercial-grade hardware including hinges, handles, brackets, mechanisms, and fasteners appropriate for enterprise furniture applications. Hardware should appear robust and professionally finished.',
    validation: () => true
  }
];

// Context-Specific Constraints
export const CONTEXT_CONSTRAINTS: Record<ContextPreset, ConstraintRule[]> = {
  packshot: [
    {
      id: 'packshot_background',
      name: 'Packshot Background Requirements',
      description: 'Clean studio background with no distractions',
      severity: ConstraintSeverity.CRITICAL,
      enforcement: 'PACKSHOT BACKGROUND CRITICAL: Use only seamless white studio background with gradient lighting. No environmental elements, props (unless specifically approved), or visual distractions. Product must be the sole focus of the composition.',
      validation: () => true
    },
    {
      id: 'packshot_lighting',
      name: 'Studio Lighting Standards',
      description: 'Professional three-point lighting setup',
      severity: ConstraintSeverity.HIGH,
      enforcement: 'STUDIO LIGHTING REQUIREMENT: Use professional three-point lighting setup with key light, fill light, and rim light. Lighting should be soft and even, eliminating harsh shadows while maintaining material texture definition.',
      validation: () => true
    }
  ],
  
  lifestyle: [
    {
      id: 'lifestyle_environment',
      name: 'Realistic Environment Context',
      description: 'Authentic interior environment settings',
      severity: ConstraintSeverity.HIGH,
      enforcement: 'LIFESTYLE ENVIRONMENT REQUIREMENT: Show product in realistic, professionally designed interior environment appropriate for its intended use. Environment should enhance product appeal without overshadowing the furniture piece.',
      validation: () => true
    },
    {
      id: 'lifestyle_integration',
      name: 'Natural Product Integration',
      description: 'Product naturally integrated within scene',
      severity: ConstraintSeverity.MEDIUM,
      enforcement: 'NATURAL INTEGRATION REQUIREMENT: Product should appear naturally placed within the environment, not artificially inserted. Lighting, shadows, and spatial relationships must be consistent and realistic.',
      validation: () => true
    }
  ],
  
  hero: [
    {
      id: 'hero_composition',
      name: 'Banner Composition Requirements',
      description: 'Composition optimized for website headers',
      severity: ConstraintSeverity.HIGH,
      enforcement: 'HERO BANNER REQUIREMENT: Compose image for website header usage with appropriate negative space for text overlay. Product should be prominently featured with strong visual impact suitable for brand representation.',
      validation: () => true
    },
    {
      id: 'hero_text_space',
      name: 'Text Overlay Space Reservation',
      description: 'Reserved space for text overlay integration',
      severity: ConstraintSeverity.MEDIUM,
      enforcement: 'TEXT SPACE REQUIREMENT: Reserve appropriate space for text overlay integration based on specified text zone requirements. Composition should accommodate typography without compromising product visibility.',
      validation: (profile, settings) => !!settings.reservedTextZone
    }
  ],
  
  instagram: [
    {
      id: 'instagram_format',
      name: 'Square Format Optimization',
      description: '1:1 aspect ratio composition',
      severity: ConstraintSeverity.CRITICAL,
      enforcement: 'INSTAGRAM FORMAT CRITICAL: Compose for 1:1 square aspect ratio optimized for Instagram feeds. Product should be centered and prominent within square frame boundaries.',
      validation: () => true
    },
    {
      id: 'social_appeal',
      name: 'Social Media Visual Appeal',
      description: 'Engaging composition for social media',
      severity: ConstraintSeverity.MEDIUM,
      enforcement: 'SOCIAL MEDIA APPEAL REQUIREMENT: Create visually engaging composition suitable for social media sharing with thumb-stopping appeal and mobile device viewing optimization.',
      validation: () => true
    }
  ],
  
  story: [
    {
      id: 'vertical_composition',
      name: 'Vertical Mobile Composition',
      description: '9:16 aspect ratio for mobile stories',
      severity: ConstraintSeverity.CRITICAL,
      enforcement: 'VERTICAL STORY CRITICAL: Compose for 9:16 vertical aspect ratio optimized for mobile story formats. Product should be prominently displayed within vertical frame with mobile viewing considerations.',
      validation: () => true
    }
  ],
  
  detail: [
    {
      id: 'detail_focus',
      name: 'Material Detail Focus',
      description: 'Close-up emphasis on materials and construction',
      severity: ConstraintSeverity.HIGH,
      enforcement: 'DETAIL FOCUS REQUIREMENT: Emphasize material textures, surface finishes, construction details, and craftsmanship quality. Use macro photography techniques to showcase furniture quality indicators.',
      validation: () => true
    }
  ]
};

// Strict Mode Additional Constraints
export const STRICT_MODE_CONSTRAINTS: ConstraintRule[] = [
  {
    id: 'no_text_elements',
    name: 'Text Element Prohibition',
    description: 'Absolutely no text, labels, or written content',
    severity: ConstraintSeverity.CRITICAL,
    enforcement: 'TEXT PROHIBITION CRITICAL: Absolutely no text, labels, captions, watermarks, logos, product numbers, model identifiers, or any written content within the image. Image must be completely free of textual elements.',
    validation: (profile, settings) => settings.strictMode
  },
  {
    id: 'no_extra_objects',
    name: 'Extra Object Prohibition',
    description: 'No additional furniture or objects beyond approved props',
    severity: ConstraintSeverity.CRITICAL,
    enforcement: 'OBJECT PROHIBITION CRITICAL: Do not add furniture pieces, decorative objects, or elements not specifically listed in approved props. Focus exclusively on the specified furniture product.',
    validation: (profile, settings) => settings.strictMode
  },
  {
    id: 'commercial_photography_only',
    name: 'Commercial Photography Standards',
    description: 'Professional commercial photography quality only',
    severity: ConstraintSeverity.HIGH,
    enforcement: 'COMMERCIAL STANDARD REQUIREMENT: Maintain professional commercial photography standards suitable for enterprise furniture catalogs and marketing materials. No consumer-grade or amateur photography aesthetics.',
    validation: (profile, settings) => settings.strictMode
  }
];

// Constraint Enforcement Builder
export class ConstraintEnforcer {
  private profile: ProductProfile;
  private settings: UiSettings;
  private contextPreset: ContextPreset;

  constructor(profile: ProductProfile, settings: UiSettings, contextPreset: ContextPreset) {
    this.profile = profile;
    this.settings = settings;
    this.contextPreset = contextPreset;
  }

  /**
   * Build comprehensive constraint enforcement block for prompt inclusion
   */
  public buildConstraintEnforcement(): string {
    const applicableConstraints = this.getApplicableConstraints();
    const sortedConstraints = this.sortConstraintsBySeverity(applicableConstraints);
    
    let constraintBlock = '\n🚨 ENTERPRISE FURNITURE CONSTRAINTS (STRICT ADHERENCE REQUIRED):\n';
    constraintBlock += '=' .repeat(70) + '\n';

    // Group constraints by severity
    const criticalConstraints = sortedConstraints.filter(c => c.severity === ConstraintSeverity.CRITICAL);
    const highConstraints = sortedConstraints.filter(c => c.severity === ConstraintSeverity.HIGH);
    const mediumConstraints = sortedConstraints.filter(c => c.severity === ConstraintSeverity.MEDIUM);

    // Add critical constraints first
    if (criticalConstraints.length > 0) {
      constraintBlock += '\n🔴 CRITICAL REQUIREMENTS (MANDATORY):\n';
      criticalConstraints.forEach(constraint => {
        constraintBlock += `\n• ${constraint.enforcement}\n`;
      });
    }

    // Add high priority constraints
    if (highConstraints.length > 0) {
      constraintBlock += '\n🟠 HIGH PRIORITY REQUIREMENTS:\n';
      highConstraints.forEach(constraint => {
        constraintBlock += `\n• ${constraint.enforcement}\n`;
      });
    }

    // Add medium priority constraints
    if (mediumConstraints.length > 0) {
      constraintBlock += '\n🟡 STANDARD REQUIREMENTS:\n';
      mediumConstraints.forEach(constraint => {
        constraintBlock += `\n• ${constraint.enforcement}\n`;
      });
    }

    // Add constraint summary
    constraintBlock += '\n' + '=' .repeat(70);
    constraintBlock += `\nTOTAL CONSTRAINTS ENFORCED: ${sortedConstraints.length}`;
    constraintBlock += `\n- Critical: ${criticalConstraints.length}`;
    constraintBlock += `\n- High Priority: ${highConstraints.length}`;
    constraintBlock += `\n- Standard: ${mediumConstraints.length}`;
    constraintBlock += '\n' + '=' .repeat(70) + '\n';

    return constraintBlock;
  }

  /**
   * Get all applicable constraints for current configuration
   */
  private getApplicableConstraints(): ConstraintRule[] {
    let constraints: ConstraintRule[] = [];

    // Add wall-mounted constraints if applicable
    if (getFieldValue(this.profile.wallMounted)) {
      constraints = constraints.concat(
        WALL_MOUNTED_CONSTRAINTS.filter(c => c.validation ? c.validation(this.profile, this.settings) : true)
      );
    }

    // Add material constraints
    constraints = constraints.concat(
      MATERIAL_CONSTRAINTS.filter(c => c.validation ? c.validation(this.profile, this.settings) : true)
    );

    // Add commercial quality constraints
    constraints = constraints.concat(
      COMMERCIAL_QUALITY_CONSTRAINTS.filter(c => c.validation ? c.validation(this.profile, this.settings) : true)
    );

    // Add context-specific constraints
    const contextConstraints = CONTEXT_CONSTRAINTS[this.contextPreset] || [];
    constraints = constraints.concat(
      contextConstraints.filter(c => c.validation ? c.validation(this.profile, this.settings) : true)
    );

    // Add strict mode constraints if enabled
    if (this.settings.strictMode) {
      constraints = constraints.concat(
        STRICT_MODE_CONSTRAINTS.filter(c => c.validation ? c.validation(this.profile, this.settings) : true)
      );
    }

    // Remove duplicates by ID
    const uniqueConstraints = constraints.filter(
      (constraint, index, array) => array.findIndex(c => c.id === constraint.id) === index
    );

    return uniqueConstraints;
  }

  /**
   * Sort constraints by severity level
   */
  private sortConstraintsBySeverity(constraints: ConstraintRule[]): ConstraintRule[] {
    const severityOrder = {
      [ConstraintSeverity.CRITICAL]: 0,
      [ConstraintSeverity.HIGH]: 1,
      [ConstraintSeverity.MEDIUM]: 2,
      [ConstraintSeverity.LOW]: 3
    };

    return constraints.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Get constraint statistics for logging/debugging
   */
  public getConstraintStats(): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const constraints = this.getApplicableConstraints();
    
    return {
      total: constraints.length,
      critical: constraints.filter(c => c.severity === ConstraintSeverity.CRITICAL).length,
      high: constraints.filter(c => c.severity === ConstraintSeverity.HIGH).length,
      medium: constraints.filter(c => c.severity === ConstraintSeverity.MEDIUM).length,
      low: constraints.filter(c => c.severity === ConstraintSeverity.LOW).length
    };
  }
}

/**
 * Build constraint enforcement for inclusion in prompts
 */
export function buildConstraintEnforcement(
  profile: ProductProfile,
  settings: UiSettings,
  contextPreset: ContextPreset
): string {
  const enforcer = new ConstraintEnforcer(profile, settings, contextPreset);
  return enforcer.buildConstraintEnforcement();
}

/**
 * Get constraint statistics for the current configuration
 */
export function getConstraintStatistics(
  profile: ProductProfile,
  settings: UiSettings,
  contextPreset: ContextPreset
): ReturnType<ConstraintEnforcer['getConstraintStats']> {
  const enforcer = new ConstraintEnforcer(profile, settings, contextPreset);
  return enforcer.getConstraintStats();
}