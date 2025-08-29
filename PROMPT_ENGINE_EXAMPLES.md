# Gemini Prompt Engine - Real-World Examples

## Overview

This document provides practical examples of the Gemini 2.5 Flash Image Prompt Engine in action, showing how different product types and contexts generate optimized prompts for world-class furniture photography.

## 📋 Example Scenarios

### Scenario 1: Executive Office Furniture (Packshot)

**Input:**
```typescript
const specs = {
  productName: "Executive Leather Office Chair",
  productType: "executive chair",
  materials: "Italian leather, aluminum base, memory foam",
  dimensions: { width: 65, height: 120, depth: 70 },
  additionalSpecs: "Ergonomic lumbar support, 360° swivel, adjustable height"
};

const settings = {
  contextPreset: 'packshot',
  backgroundStyle: 'plain',
  productPosition: 'center',
  lighting: 'studio_softbox',
  quality: 'high',
  strictMode: true,
  variations: 3
};
```

**Generated Prompt Intelligence:**
- **Category**: seating
- **Placement**: floor_standing
- **Material Profile**: leather (primary), metal (secondary)
- **Lighting**: soft lighting with 45° primary angle
- **Quality Level**: enterprise

**Prompt Excerpt:**
```text
📸 PROFESSIONAL PACKSHOT FURNITURE PHOTOGRAPHY

PRODUCT SPECIFICATION:
• Product: Executive Leather Office Chair
• Type: executive chair (Category: seating)
• Materials: Italian leather, aluminum base, memory foam
• Dimensions: 65×120×70cm
• Additional Details: Ergonomic lumbar support, 360° swivel, adjustable height

INTELLIGENT PLACEMENT & SCALE:
• Placement Type: floor standing positioning
• Scale Elements: floor contact, seat height 45-50cm, backrest proportion
• Include subtle human scale references for size context
• Show stable floor contact with all support points

MATERIAL INTELLIGENCE:
• Primary Material: leather with satin finish
• Secondary Materials: metal
• Show leather grain texture and natural characteristics
• Display surface quality and finish authenticity
• Display metal surface quality without distracting hotspots
```

---

### Scenario 2: Wall-Mounted Furniture (Lifestyle)

**Input:**
```typescript
const specs = {
  productName: "Floating Walnut Desk",
  productType: "wall-mounted desk",
  materials: "solid walnut, hidden steel brackets",
  dimensions: { width: 140, height: 5, depth: 40 },
  additionalSpecs: "Minimalist design, cable management slot"
};

const settings = {
  contextPreset: 'lifestyle',
  backgroundStyle: 'lifestyle', 
  productPosition: 'center',
  lighting: 'soft_daylight',
  quality: 'high',
  strictMode: true
};
```

**Generated Prompt Intelligence:**
- **Category**: workstations
- **Placement**: wall_mounted (CRITICAL DETECTION)
- **Material Profile**: wood (primary)
- **Special Constraints**: Zero floor contact enforcement

**Critical Prompt Excerpt:**
```text
INTELLIGENT PLACEMENT & SCALE:
• Placement Type: wall_mounted positioning
• Scale Elements: wall reference, working height 72-76cm, ergonomic proportions
• CRITICAL: Show proper wall mounting - NO floor contact
• Display mounting hardware and wall attachment system
• Maintain appropriate clearance beneath the piece
• Position at standard working height (typically 72-76cm from floor to surface)
• Show appropriate wall mounting hardware (brackets, cleats, or cantilever system)
• Ensure no floor contact - desk should appear to "float"

🚫 ABSOLUTE CONSTRAINTS - ZERO TOLERANCE:
• ABSOLUTELY NO floor contact for wall-mounted furniture
• NO legs, supports, or bases touching the ground
• NO free-standing placement of wall-mounted items
```

---

### Scenario 3: Social Media Optimization (Instagram)

