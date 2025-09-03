/**
 * GEMINI 2.5 FLASH IMAGE PROMPT ENGINEERING FRAMEWORK
 * 
 * World-class prompt engineering system for furniture/product photography SaaS
 * Optimized for direct product image generation without AI analysis dependencies
 * 
 * Key Features:
 * - Context-aware prompt building for 6 different presets
 * - Smart product intelligence based on product type and materials
 * - Multimodal image handling for Gemini's capabilities
 * - Professional photography standards enforcement
 * - Systematic quality assurance built into prompts
 */

import { ContextPreset, UiSettings, ProductSpecs } from '@/components/image-generator/types';

// Core Prompt Engineering Types
export interface PromptEngineResult {
  prompt: string;
  metadata: {
    contextPreset: ContextPreset;
    productIntelligence: ProductIntelligence;
    qualityLevel: 'enterprise' | 'commercial' | 'standard';
    promptLength: number;
    multimodalInstructions: string[];
    constraintsApplied: string[];
  };
}

export interface ProductIntelligence {
  category: FurnitureCategory;
  placementType: PlacementType;
  materialProfile: MaterialProfile;
  scaleGuidance: ScaleGuidance;
  lightingRequirements: LightingProfile;
}

// Furniture Intelligence System
export type FurnitureCategory = 
  | 'seating' | 'tables' | 'storage' | 'workstations' 
  | 'lighting' | 'decor' | 'textiles' | 'outdoor' | 'unknown';

export type PlacementType = 
  | 'floor_standing' | 'wall_mounted' | 'ceiling_mounted' 
  | 'tabletop' | 'built_in' | 'suspended';

export type MaterialProfile = {
  primary: MaterialType;
  secondary: MaterialType[];
  textureComplexity: 'simple' | 'moderate' | 'complex';
  reflectanceLevel: 'matte' | 'satin' | 'gloss' | 'mirror';
  requiredLighting: LightingIntensity;
};

export type MaterialType = 
  | 'wood' | 'metal' | 'fabric' | 'leather' | 'glass' 
  | 'plastic' | 'stone' | 'ceramic' | 'composite';

export type LightingIntensity = 'soft' | 'balanced' | 'dramatic' | 'technical';

export interface ScaleGuidance {
  humanReference: boolean;
  proportionalElements: string[];
  dimensionalContext: string;
  viewingDistance: 'close' | 'medium' | 'distant';
}

export interface LightingProfile {
  primaryAngle: number; // degrees from camera axis
  fillRatio: number; // 0.2 to 0.8
  shadowStyle: 'minimal' | 'soft' | 'dramatic' | 'technical';
  colorTemperature: '3000K' | '4000K' | '5000K' | '5600K' | '6500K';
  specialRequirements: string[];
}

// Context-Specific Photography Standards
export interface ContextPhotographyStandards {
  composition: CompositionRules;
  technicalSpecs: TechnicalSpecs;
  qualityRequirements: QualityRequirements;
  outputOptimization: OutputOptimization;
}

export interface CompositionRules {
  framing: string;
  productPlacement: string;
  negativeSpace: string;
  visualHierarchy: string;
  textOverlaySpace?: string;
}

export interface TechnicalSpecs {
  resolution: string;
  aspectRatio: string;
  focusPoints: string[];
  depthOfField: string;
  colorSpace: string;
  exposureGuidance: string;
}

export interface QualityRequirements {
  sharpnessLevel: 'commercial' | 'catalog' | 'hero' | 'detail';
  noiseLevel: 'ultra_low' | 'low' | 'moderate';
  colorAccuracy: 'critical' | 'high' | 'standard';
  dynamicRange: 'extended' | 'standard' | 'compressed';
}

export interface OutputOptimization {
  primaryUsage: string;
  platformRequirements: string[];
  scalabilityNeeds: string[];
  deliveryFormat: string;
}

/**
 * MAIN PROMPT ENGINEERING ENGINE
 * Builds world-class prompts for Gemini 2.5 Flash Image
 */
export class GeminiPromptEngine {
  
