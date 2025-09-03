/**
 * INTELLIGENT FURNITURE PLACEMENT SYSTEM
 * 
 * Advanced placement detection and enforcement system specifically designed 
 * to eliminate placement errors in AI-generated furniture photography.
 * 
 * Key Features:
 * - Enhanced keyword detection for placement types
 * - Context-aware placement validation
 * - Zero-tolerance enforcement for wall-mounted furniture
 * - Intelligent spatial relationship detection
 * - Production-grade placement logic
 */

import { ProductSpecs } from '@/components/image-generator/types';
import { PlacementType, FurnitureCategory } from '@/lib/gemini-prompt-engine';

// Advanced Placement Detection Configuration
export interface PlacementDetectionConfig {
  strictMode: boolean;
  confidenceThreshold: number; // 0-1, minimum confidence for placement detection
  keywordWeighting: boolean;   // Use weighted keyword scoring
  contextValidation: boolean;  // Validate placement against furniture category
}

// Placement Confidence Scoring
export interface PlacementAnalysis {
  detectedPlacement: PlacementType;
  confidence: number; // 0-1
  supportingKeywords: string[];
  conflictingKeywords: string[];
  validationPassed: boolean;
  recommendations: string[];
  enforcementLevel: 'ABSOLUTE' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// Enhanced Keyword Dictionary for Placement Detection
const PLACEMENT_KEYWORDS = {
  wall_mounted: {
    primary: [
      'wall mount', 'wall mounted', 'wall-mounted', 'wall desk', 'wall table',
      'wall shelf', 'wall cabinet', 'wall unit', 'floating desk', 'floating shelf',
      'floating table', 'cantilever', 'bracket mounted', 'wall bracket',
      'wall hanging', 'mounted', 'wall supported', 'wall fixed'
    ],
    secondary: [
      'floating', 'suspended', 'bracket', 'cleat', 'wall hardware',
      'no legs', 'legless', 'wall installation', 'mounting system',
      'wall attachment', 'wall secured', 'space saving'
    ],
    negative: [
      'floor standing', 'floor mounted', 'legs', 'feet', 'pedestals',
      'floor support', 'standing', 'floor contact', 'four legs',
      'table legs', 'desk legs', 'base', 'stand'
    ]
  },
  
  floor_standing: {
    primary: [
      'floor standing', 'floor mounted', 'standing desk', 'standing table',
      'legs', 'four legs', 'table legs', 'desk legs', 'chair legs',
      'feet', 'base', 'pedestal', 'floor supported', 'floor contact'
    ],
    secondary: [
      'standing', 'supported', 'stable base', 'floor base', 'leg assembly',
      'foot assembly', 'floor installation', 'freestanding', 'free standing'
    ],
    negative: [
      'wall mount', 'wall mounted', 'floating', 'bracket', 'hanging',
      'suspended', 'wall installation', 'no legs', 'legless'
    ]
  },
  
  tabletop: {
    primary: [
      'tabletop', 'table top', 'desktop', 'desk top', 'surface mount',
      'surface mounted', 'countertop', 'counter top', 'small', 'compact',
      'portable'
    ],
    secondary: [
      'surface', 'top mounted', 'lightweight', 'moveable', 'portable',
      'accent piece', 'decorative', 'personal', 'small scale'
    ],
    negative: [
      'large', 'heavy', 'floor standing', 'wall mounted', 'permanent',
      'built-in', 'installation required'
    ]
  },
  
  ceiling_mounted: {
    primary: [
      'ceiling mount', 'ceiling mounted', 'ceiling hung', 'pendant',
      'hanging', 'suspended', 'ceiling installation', 'overhead',
      'ceiling bracket', 'ceiling supported'
    ],
    secondary: [
      'hanging', 'suspended', 'overhead', 'above', 'ceiling hardware',
      'suspension system', 'pendant style', 'drop down'
    ],
    negative: [
      'floor', 'wall', 'table', 'standing', 'supported', 'base',
      'legs', 'feet', 'mounted below'
    ]
  },
  
  built_in: {
    primary: [
      'built in', 'built-in', 'integrated', 'custom built', 'fitted',
      'bespoke', 'permanent installation', 'architectural', 'fixed',
      'permanent'
    ],
    secondary: [
      'custom', 'integrated design', 'architectural element', 'fitted furniture',
      'permanent fixture', 'non-moveable', 'structural'
    ],
    negative: [
      'portable', 'moveable', 'freestanding', 'detachable', 'removable',
      'standalone', 'separate'
    ]
  }
};

// Furniture Category Placement Validation Rules
const CATEGORY_PLACEMENT_RULES: Record<FurnitureCategory, PlacementType[]> = {
  seating: ['floor_standing', 'wall_mounted'],
  tables: ['floor_standing', 'wall_mounted', 'tabletop'],
  storage: ['floor_standing', 'wall_mounted', 'built_in', 'ceiling_mounted'],
  workstations: ['floor_standing', 'wall_mounted', 'built_in'],
  lighting: ['ceiling_mounted', 'wall_mounted', 'floor_standing', 'tabletop'],
  decor: ['tabletop', 'wall_mounted', 'floor_standing'],
  textiles: ['floor_standing', 'wall_mounted'],
  outdoor: ['floor_standing', 'built_in'],
  unknown: ['floor_standing', 'wall_mounted', 'tabletop', 'ceiling_mounted', 'built_in']
};

/**
 * INTELLIGENT PLACEMENT DETECTION ENGINE
 */
export class IntelligentPlacementSystem {
  