**Input:**
```typescript
const specs = {
  productName: "Mid-Century Modern Sofa",
  productType: "3-seat sofa",
  materials: "bouclé fabric, oak legs",
  dimensions: { width: 220, height: 85, depth: 95 },
  additionalSpecs: "Curved design, button tufting"
};

const settings = {
  contextPreset: 'instagram',
  backgroundStyle: 'minimal',
  productPosition: 'center',
  props: ['plant', 'rug'],
  lighting: 'soft_daylight',
  quality: 'medium',
  strictMode: false
};
```

**Generated Context Standards:**
```text
PHOTOGRAPHY STANDARDS:
• Context: Social media optimized with thumb-stopping appeal
• Composition: Instagram-friendly centered composition  
• Visual Hierarchy: Mobile-optimized visual impact
• Technical Quality: commercial grade
• Focus: Product sharp for mobile viewing, Background complementary
• Color Accuracy: high precision

📷 FURNITURE INSTAGRAM REQUIREMENTS:
- Square 1:1 composition specifically optimized for Instagram feed furniture showcase
- Social media furniture engagement appeal balanced with professional brand consistency
- Mobile-optimized lighting ensuring furniture visibility across various mobile device screens
- Professional furniture brand aesthetic maintaining commercial quality while achieving social media appeal

USER CONFIGURATION:
• Background Style: minimal
• Product Position: center
• Lighting Preference: soft daylight
• Quality Level: medium
• Approved Props: plant, rug
```

---

### Scenario 4: Premium Hero Banner

**Input:**
```typescript
const specs = {
  productName: "Designer Glass Dining Table",
  productType: "dining table",
  materials: "tempered glass top, polished chrome legs",
  dimensions: { width: 200, height: 75, depth: 100 },
  additionalSpecs: "12mm thick glass, sculptural base"
};

const settings = {
  contextPreset: 'hero',
  backgroundStyle: 'gradient',
  productPosition: 'left',
  reservedTextZone: 'right',
  lighting: 'studio_softbox',
  quality: 'high',
  strictMode: true
};
```

**Hero-Specific Intelligence:**
- **Lighting**: Technical lighting (due to glass/chrome materials)
- **Special Requirements**: Polarized lighting, multiple light sources
- **Text Zone**: Right side reserved for overlay

**Key Prompt Sections:**
```text
MATERIAL INTELLIGENCE:
• Primary Material: glass with mirror finish
• Secondary Materials: metal
• Lighting Intensity: technical lighting approach
• Control reflections and transparency for clarity
• Show glass quality without distracting glare patterns
• Display metal surface quality and finish consistency
• Show appropriate reflections without distracting hotspots

LIGHTING SPECIFICATION:
• Primary Angle: 90° from camera axis
• Fill Ratio: 30% of key light intensity
• Shadow Style: technical shadows
• Color Temperature: 5600K
• Special Requirements: Polarized lighting to reduce glare, Multiple light sources to prevent hotspots

🌟 ENTERPRISE FURNITURE HERO BANNER REQUIREMENTS:
- Dramatic architectural composition optimized for website header placement
- Strategic negative space reserved for text overlay integration in right zones
- High-end furniture brand commercial appeal meeting luxury market presentation standards

USER CONFIGURATION:
• Reserved Text Zone: Keep right area clear for text overlay
```

---

### Scenario 5: Detail Craftsmanship Shot

**Input:**
```typescript
const specs = {
  productName: "Handcrafted Wooden Bookshelf",
  productType: "bookshelf",
  materials: "reclaimed oak, brass hardware",
  additionalSpecs: "Dovetail joints, hand-rubbed finish"
};

const settings = {
  contextPreset: 'detail',
  backgroundStyle: 'plain',
  productPosition: 'center',
  lighting: 'studio_softbox',
  quality: 'high',
  strictMode: true
};
```