  /**
   * Generate optimized prompt for direct product image generation
   */
  static generatePrompt(
    specs: ProductSpecs,
    contextPreset: ContextPreset,
    settings: UiSettings,
    multimodalContext?: string[]
  ): PromptEngineResult {
    // 1. Analyze Product Intelligence
    const productIntel = this.analyzeProduct(specs);
    
    // 2. Get Context Photography Standards
    const contextStandards = this.getContextStandards(contextPreset);
    
    // 3. Build Core Prompt Architecture
    const corePrompt = this.buildCorePrompt(
      specs, 
      contextPreset, 
      productIntel, 
      contextStandards
    );
    
    // 4. Apply Settings Integration
    const settingsPrompt = this.integrateSettings(corePrompt, settings);
    
    // 5. Add Multimodal Intelligence
    const multimodalPrompt = this.addMultimodalInstructions(
      settingsPrompt, 
      multimodalContext
    );
    
    // 6. Apply Quality Assurance
    const finalPrompt = this.applyQualityAssurance(
      multimodalPrompt,
      contextPreset,
      productIntel
    );
    
    // 7. Add Constraint Enforcement
    const constrainedPrompt = this.enforceConstraints(
      finalPrompt,
      contextPreset,
      productIntel,
      settings
    );

    return {
      prompt: constrainedPrompt,
      metadata: {
        contextPreset,
        productIntelligence: productIntel,
        qualityLevel: this.determineQualityLevel(settings.quality),
        promptLength: constrainedPrompt.length,
        multimodalInstructions: multimodalContext || [],
        constraintsApplied: this.getAppliedConstraints(contextPreset, productIntel)
      }
    };
  }

  /**
   * Analyze product to extract intelligence for smart prompting
   */
  private static analyzeProduct(specs: ProductSpecs): ProductIntelligence {
    const category = this.categorizeProduct(specs.productType);
    const placementType = this.determinePlacement(specs.productType);
    const materialProfile = this.analyzeMaterials(specs.materials);
    const scaleGuidance = this.calculateScaleGuidance(specs, category);
    const lightingRequirements = this.determineLighting(materialProfile, category);

    return {
      category,
      placementType,
      materialProfile,
      scaleGuidance,
      lightingRequirements
    };
  }

  /**
   * Categorize product into furniture intelligence categories
   */
  private static categorizeProduct(productType: string): FurnitureCategory {
    const type = productType.toLowerCase();
    
    if (type.includes('chair') || type.includes('sofa') || type.includes('stool') || 
        type.includes('bench') || type.includes('seat')) {
      return 'seating';
    }
    
    if (type.includes('desk') || type.includes('table') || type.includes('workstation') ||
        type.includes('counter') || type.includes('surface')) {
      return 'tables';
    }
    
    if (type.includes('cabinet') || type.includes('shelf') || type.includes('drawer') ||
        type.includes('storage') || type.includes('closet') || type.includes('wardrobe')) {
      return 'storage';
    }
    
    if (type.includes('workstation') || type.includes('office') || type.includes('work')) {
      return 'workstations';
    }
    
    if (type.includes('lamp') || type.includes('light') || type.includes('fixture')) {
      return 'lighting';
    }
    
    if (type.includes('outdoor') || type.includes('patio') || type.includes('garden')) {
      return 'outdoor';
    }
    
    if (type.includes('rug') || type.includes('curtain') || type.includes('pillow') ||
        type.includes('textile') || type.includes('fabric')) {
      return 'textiles';
    }
    
    return 'unknown';
  }

  /**
   * Determine placement type from product characteristics
   */
  private static determinePlacement(productType: string): PlacementType {
    const type = productType.toLowerCase();
    
    if (type.includes('wall') || type.includes('mounted') || type.includes('hanging')) {
      return 'wall_mounted';
    }
    
    if (type.includes('ceiling') || type.includes('pendant') || type.includes('suspended')) {
      return 'ceiling_mounted';
    }
    
    if (type.includes('tabletop') || type.includes('desktop') || type.includes('surface')) {
      return 'tabletop';
    }
    
    if (type.includes('built') || type.includes('integrated') || type.includes('custom')) {
      return 'built_in';
    }
    
    return 'floor_standing';
  }

  /**
   * Analyze materials to create intelligent material profile
   */
  private static analyzeMaterials(materials: string): MaterialProfile {
    const materialStr = materials.toLowerCase();
    const detectedMaterials: MaterialType[] = [];
    
    // Detect all materials present
    if (materialStr.includes('wood') || materialStr.includes('oak') || 
        materialStr.includes('pine') || materialStr.includes('walnut') ||
        materialStr.includes('maple') || materialStr.includes('cherry')) {
      detectedMaterials.push('wood');
    }
    
    if (materialStr.includes('metal') || materialStr.includes('steel') || 
        materialStr.includes('aluminum') || materialStr.includes('brass') ||
        materialStr.includes('iron') || materialStr.includes('chrome')) {
      detectedMaterials.push('metal');
    }
    
    if (materialStr.includes('fabric') || materialStr.includes('cotton') || 
        materialStr.includes('linen') || materialStr.includes('wool') ||
        materialStr.includes('polyester') || materialStr.includes('textile')) {
      detectedMaterials.push('fabric');
    }
    
    if (materialStr.includes('leather') || materialStr.includes('hide')) {
      detectedMaterials.push('leather');
    }
    
    if (materialStr.includes('glass') || materialStr.includes('crystal')) {
      detectedMaterials.push('glass');
    }
    
    if (materialStr.includes('plastic') || materialStr.includes('acrylic') || 
        materialStr.includes('polymer')) {
      detectedMaterials.push('plastic');
    }
    
    if (materialStr.includes('stone') || materialStr.includes('marble') || 
        materialStr.includes('granite') || materialStr.includes('concrete')) {
      detectedMaterials.push('stone');
    }
    
    if (materialStr.includes('ceramic') || materialStr.includes('porcelain')) {
      detectedMaterials.push('ceramic');
    }
    
    // Default to wood if nothing detected
    const primary = detectedMaterials[0] || 'composite';
    const secondary = detectedMaterials.slice(1);
    
    // Determine complexity and reflectance
    const textureComplexity = secondary.length > 1 ? 'complex' : 
                             secondary.length === 1 ? 'moderate' : 'simple';
    
    const reflectanceLevel = this.determineReflectance(primary, materialStr);
    const requiredLighting = this.determineLightingIntensity(primary, reflectanceLevel);
    
    return {
      primary,
      secondary,
      textureComplexity,
      reflectanceLevel,
      requiredLighting
    };
  }