  /**
   * Analyze product specifications to determine placement type with confidence scoring
   */
  static analyzePlacement(
    specs: ProductSpecs,
    furnitureCategory: FurnitureCategory,
    config: PlacementDetectionConfig = {
      strictMode: true,
      confidenceThreshold: 0.7,
      keywordWeighting: true,
      contextValidation: true
    }
  ): PlacementAnalysis {
    
    const analysisText = `${specs.productName} ${specs.productType} ${specs.materials} ${specs.additionalSpecs || ''}`.toLowerCase();
    
    // Score each placement type
    const placementScores = this.scoreAllPlacements(analysisText, config.keywordWeighting);
    
    // Find highest scoring placement
    const sortedPlacements = Object.entries(placementScores)
      .sort(([,a], [,b]) => b.score - a.score);
    
    const [topPlacement, topScore] = sortedPlacements[0];
    const detectedPlacement = topPlacement as PlacementType;
    const confidence = topScore.score;
    
    // Validate against furniture category
    const validationPassed = config.contextValidation ? 
      this.validatePlacementForCategory(detectedPlacement, furnitureCategory) : true;
    
    // Determine enforcement level based on confidence and validation
    const enforcementLevel = this.determineEnforcementLevel(
      confidence, 
      validationPassed, 
      detectedPlacement,
      config.strictMode
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      detectedPlacement,
      confidence,
      validationPassed,
      topScore.supportingKeywords,
      topScore.conflictingKeywords
    );
    
    return {
      detectedPlacement,
      confidence,
      supportingKeywords: topScore.supportingKeywords,
      conflictingKeywords: topScore.conflictingKeywords,
      validationPassed,
      recommendations,
      enforcementLevel
    };
  }

  /**
   * Score all placement types using keyword analysis
   */
  private static scoreAllPlacements(
    text: string, 
    useWeighting: boolean
  ): Record<string, {
    score: number;
    supportingKeywords: string[];
    conflictingKeywords: string[];
  }> {
    const scores: Record<string, PlacementScore> = {};
    
    for (const [placementType, keywords] of Object.entries(PLACEMENT_KEYWORDS)) {
      const result = this.scorePlacement(text, keywords, useWeighting);
      scores[placementType] = result;
    }
    
    return scores;
  }