**Detail-Specific Features:**
```text
🔍 ENTERPRISE FURNITURE DETAIL CRAFTSMANSHIP REQUIREMENTS:
- Macro-level furniture craftsmanship photography showcasing commercial construction quality
- Close-up material texture and construction detail emphasis revealing furniture quality indicators
- Furniture workmanship showcase highlighting enterprise-grade construction methods
- Professional furniture detail photography standards with macro lens clarity

QUALITY ASSURANCE REQUIREMENTS:
• Resolution Quality: detail grade
• Noise Level: ultra_low
• Color Accuracy: critical precision
• Dynamic Range: extended for material detail

• PROFESSIONAL STANDARDS CHECKLIST:
  ✓ Sharp focus across all critical product areas
  ✓ Visible material texture and surface detail
  ✓ Controlled reflections that enhance rather than distract
```

---

### Scenario 6: Mobile Story Format

**Input:**
```typescript
const specs = {
  productName: "Compact Standing Desk",
  productType: "standing desk",
  materials: "bamboo, steel frame",
  dimensions: { width: 120, height: 110, depth: 60 },
  additionalSpecs: "Height adjustable, minimal footprint"
};

const settings = {
  contextPreset: 'story',
  backgroundStyle: 'minimal',
  productPosition: 'center',
  lighting: 'soft_daylight',
  quality: 'medium'
};
```

**Mobile-Optimized Output:**
```text
📱 MOBILE STORY FORMAT FURNITURE REQUIREMENTS:
- Vertical 9:16 mobile-optimized furniture composition designed for Instagram/Facebook story formats
- Eye-catching furniture presentation optimized for mobile viewing and social media engagement
- Product prominently displayed within vertical mobile frame with thumb-stopping visual appeal
- Quick visual impact design suitable for story format consumption patterns

TECHNICAL SPECIFICATIONS:
• Resolution: Mobile story optimized
• Aspect Ratio: 9:16 vertical format
• Focus: Product prominent in vertical frame
• Depth of Field: Mobile appropriate focus (f/4-f/6.3 equivalent)
• Color Space: sRGB for mobile consumption
• Exposure: Mobile-optimized bright, punchy exposure
```

---

## 🎯 Material Intelligence Examples

### Wood Materials
**Input**: `"solid oak, walnut veneer"`
**Analysis**:
- Primary: wood
- Texture Complexity: moderate
- Reflectance: matte
- Lighting: balanced with 30° primary angle
- Special Instructions: "Show natural wood grain patterns and authentic color undertones"

### Metal Materials  
**Input**: `"brushed aluminum, stainless steel"`
**Analysis**:
- Primary: metal
- Texture Complexity: simple
- Reflectance: satin
- Lighting: dramatic with 60° primary angle
- Special Instructions: "Display metal surface quality and finish consistency"

### Glass Materials
**Input**: `"tempered glass, chrome accents"`
**Analysis**:
- Primary: glass
- Texture Complexity: simple
- Reflectance: mirror
- Lighting: technical with 90° primary angle
- Special Requirements: "Polarized lighting to reduce glare, Multiple light sources to prevent hotspots"

### Fabric Materials
**Input**: `"linen upholstery, velvet cushions"`
**Analysis**:
- Primary: fabric
- Texture Complexity: complex
- Reflectance: matte
- Lighting: soft with 45° primary angle
- Special Instructions: "Reveal fabric weave pattern and texture detail"

---

## 🔧 Advanced Configuration Examples

### Strict Mode vs. Creative Mode

**Strict Mode** (strictMode: true):
```text
• STRICT MODE ACTIVE - EXACT FIDELITY REQUIRED:
  - Zero creative interpretation of product design
  - Exact color matching to specified materials
  - Precise dimensional relationships as specified
  - No stylistic modifications or artistic interpretation
```

**Creative Mode** (strictMode: false):
- Allows subtle creative interpretation
- More flexible with styling and presentation
- Maintains product accuracy but allows artistic license

### Reserved Text Zones

**Hero with Right Text Zone**:
```text
• Reserved Text Zone: Keep right area clear for text overlay
• Strategic negative space reserved for text overlay integration in right zones
• NO text or graphics in the image itself
```