  /**
   * Determine reflectance level from material and descriptors
   */
  private static determineReflectance(material: MaterialType, description: string): MaterialProfile['reflectanceLevel'] {
    if (description.includes('glossy') || description.includes('polished') || 
        description.includes('shiny') || material === 'glass') {
      return 'gloss';
    }
    
    if (description.includes('satin') || description.includes('semi') || 
        material === 'metal') {
      return 'satin';
    }
    
    if (description.includes('mirror') || description.includes('reflective')) {
      return 'mirror';
    }
    
    return 'matte';
  }

  /**
   * Determine required lighting intensity
   */
  private static determineLightingIntensity(
    material: MaterialType, 
    reflectance: MaterialProfile['reflectanceLevel']
  ): LightingIntensity {
    if (material === 'glass' || reflectance === 'mirror') {
      return 'technical';
    }
    
    if (material === 'metal' || reflectance === 'gloss') {
      return 'dramatic';
    }
    
    if (material === 'fabric' || material === 'leather') {
      return 'soft';
    }
    
    return 'balanced';
  }

  /**
   * Calculate scale guidance for product
   */
  private static calculateScaleGuidance(
    specs: ProductSpecs, 
    category: FurnitureCategory
  ): ScaleGuidance {
    const needsHumanReference = category === 'seating' || category === 'tables' || 
                               category === 'workstations';
    
    const proportionalElements = this.getProportionalElements(category);
    
    const dimensionalContext = specs.dimensions ? 
      `Product dimensions: ${specs.dimensions.width}×${specs.dimensions.height}×${specs.dimensions.depth}cm` :
      'Standard furniture proportions apply';
    
    const viewingDistance = category === 'lighting' || category === 'decor' ? 'close' :
                           category === 'outdoor' ? 'distant' : 'medium';
    
    return {
      humanReference: needsHumanReference,
      proportionalElements,
      dimensionalContext,
      viewingDistance
    };
  }

  /**
   * Get proportional elements for scale reference
   */
  private static getProportionalElements(category: FurnitureCategory): string[] {
    switch (category) {
      case 'seating':
        return ['floor contact', 'seat height 45-50cm', 'backrest proportion'];
      case 'tables':
        return ['floor contact', 'surface height 70-75cm', 'leg spacing'];
      case 'workstations':
        return ['floor or wall reference', 'working height 72-76cm', 'ergonomic proportions'];
      case 'storage':
        return ['floor or wall contact', 'human reach zones', 'door/drawer proportions'];
      case 'lighting':
        return ['mounting height', 'shade proportions', 'human scale reference'];
      default:
        return ['realistic scale', 'appropriate proportions'];
    }
  }

  /**
   * Determine lighting requirements
   */
  private static determineLighting(
    materialProfile: MaterialProfile, 
    category: FurnitureCategory
  ): LightingProfile {
    const intensityMap = {
      'soft': { angle: 45, fill: 0.6, shadow: 'soft' as const },
      'balanced': { angle: 30, fill: 0.4, shadow: 'minimal' as const },
      'dramatic': { angle: 60, fill: 0.2, shadow: 'dramatic' as const },
      'technical': { angle: 90, fill: 0.3, shadow: 'technical' as const }
    };
    
    const config = intensityMap[materialProfile.requiredLighting];
    
    const colorTemp = materialProfile.primary === 'wood' ? '3000K' :
                     materialProfile.primary === 'metal' ? '5600K' : '5000K';
    
    const specialRequirements = this.getSpecialLightingRequirements(materialProfile, category);
    
    return {
      primaryAngle: config.angle,
      fillRatio: config.fill,
      shadowStyle: config.shadow,
      colorTemperature: colorTemp,
      specialRequirements
    };
  }