  /**
   * Score individual placement type based on keyword presence
   */
  private static scorePlacement(
    text: string,
    keywords: PlacementKeywords,
    useWeighting: boolean
  ): {
    score: number;
    supportingKeywords: string[];
    conflictingKeywords: string[];
  } {
    let score = 0;
    const supportingKeywords: string[] = [];
    const conflictingKeywords: string[] = [];
    
    // Primary keywords (high weight)
    const primaryWeight = useWeighting ? 3 : 1;
    for (const keyword of keywords.primary) {
      if (text.includes(keyword)) {
        score += primaryWeight;
        supportingKeywords.push(keyword);
      }
    }
    
    // Secondary keywords (medium weight)
    const secondaryWeight = useWeighting ? 1.5 : 1;
    for (const keyword of keywords.secondary) {
      if (text.includes(keyword)) {
        score += secondaryWeight;
        supportingKeywords.push(keyword);
      }
    }
    
    // Negative keywords (penalty)
    const negativeWeight = useWeighting ? -2 : -1;
    for (const keyword of keywords.negative) {
      if (text.includes(keyword)) {
        score += negativeWeight;
        conflictingKeywords.push(keyword);
      }
    }
    
    // Normalize score (0-1 range)
    const maxPossibleScore = keywords.primary.length * primaryWeight + 
                           keywords.secondary.length * secondaryWeight;
    const normalizedScore = Math.max(0, Math.min(1, score / maxPossibleScore));
    
    return {
      score: normalizedScore,
      supportingKeywords,
      conflictingKeywords
    };
  }

  /**
   * Validate placement against furniture category constraints
   */
  private static validatePlacementForCategory(
    placement: PlacementType,
    category: FurnitureCategory
  ): boolean {
    const validPlacements = CATEGORY_PLACEMENT_RULES[category];
    return validPlacements.includes(placement);
  }