**Text Zone Mapping**:
- `left`: Left third reserved for text
- `right`: Right third reserved for text  
- `top`: Upper portion reserved for text
- `bottom`: Lower portion reserved for text

### Props Integration

**With Props** (`props: ['plant', 'lamp', 'rug']`):
```text
• Approved Props: plant, lamp, rug
• Environmental context that elevates furniture appeal while maintaining clear product focus
```

**No Props** (`props: []`):
```text
• Props: none (clean focus on product)
• Minimal distractions - furniture as exclusive focus
```

---

## 📊 Performance Metrics Examples

### Typical Metadata Response
```typescript
{
  prompt: "📸 PROFESSIONAL LIFESTYLE FURNITURE PHOTOGRAPHY...", // Full prompt
  metadata: {
    contextPreset: 'lifestyle',
    productIntelligence: {
      category: 'seating',
      placementType: 'floor_standing',
      materialProfile: {
        primary: 'leather',
        secondary: ['metal'],
        textureComplexity: 'moderate',
        reflectanceLevel: 'satin',
        requiredLighting: 'soft'
      },
      scaleGuidance: {
        humanReference: true,
        proportionalElements: ['floor contact', 'seat height 45-50cm', 'backrest proportion'],
        dimensionalContext: 'Product dimensions: 65×120×70cm',
        viewingDistance: 'medium'
      },
      lightingRequirements: {
        primaryAngle: 45,
        fillRatio: 0.6,
        shadowStyle: 'soft',
        colorTemperature: '5000K',
        specialRequirements: ['Directional lighting to show texture']
      }
    },
    qualityLevel: 'enterprise',
    promptLength: 2847,
    multimodalInstructions: [],
    constraintsApplied: ['No text/labels', 'Professional quality', 'Accurate scaling']
  }
}
```

---

## 🚨 Common Issues and Solutions

### Issue: Incorrect Placement Detection
**Problem**: Floor-standing furniture detected as wall-mounted
**Solution**: Use more specific product type keywords
```typescript
// Instead of:
productType: "desk"

// Use:
productType: "standing desk" // or "floor desk"
```

### Issue: Poor Material Representation  
**Problem**: Materials not rendering correctly
**Solution**: Use specific material descriptors
```typescript
// Instead of:
materials: "wood"

// Use: 
materials: "solid oak wood, natural grain, matte finish"
```

### Issue: Wrong Context Optimization
**Problem**: Output not optimized for intended use
**Solution**: Match context preset to actual usage
```typescript
// For e-commerce listings:
contextPreset: 'packshot'

// For website headers:
contextPreset: 'hero'

// For social media:
contextPreset: 'instagram' // or 'story'
```

---

## 🔄 Integration Patterns

### Basic Integration
```typescript
// Simple prompt generation
const prompt = generateGeminiPrompt(specs, contextPreset, settings);

// Use with Gemini API
const response = await generateImageWithGemini({ prompt, aspectRatio });
```

### Advanced Integration with Metadata
```typescript
// Get full intelligence data
const result = generateGeminiPromptWithMetadata(specs, contextPreset, settings);

// Log intelligence for debugging
console.log('Product Intelligence:', result.metadata.productIntelligence);
console.log('Applied Constraints:', result.metadata.constraintsApplied);

// Use with multimodal generation
if (referenceImages.length > 0) {
  const variations = await generateMultipleImagesWithReferences(
    result.prompt,
    referenceImages,
    variationCount,
    contextPreset
  );
}
```

### Validation and Debugging
```typescript
import { validateGeminiPrompt } from '@/lib/gemini-prompt-engine';

const validation = validateGeminiPrompt(result.prompt);
if (!validation.isValid) {
  console.error('Prompt issues:', validation.issues);
  console.log('Recommendations:', validation.recommendations);
}
```

---

This comprehensive examples guide demonstrates how the Gemini Prompt Engine intelligently adapts to different furniture types, contexts, and use cases while maintaining professional quality standards across all scenarios.