  /**
   * Get special lighting requirements
   */
  private static getSpecialLightingRequirements(
    materialProfile: MaterialProfile,
    category: FurnitureCategory
  ): string[] {
    const requirements = [];
    
    if (materialProfile.reflectanceLevel === 'gloss' || materialProfile.reflectanceLevel === 'mirror') {
      requirements.push('Polarized lighting to reduce glare');
      requirements.push('Multiple light sources to prevent hotspots');
    }
    
    if (materialProfile.primary === 'fabric' || materialProfile.primary === 'leather') {
      requirements.push('Directional lighting to show texture');
      requirements.push('Avoid flat lighting that eliminates texture');
    }
    
    if (category === 'lighting') {
      requirements.push('Show luminaire in both on and off states if applicable');
      requirements.push('Demonstrate light quality and distribution');
    }
    
    return requirements;
  }

  /**
   * Get context-specific photography standards
   */
  private static getContextStandards(contextPreset: ContextPreset): ContextPhotographyStandards {
    switch (contextPreset) {
      case 'packshot':
        return {
          composition: {
            framing: 'Clean product isolation with 10-15% padding',
            productPlacement: 'Centered with optimal viewing angle',
            negativeSpace: 'Minimal, neutral background only',
            visualHierarchy: 'Product as sole focus, zero distractions'
          },
          technicalSpecs: {
            resolution: 'High resolution for catalog printing',
            aspectRatio: '1:1 square format',
            focusPoints: ['Entire product sharp', 'Edge to edge clarity'],
            depthOfField: 'Extended DOF (f/8-f/11 equivalent)',
            colorSpace: 'sRGB with accurate color reproduction',
            exposureGuidance: 'Bright, even exposure with detail retention'
          },
          qualityRequirements: {
            sharpnessLevel: 'catalog',
            noiseLevel: 'ultra_low',
            colorAccuracy: 'critical',
            dynamicRange: 'standard'
          },
          outputOptimization: {
            primaryUsage: 'E-commerce catalog and product listings',
            platformRequirements: ['Online catalogs', 'Print materials', 'Product databases'],
            scalabilityNeeds: ['Thumbnail generation', 'Zoom functionality', 'Print scaling'],
            deliveryFormat: 'High-resolution with clean background for masking'
          }
        };
        
      case 'lifestyle':
        return {
          composition: {
            framing: 'Environmental context with natural product integration',
            productPlacement: 'Naturally positioned within realistic setting',
            negativeSpace: 'Contextual elements that enhance product story',
            visualHierarchy: 'Product prominent but environmentally integrated'
          },
          technicalSpecs: {
            resolution: 'Marketing-grade high resolution',
            aspectRatio: '3:2 landscape format',
            focusPoints: ['Product sharp', 'Context appropriately blurred'],
            depthOfField: 'Selective focus (f/4-f/5.6 equivalent)',
            colorSpace: 'sRGB with lifestyle color grading',
            exposureGuidance: 'Natural lighting balance with architectural context'
          },
          qualityRequirements: {
            sharpnessLevel: 'commercial',
            noiseLevel: 'low',
            colorAccuracy: 'high',
            dynamicRange: 'extended'
          },
          outputOptimization: {
            primaryUsage: 'Marketing materials and website headers',
            platformRequirements: ['Website banners', 'Social media', 'Marketing campaigns'],
            scalabilityNeeds: ['Responsive web display', 'Social media formats'],
            deliveryFormat: 'Optimized for web and print marketing'
          }
        };
        
      case 'hero':
        return {
          composition: {
            framing: 'Dramatic presentation optimized for banner placement',
            productPlacement: 'Positioned for maximum visual impact',
            negativeSpace: 'Strategic space for text overlay integration',
            visualHierarchy: 'Premium brand presentation with clear focal hierarchy',
            textOverlaySpace: 'Designated zones for marketing text'
          },
          technicalSpecs: {
            resolution: 'Ultra-high resolution for large format display',
            aspectRatio: '16:9 or wider banner format',
            focusPoints: ['Product hero sharp', 'Background contextually appropriate'],
            depthOfField: 'Dramatic selective focus (f/2.8-f/4 equivalent)',
            colorSpace: 'sRGB with hero-grade color treatment',
            exposureGuidance: 'Dramatic lighting with strong visual impact'
          },
          qualityRequirements: {
            sharpnessLevel: 'hero',
            noiseLevel: 'ultra_low',
            colorAccuracy: 'critical',
            dynamicRange: 'extended'
          },
          outputOptimization: {
            primaryUsage: 'Website headers and premium marketing',
            platformRequirements: ['Website headers', 'Premium marketing', 'Trade show displays'],
            scalabilityNeeds: ['Large format display', 'High DPI screens', 'Print scaling'],
            deliveryFormat: 'Multiple resolutions with text overlay zones'
          }
        };
        
      case 'social_media_square':
        return {
          composition: {
            framing: 'Social media optimized with thumb-stopping appeal',
            productPlacement: 'Instagram-friendly centered composition',
            negativeSpace: 'Clean, social-media appropriate background',
            visualHierarchy: 'Mobile-optimized visual impact'
          },
          technicalSpecs: {
            resolution: 'Social media optimized (1080x1080 minimum)',
            aspectRatio: '1:1 square format',
            focusPoints: ['Product sharp for mobile viewing', 'Background complementary'],
            depthOfField: 'Social media appropriate (f/4-f/8 equivalent)',
            colorSpace: 'sRGB optimized for mobile screens',
            exposureGuidance: 'Bright, engaging exposure for social media'
          },
          qualityRequirements: {
            sharpnessLevel: 'commercial',
            noiseLevel: 'low',
            colorAccuracy: 'high',
            dynamicRange: 'compressed'
          },
          outputOptimization: {
            primaryUsage: 'Instagram feed and social media marketing',
            platformRequirements: ['Instagram feed', 'Facebook posts', 'Social media advertising'],
            scalabilityNeeds: ['Mobile optimization', 'Fast loading', 'Engagement optimization'],
            deliveryFormat: 'Social media ready with mobile optimization'
          }
        };
        
      case 'social_media_story':
        return {
          composition: {
            framing: 'Vertical mobile-first composition',
            productPlacement: 'Upper two-thirds positioning for mobile viewing',
            negativeSpace: 'Mobile story appropriate background treatment',
            visualHierarchy: 'Quick visual impact for story consumption'
          },
          technicalSpecs: {
            resolution: 'Mobile story optimized',
            aspectRatio: '9:16 vertical format',
            focusPoints: ['Product prominent in vertical frame'],
            depthOfField: 'Mobile appropriate focus (f/4-f/6.3 equivalent)',
            colorSpace: 'sRGB for mobile consumption',
            exposureGuidance: 'Mobile-optimized bright, punchy exposure'
          },
          qualityRequirements: {
            sharpnessLevel: 'commercial',
            noiseLevel: 'low',
            colorAccuracy: 'high',
            dynamicRange: 'compressed'
          },
          outputOptimization: {
            primaryUsage: 'Instagram/Facebook stories and vertical content',
            platformRequirements: ['Instagram Stories', 'Facebook Stories', 'TikTok', 'Snapchat'],
            scalabilityNeeds: ['Mobile optimization', 'Vertical format scaling'],
            deliveryFormat: 'Vertical mobile-first with engagement optimization'
          }
        };
        
      case 'detail':
        return {
          composition: {
            framing: 'Macro detail focus highlighting craftsmanship',
            productPlacement: 'Close-up positioning to show construction quality',
            negativeSpace: 'Minimal, focused on material and construction details',
            visualHierarchy: 'Material texture and quality indicators as focus'
          },
          technicalSpecs: {
            resolution: 'Detail-capture high resolution',
            aspectRatio: '1:1 square detail format',
            focusPoints: ['Sharp material details', 'Construction quality visible'],
            depthOfField: 'Macro-style focus (f/8-f/16 equivalent)',
            colorSpace: 'sRGB with detail enhancement',
            exposureGuidance: 'Detail-optimized lighting to show texture and materials'
          },
          qualityRequirements: {
            sharpnessLevel: 'detail',
            noiseLevel: 'ultra_low',
            colorAccuracy: 'critical',
            dynamicRange: 'extended'
          },
          outputOptimization: {
            primaryUsage: 'Quality demonstration and material showcase',
            platformRequirements: ['Product detail pages', 'Quality documentation', 'Material portfolios'],
            scalabilityNeeds: ['High zoom capability', 'Detail preservation'],
            deliveryFormat: 'High resolution with material detail preservation'
          }
        };
        
      default:
        return this.getContextStandards('packshot');
    }
  }