  /**
   * Determine constraint enforcement level
   */
  private static determineEnforcementLevel(
    confidence: number,
    validationPassed: boolean,
    placement: PlacementType,
    strictMode: boolean
  ): 'ABSOLUTE' | 'HIGH' | 'MEDIUM' | 'LOW' {
    
    // Wall-mounted furniture always gets absolute enforcement in strict mode
    if (placement === 'wall_mounted' && strictMode) {
      return 'ABSOLUTE';
    }
    
    // High confidence + validation = high enforcement
    if (confidence >= 0.8 && validationPassed) {
      return 'HIGH';
    }
    
    // Medium confidence or failed validation
    if (confidence >= 0.5 || !validationPassed) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Generate placement recommendations
   */
  private static generateRecommendations(
    placement: PlacementType,
    confidence: number,
    validationPassed: boolean,
    supportingKeywords: string[],
    conflictingKeywords: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (confidence < 0.7) {
      recommendations.push('Low confidence in placement detection - consider manual verification');
    }
    
    if (!validationPassed) {
      recommendations.push('Placement type may not be appropriate for detected furniture category');
    }
    
    if (conflictingKeywords.length > 0) {
      recommendations.push(`Conflicting placement indicators found: ${conflictingKeywords.join(', ')}`);
    }
    
    if (placement === 'wall_mounted') {
      recommendations.push('CRITICAL: Ensure zero floor contact in generated images');
      recommendations.push('Verify mounting hardware is visible and appropriate');
    }
    
    if (placement === 'floor_standing') {
      recommendations.push('Ensure all support points make proper floor contact');
      recommendations.push('Verify realistic clearances from walls');
    }
    
    return recommendations;
  }

  /**
   * Build placement-specific prompt constraints
   */
  static buildPlacementConstraints(
    analysis: PlacementAnalysis,
    specs: ProductSpecs
  ): string {
    const placement = analysis.detectedPlacement;
    const enforcementLevel = analysis.enforcementLevel;
    const productType = specs.productType.toLowerCase();
    
    let constraints = `🏗️ INTELLIGENT PLACEMENT ENFORCEMENT - ${enforcementLevel} LEVEL

DETECTED PLACEMENT: ${placement.toUpperCase().replace('_', ' ')}
CONFIDENCE: ${Math.round(analysis.confidence * 100)}%
SUPPORTING EVIDENCE: ${analysis.supportingKeywords.join(', ')}

`;

    // Enforcement level prefix
    const levelPrefix = {
      'ABSOLUTE': '🚨 ZERO TOLERANCE',
      'HIGH': '⚠️  STRICT ENFORCEMENT',
      'MEDIUM': '📋 STANDARD ENFORCEMENT', 
      'LOW': '💡 GUIDANCE'
    };

    constraints += `${levelPrefix[enforcementLevel]} PLACEMENT REQUIREMENTS:

`;

    // Placement-specific constraints based on detected type
    switch (placement) {
      case 'wall_mounted':
        constraints += this.buildWallMountedConstraints(productType, enforcementLevel);
        break;
      case 'floor_standing':
        constraints += this.buildFloorStandingConstraints(productType, enforcementLevel);
        break;
      case 'tabletop':
        constraints += this.buildTabletopConstraints(productType, enforcementLevel);
        break;
      case 'ceiling_mounted':
        constraints += this.buildCeilingMountedConstraints(productType, enforcementLevel);
        break;
      case 'built_in':
        constraints += this.buildBuiltInConstraints(productType, enforcementLevel);
        break;
    }

    // Add recommendations if any
    if (analysis.recommendations.length > 0) {
      constraints += `\n📝 PLACEMENT RECOMMENDATIONS:
${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}`;
    }

    // Add conflicting keywords warning
    if (analysis.conflictingKeywords.length > 0) {
      constraints += `\n⚠️  CONFLICTING PLACEMENT INDICATORS DETECTED:
These keywords suggest different placement: ${analysis.conflictingKeywords.join(', ')}
OVERRIDE INSTRUCTION: Ignore conflicting indicators and follow detected placement: ${placement.replace('_', ' ').toUpperCase()}`;
    }

    return constraints;
  }

  /**
   * Build wall-mounted specific constraints
   */
  private static buildWallMountedConstraints(productType: string, level: string): string {
    const isDesk = productType.includes('desk') || productType.includes('workstation');
    
    let constraints = `WALL-MOUNTED POSITIONING REQUIREMENTS:
• Product MUST be attached to wall surface with appropriate mounting system
• ABSOLUTELY NO floor contact - not even partial or suggested contact
• Show realistic mounting hardware (brackets, cleats, cantilever system)
• Position at appropriate height for furniture type and intended use`;

    if (isDesk) {
      constraints += `
• Desk surface height typically 72-76cm from floor
• Show proper wall mounting system capable of supporting desk weight
• Display appropriate clearance beneath desk (minimum 5-10cm)`;
    }

    constraints += `
• Maintain minimum clearance beneath product
• Wall surface must appear capable of supporting furniture weight
• No legs, supports, pedestals, or floor-based stability systems

ABSOLUTE PROHIBITIONS:
• NO desk legs or table legs extending to floor
• NO feet, supports, or bases making floor contact
• NO pedestals, stands, or floor-mounted supports
• NO free-standing installation when wall mounting is specified
• NO floating appearance without visible mounting system`;

    if (level === 'ABSOLUTE') {
      constraints += `

🚨 ZERO TOLERANCE VALIDATION:
Any image showing floor contact for wall-mounted furniture constitutes IMMEDIATE GENERATION FAILURE. 
The furniture must appear professionally wall-mounted with appropriate hardware and no floor connection.`;
    }

    return constraints;
  }

  /**
   * Build floor-standing specific constraints  
   */
  private static buildFloorStandingConstraints(_productType: string, level: string): string {
    return `FLOOR-STANDING POSITIONING REQUIREMENTS:
• ALL furniture support points MUST make proper contact with floor surface
• Show stable, level positioning demonstrating furniture stability
• Maintain realistic clearances from walls (typically 5-15cm)
• Position to allow normal access and functionality
• Display appropriate weight distribution and balance

FLOOR CONTACT VALIDATION:
• All legs, feet, or base elements must show floor contact
• Furniture must appear stable and properly supported
• Floor surface interaction must look realistic and secure
• No floating, suspended, or partially supported appearance

SPATIAL RELATIONSHIP REQUIREMENTS:
• Maintain appropriate distance from walls for access
• Show realistic room positioning for furniture type
• Allow for normal traffic flow and furniture use
• Position within realistic interior space context`;
  }

  /**
   * Build tabletop specific constraints
   */
  private static buildTabletopConstraints(_productType: string, level: string): string {
    return `TABLETOP POSITIONING REQUIREMENTS:
• Product MUST be positioned on appropriate supporting surface
• Supporting surface must be proportionally suitable for product size
• Show stable placement with full surface contact
• Surface material and finish must be appropriate for product type

SURFACE RELATIONSHIP VALIDATION:
• Product size appropriate for supporting surface dimensions
• Stable positioning without overhang or instability
• Surface capable of supporting product weight
• Realistic height relationship between product and surface

PLACEMENT AUTHENTICITY:
• Natural positioning suggesting normal use
• Appropriate clearance around product edges
• Supporting surface integral to composition`;
  }

  /**
   * Build ceiling-mounted specific constraints
   */
  private static buildCeilingMountedConstraints(_productType: string, level: string): string {
    return `CEILING-MOUNTED POSITIONING REQUIREMENTS:
• Product MUST hang from ceiling attachment point with appropriate hardware
• Show realistic suspension system suitable for product weight
• Maintain proper hanging height and clearances
• Display secure ceiling attachment and mounting system

SUSPENSION VALIDATION:
• Clear ceiling attachment point visible
• Appropriate hanging hardware for product type and weight
• Realistic suspension height for furniture function
• No contact with walls, floor, or other surfaces

INSTALLATION AUTHENTICITY:
• Professional installation appearance
• Appropriate ceiling material for mounting system
• Realistic clearances and spatial relationships`;
  }

  /**
   * Build built-in specific constraints
   */
  private static buildBuiltInConstraints(_productType: string, level: string): string {
    return `BUILT-IN POSITIONING REQUIREMENTS:
• Product MUST appear integrated into architectural space
• Show seamless integration with walls, floor, or ceiling
• Display custom fitting and permanent installation
• Demonstrate architectural relationship with space

INTEGRATION VALIDATION:
• Seamless connection with architectural elements
• Custom proportions fitting specific space
• Permanent installation appearance
• No gaps or separation from architectural context

ARCHITECTURAL AUTHENTICITY:
• Professional installation quality
• Appropriate materials matching architectural context
• Realistic custom proportions and fitting`;
  }

  /**
   * Quick placement detection for API integration
   */
  static quickDetectPlacement(specs: ProductSpecs): PlacementType {
    const text = `${specs.productName} ${specs.productType}`.toLowerCase();
    
    // Quick keyword checks for most common cases
    if (text.includes('wall') && (text.includes('mount') || text.includes('desk') || text.includes('shelf'))) {
      return 'wall_mounted';
    }
    
    if (text.includes('ceiling') || text.includes('pendant') || text.includes('hanging')) {
      return 'ceiling_mounted';  
    }
    
    if (text.includes('tabletop') || text.includes('desktop') || text.includes('small')) {
      return 'tabletop';
    }
    
    if (text.includes('built') && text.includes('in')) {
      return 'built_in';
    }
    
    // Default to floor standing
    return 'floor_standing';
  }
}

/**
 * CONVENIENCE FUNCTIONS FOR API INTEGRATION
 */

/**
 * Analyze placement with production settings
 */
export function analyzeProductionPlacement(
  specs: ProductSpecs,
  furnitureCategory: FurnitureCategory
): PlacementAnalysis {
  return IntelligentPlacementSystem.analyzePlacement(
    specs,
    furnitureCategory,
    {
      strictMode: true,
      confidenceThreshold: 0.7,
      keywordWeighting: true,
      contextValidation: true
    }
  );
}

/**
 * Build production placement constraints
 */
export function buildProductionPlacementConstraints(
  specs: ProductSpecs,
  furnitureCategory: FurnitureCategory
): string {
  const analysis = analyzeProductionPlacement(specs, furnitureCategory);
  return IntelligentPlacementSystem.buildPlacementConstraints(analysis, specs);
}