  /**
   * Build core prompt architecture
   */
  private static buildCorePrompt(
    specs: ProductSpecs,
    contextPreset: ContextPreset,
    productIntel: ProductIntelligence,
    standards: ContextPhotographyStandards
  ): string {
    const contextDescription = this.getContextDescription(contextPreset);
    
    return `📸 PROFESSIONAL ${contextPreset.toUpperCase()} FURNITURE PHOTOGRAPHY

PRODUCT SPECIFICATION:
• Product: ${specs.productName}
• Type: ${specs.productType} (Category: ${productIntel.category})
• Materials: ${specs.materials}
${specs.dimensions ? `• Dimensions: ${specs.dimensions.width}×${specs.dimensions.height}×${specs.dimensions.depth}cm` : ''}
${specs.additionalSpecs ? `• Additional Details: ${specs.additionalSpecs}` : ''}

INTELLIGENT PLACEMENT & SCALE:
${this.buildPlacementInstructions(productIntel)}

MATERIAL INTELLIGENCE:
${this.buildMaterialInstructions(productIntel.materialProfile)}

PHOTOGRAPHY STANDARDS:
• Context: ${contextDescription}
• Composition: ${standards.composition.framing}
• Product Placement: ${standards.composition.productPlacement}
• Visual Hierarchy: ${standards.composition.visualHierarchy}
• Technical Quality: ${standards.qualityRequirements.sharpnessLevel} grade
• Focus: ${standards.technicalSpecs.focusPoints.join(', ')}
• Color Accuracy: ${standards.qualityRequirements.colorAccuracy} precision

LIGHTING SPECIFICATION:
• Primary Angle: ${productIntel.lightingRequirements.primaryAngle}° from camera axis
• Fill Ratio: ${Math.round(productIntel.lightingRequirements.fillRatio * 100)}% of key light intensity
• Shadow Style: ${productIntel.lightingRequirements.shadowStyle} shadows
• Color Temperature: ${productIntel.lightingRequirements.colorTemperature}
${productIntel.lightingRequirements.specialRequirements.length > 0 ? 
  `• Special Requirements: ${productIntel.lightingRequirements.specialRequirements.join(', ')}` : ''}`;
  }

  /**
   * Build placement instructions based on product intelligence
   */
  private static buildPlacementInstructions(productIntel: ProductIntelligence): string {
    const placement = productIntel.placementType;
    const elements = productIntel.scaleGuidance.proportionalElements;
    
    let instructions = `• Placement Type: ${placement.replace('_', ' ')} positioning\n`;
    instructions += `• Scale Elements: ${elements.join(', ')}\n`;
    instructions += `• ${productIntel.scaleGuidance.dimensionalContext}\n`;
    
    if (productIntel.scaleGuidance.humanReference) {
      instructions += `• Include subtle human scale references for size context\n`;
    }
    
    // Add specific placement guidance
    switch (placement) {
      case 'wall_mounted':
        instructions += `• CRITICAL: Show proper wall mounting - NO floor contact\n`;
        instructions += `• Display mounting hardware and wall attachment system\n`;
        instructions += `• Maintain appropriate clearance beneath the piece\n`;
        break;
        
      case 'floor_standing':
        instructions += `• Show stable floor contact with all support points\n`;
        instructions += `• Maintain appropriate clearance from walls for access\n`;
        break;
        
      case 'ceiling_mounted':
        instructions += `• Show ceiling attachment point and suspension system\n`;
        instructions += `• Display appropriate hanging height and clearances\n`;
        break;
        
      case 'tabletop':
        instructions += `• Show placement on appropriate surface with stability\n`;
        instructions += `• Ensure proportional relationship to supporting surface\n`;
        break;
    }
    
    return instructions;
  }

  /**
   * Build material-specific instructions
   */
  private static buildMaterialInstructions(materialProfile: MaterialProfile): string {
    let instructions = `• Primary Material: ${materialProfile.primary} with ${materialProfile.reflectanceLevel} finish\n`;
    
    if (materialProfile.secondary.length > 0) {
      instructions += `• Secondary Materials: ${materialProfile.secondary.join(', ')}\n`;
    }
    
    instructions += `• Texture Complexity: ${materialProfile.textureComplexity} detail level required\n`;
    instructions += `• Lighting Intensity: ${materialProfile.requiredLighting} lighting approach\n`;
    
    // Add material-specific guidance
    switch (materialProfile.primary) {
      case 'wood':
        instructions += `• Show natural wood grain patterns and authentic color undertones\n`;
        instructions += `• Emphasize surface texture and finish quality\n`;
        break;
        
      case 'metal':
        instructions += `• Display metal surface quality and finish consistency\n`;
        instructions += `• Show appropriate reflections without distracting hotspots\n`;
        break;
        
      case 'fabric':
        instructions += `• Reveal fabric weave pattern and texture detail\n`;
        instructions += `• Use directional lighting to emphasize textile characteristics\n`;
        break;
        
      case 'leather':
        instructions += `• Show leather grain texture and natural characteristics\n`;
        instructions += `• Display surface quality and finish authenticity\n`;
        break;
        
      case 'glass':
        instructions += `• Control reflections and transparency for clarity\n`;
        instructions += `• Show glass quality without distracting glare patterns\n`;
        break;
    }
    
    return instructions;
  }

  /**
   * Get context description
   */
  private static getContextDescription(contextPreset: ContextPreset): string {
    const descriptions = {
      packshot: 'Clean commercial packshot on neutral background',
      lifestyle: 'Realistic lifestyle scene in appropriate interior environment',
      hero: 'Dramatic hero presentation for premium marketing applications',
      social_media_square: 'Social media optimized with engagement appeal',
      social_media_story: 'Vertical mobile story format with immediate visual impact',
      detail: 'Close-up craftsmanship showcase highlighting quality and materials'
    };
    
    return descriptions[contextPreset];
  }

  /**
   * Integrate UI settings into prompt
   */
  private static integrateSettings(
    corePrompt: string,
    settings: UiSettings
  ): string {
    let settingsPrompt = corePrompt + '\n\nUSER CONFIGURATION:\n';
    
    settingsPrompt += `• Background Style: ${settings.backgroundStyle}\n`;
    settingsPrompt += `• Product Position: ${settings.productPosition}\n`;
    settingsPrompt += `• Lighting Preference: ${settings.lighting.replace('_', ' ')}\n`;
    settingsPrompt += `• Quality Level: ${settings.quality}\n`;
    
    if (settings.reservedTextZone) {
      settingsPrompt += `• Reserved Text Zone: Keep ${settings.reservedTextZone} area clear for text overlay\n`;
    }
    
    if (settings.props.length > 0) {
      settingsPrompt += `• Approved Props: ${settings.props.join(', ')}\n`;
    }
    
    if (settings.strictMode) {
      settingsPrompt += `• Strict Mode: Exact product fidelity required - no creative liberties\n`;
    }
    
    return settingsPrompt;
  }

  /**
   * Add multimodal instructions for reference images
   */
  private static addMultimodalInstructions(
    prompt: string,
    multimodalContext?: string[]
  ): string {
    if (!multimodalContext || multimodalContext.length === 0) {
      return prompt;
    }
    
    let multimodalPrompt = prompt + '\n\nMULTIMODAL REFERENCE ANALYSIS:\n';
    multimodalPrompt += '• Use the provided reference images to understand:\n';
    multimodalPrompt += '  - Exact product shape, proportions, and design details\n';
    multimodalPrompt += '  - Accurate material colors, textures, and finishes\n';
    multimodalPrompt += '  - Authentic hardware, joints, and construction elements\n';
    multimodalPrompt += '  - Proper scale relationships and dimensional accuracy\n';
    multimodalPrompt += '  - Brand-specific design characteristics and styling\n';
    
    multimodalPrompt += '\n• CRITICAL: Maintain complete visual consistency with reference images\n';
    multimodalPrompt += '• Preserve all product details visible in the reference photos\n';
    multimodalPrompt += '• Match colors, materials, and proportions exactly as shown\n';
    multimodalPrompt += '• Use references to inform placement, scale, and contextual positioning\n';
    
    return multimodalPrompt;
  }

  /**
   * Apply quality assurance standards
   */
  private static applyQualityAssurance(
    prompt: string,
    contextPreset: ContextPreset,
    productIntel: ProductIntelligence
  ): string {
    let qaPrompt = prompt + '\n\nQUALITY ASSURANCE REQUIREMENTS:\n';
    
    // Context-specific quality standards
    const standards = this.getContextStandards(contextPreset);
    
    qaPrompt += `• Resolution Quality: ${standards.qualityRequirements.sharpnessLevel} grade\n`;
    qaPrompt += `• Noise Level: ${standards.qualityRequirements.noiseLevel}\n`;
    qaPrompt += `• Color Accuracy: ${standards.qualityRequirements.colorAccuracy} precision\n`;
    qaPrompt += `• Dynamic Range: ${standards.qualityRequirements.dynamicRange}\n`;
    
    // Professional photography standards
    qaPrompt += '\n• PROFESSIONAL STANDARDS CHECKLIST:\n';
    qaPrompt += '  ✓ Sharp focus across all critical product areas\n';
    qaPrompt += '  ✓ Accurate color reproduction matching real-world appearance\n';
    qaPrompt += '  ✓ Appropriate contrast and exposure for material visibility\n';
    qaPrompt += '  ✓ Clean composition without distracting elements\n';
    qaPrompt += '  ✓ Professional lighting that enhances product appeal\n';
    qaPrompt += '  ✓ Realistic scale and proportions appropriate for product type\n';
    
    // Material-specific quality checks
    if (productIntel.materialProfile.textureComplexity !== 'simple') {
      qaPrompt += '  ✓ Visible material texture and surface detail\n';
    }
    
    if (productIntel.materialProfile.reflectanceLevel !== 'matte') {
      qaPrompt += '  ✓ Controlled reflections that enhance rather than distract\n';
    }
    
    return qaPrompt;
  }

  /**
   * Enforce constraints and prohibitions
   */
  private static enforceConstraints(
    prompt: string,
    contextPreset: ContextPreset,
    productIntel: ProductIntelligence,
    settings: UiSettings
  ): string {
    let constraintPrompt = prompt + '\n\n🚫 ABSOLUTE CONSTRAINTS - ZERO TOLERANCE:\n';
    
    // Universal constraints
    constraintPrompt += '• NO text, labels, price tags, model numbers, or watermarks\n';
    constraintPrompt += '• NO logos unless they are integral parts of the actual product\n';
    constraintPrompt += '• NO duplicate or multiple instances of the same product\n';
    constraintPrompt += '• NO unrealistic scaling or proportional distortions\n';
    constraintPrompt += '• NO amateur photography aesthetics or consumer-grade quality\n';
    constraintPrompt += '• NO over-saturation, artificial colors, or non-realistic appearance\n';
    
    // Placement-specific constraints
    if (productIntel.placementType === 'wall_mounted') {
      constraintPrompt += '• ABSOLUTELY NO floor contact for wall-mounted furniture\n';
      constraintPrompt += '• NO legs, supports, or bases touching the ground\n';
      constraintPrompt += '• NO free-standing placement of wall-mounted items\n';
    }
    
    // Context-specific constraints
    switch (contextPreset) {
      case 'packshot':
        constraintPrompt += '• NO environmental elements or lifestyle props\n';
        constraintPrompt += '• NO competing visual elements in the frame\n';
        break;
        
      case 'hero':
        if (settings.reservedTextZone) {
          constraintPrompt += `• KEEP ${settings.reservedTextZone} zone completely clear for text\n`;
        }
        constraintPrompt += '• NO text or graphics in the image itself\n';
        break;
        
      case 'lifestyle':
        constraintPrompt += '• NO unrealistic or overly staged environmental setups\n';
        constraintPrompt += '• NO competing furniture that distracts from the main product\n';
        break;
        
      case 'detail':
        constraintPrompt += '• NO wide-angle shots or distant perspectives\n';
        constraintPrompt += '• NO loss of material detail or texture clarity\n';
        break;
    }
    
    // Material-specific constraints
    if (productIntel.materialProfile.reflectanceLevel === 'gloss' || 
        productIntel.materialProfile.reflectanceLevel === 'mirror') {
      constraintPrompt += '• NO harsh reflections or distracting hotspots\n';
      constraintPrompt += '• NO loss of surface detail due to glare\n';
    }
    
    // Strict mode additional constraints
    if (settings.strictMode) {
      constraintPrompt += '\n• STRICT MODE ACTIVE - EXACT FIDELITY REQUIRED:\n';
      constraintPrompt += '  - Zero creative interpretation of product design\n';
      constraintPrompt += '  - Exact color matching to specified materials\n';
      constraintPrompt += '  - Precise dimensional relationships as specified\n';
      constraintPrompt += '  - No stylistic modifications or artistic interpretation\n';
    }
    
    return constraintPrompt;
  }

  /**
   * Determine quality level from settings
   */
  private static determineQualityLevel(quality: 'high' | 'medium' | 'low'): 'enterprise' | 'commercial' | 'standard' {
    switch (quality) {
      case 'high':
        return 'enterprise';
      case 'medium':
        return 'commercial';
      case 'low':
        return 'standard';
    }
  }

  /**
   * Get applied constraints list
   */
  private static getAppliedConstraints(
    contextPreset: ContextPreset,
    productIntel: ProductIntelligence
  ): string[] {
    const constraints = ['No text/labels', 'Professional quality', 'Accurate scaling'];
    
    if (productIntel.placementType === 'wall_mounted') {
      constraints.push('Proper wall mounting');
    }
    
    if (contextPreset === 'hero') {
      constraints.push('Text zone preservation');
    }
    
    return constraints;
  }
}

/**
 * CONVENIENCE FUNCTIONS FOR EASY INTEGRATION
 */

/**
 * Generate prompt for direct use in API routes
 */
export function generateGeminiPrompt(
  specs: ProductSpecs,
  contextPreset: ContextPreset,
  settings: UiSettings,
  referenceImages?: string[]
): string {
  const result = GeminiPromptEngine.generatePrompt(
    specs,
    contextPreset,
    settings,
    referenceImages
  );
  
  return result.prompt;
}

/**
 * Generate prompt with metadata for advanced use cases
 */
export function generateGeminiPromptWithMetadata(
  specs: ProductSpecs,
  contextPreset: ContextPreset,
  settings: UiSettings,
  referenceImages?: string[]
): PromptEngineResult {
  return GeminiPromptEngine.generatePrompt(
    specs,
    contextPreset,
    settings,
    referenceImages
  );
}

/**
 * Validate prompt for Gemini API compatibility
 */
export function validateGeminiPrompt(prompt: string): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues = [];
  const recommendations = [];
  
  if (prompt.length > 8000) {
    issues.push('Prompt exceeds recommended length');
    recommendations.push('Consider reducing detail level or splitting into multiple requests');
  }
  
  if (!prompt.includes('PROFESSIONAL') && !prompt.includes('QUALITY')) {
    recommendations.push('Add explicit quality requirements for better results');
  }
  
  if (!prompt.includes('CONSTRAINTS') && !prompt.includes('NO ')) {
    recommendations.push('Add constraint section to prevent unwanted elements');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}