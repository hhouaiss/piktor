# Gemini 2.5 Flash Image Prompt Engineering Framework

## Overview

This comprehensive prompt engineering framework transforms your furniture/product photography SaaS into a world-class image generation system. Built specifically for Google's Gemini 2.5 Flash Image model, it eliminates the need for complex AI analysis by embedding intelligent product understanding directly into the prompts.

## 🚀 Key Features

### 1. **Smart Product Intelligence**
- **Automatic Categorization**: Analyzes product types and categorizes into furniture categories (seating, tables, storage, workstations, lighting, etc.)
- **Intelligent Placement**: Determines proper placement (floor-standing, wall-mounted, ceiling-mounted, tabletop) based on product characteristics
- **Material Analysis**: Understands material properties and their lighting/presentation requirements
- **Scale Intelligence**: Provides appropriate proportional context and human-scale references

### 2. **Context-Aware Generation**
Six professionally optimized presets:
- **Packshot**: Clean commercial product photography
- **Lifestyle**: Realistic home/office environments
- **Hero**: Premium banner presentations
- **Instagram**: Social media optimized
- **Story**: Vertical mobile format
- **Detail**: Close-up craftsmanship showcase

### 3. **Multimodal Capabilities**
- **Reference Image Processing**: Seamlessly handles multiple product reference images
- **Consistency Enforcement**: Maintains exact product details across generations
- **Intelligent Fallback**: Gracefully handles scenarios with or without reference images

### 4. **Professional Quality Standards**
- **Photography Standards**: Implements professional commercial photography principles
- **Technical Excellence**: Ensures proper lighting, composition, and technical quality
- **Brand Consistency**: Maintains professional presentation suitable for e-commerce

## 🏗️ Architecture

### Core Components

```typescript
// Main Engine Entry Point
GeminiPromptEngine.generatePrompt(specs, contextPreset, settings, referenceImages?)

// Product Intelligence Analysis
ProductIntelligence {
  category: FurnitureCategory
  placementType: PlacementType
  materialProfile: MaterialProfile
  scaleGuidance: ScaleGuidance
  lightingRequirements: LightingProfile
}

// Context Photography Standards
ContextPhotographyStandards {
  composition: CompositionRules
  technicalSpecs: TechnicalSpecs
  qualityRequirements: QualityRequirements
  outputOptimization: OutputOptimization
}
```

## 📋 Usage Examples

### Basic Usage

```typescript
import { generateGeminiPrompt } from '@/lib/gemini-prompt-engine';

const specs = {
  productName: "Modern Oak Executive Desk",
  productType: "executive desk",
  materials: "solid oak wood, brushed steel hardware",
  dimensions: { width: 180, height: 75, depth: 90 },
  additionalSpecs: "Cable management system, soft-close drawers"
};

const settings = {
  contextPreset: 'lifestyle',
  backgroundStyle: 'minimal',
  productPosition: 'center',
  lighting: 'soft_daylight',
  quality: 'high',
  strictMode: true
};

const prompt = generateGeminiPrompt(specs, 'lifestyle', settings);
```

### Advanced Usage with Metadata

```typescript
import { generateGeminiPromptWithMetadata } from '@/lib/gemini-prompt-engine';

const result = generateGeminiPromptWithMetadata(specs, 'hero', settings);

console.log(`Product Category: ${result.metadata.productIntelligence.category}`);
console.log(`Placement Type: ${result.metadata.productIntelligence.placementType}`);
console.log(`Material Profile: ${result.metadata.productIntelligence.materialProfile.primary}`);
console.log(`Quality Level: ${result.metadata.qualityLevel}`);
console.log(`Applied Constraints: ${result.metadata.constraintsApplied.join(', ')}`);
```

## 🎯 Context Presets Explained

### Packshot
- **Purpose**: Clean product catalog photography
- **Composition**: Centered product with 10-15% padding
- **Background**: Neutral, minimal distractions
- **Technical**: Extended DOF, catalog-grade sharpness
- **Use Cases**: E-commerce listings, product databases, print catalogs

### Lifestyle  
- **Purpose**: Realistic environmental context
- **Composition**: Natural product integration in home/office setting
- **Background**: Appropriate interior environment
- **Technical**: Selective focus, environmental lighting
- **Use Cases**: Marketing materials, website content, social media

### Hero
- **Purpose**: Premium marketing presentations
- **Composition**: Dramatic presentation with text overlay space
- **Background**: High-impact visual treatment
- **Technical**: Ultra-high resolution, dramatic lighting
- **Use Cases**: Website headers, premium marketing, trade shows

### Instagram
- **Purpose**: Social media engagement
- **Composition**: Square format, mobile-optimized
- **Background**: Social-friendly treatment
- **Technical**: Mobile-optimized brightness, engagement appeal
- **Use Cases**: Instagram feed, Facebook posts, social advertising

### Story
- **Purpose**: Vertical mobile content
- **Composition**: 9:16 format, upper-frame product placement
- **Background**: Mobile story appropriate
- **Technical**: High contrast, mobile-optimized
- **Use Cases**: Instagram Stories, TikTok, Snapchat, vertical content

### Detail
- **Purpose**: Craftsmanship and quality demonstration
- **Composition**: Macro-level focus on materials and construction
- **Background**: Minimal, detail-focused
- **Technical**: Ultra-sharp detail, material texture emphasis
- **Use Cases**: Quality documentation, material showcases, detail pages

## 🧠 Product Intelligence System

### Automatic Categorization
The system intelligently categorizes products based on keywords:

```typescript
// Examples of automatic categorization
"executive chair" → seating
"standing desk" → workstations  
"wall-mounted cabinet" → storage (wall_mounted)
"floor lamp" → lighting (floor_standing)
"dining table" → tables (floor_standing)
```

### Smart Placement Detection
Critical for furniture accuracy:

```typescript
// Wall-mounted detection
"wall desk" → wall_mounted (shows mounting hardware, no floor contact)
"floating shelf" → wall_mounted (suspended appearance)

// Floor-standing confirmation  
"dining chair" → floor_standing (proper floor contact, stability)
"coffee table" → floor_standing (appropriate clearances)
```

### Material Intelligence
Understands material properties and lighting requirements:

```typescript
// Material analysis examples
"oak wood, steel" → primary: wood, secondary: [metal], lighting: balanced
"polished chrome, glass" → primary: metal, secondary: [glass], lighting: technical
"fabric upholstery" → primary: fabric, lighting: soft
```

## 📐 Technical Implementation

### Multimodal Integration

```typescript
// In your API route
import { processReferenceImages, generateMultipleImagesWithReferences } from '@/lib/gemini-api';

// Process uploaded images
const referenceImages = await processReferenceImages(uploadedFiles);

// Generate with references
const variations = await generateMultipleImagesWithReferences(
  prompt,
  referenceImages,
  variationCount,
  contextPreset
);
```

### Quality Assurance Built-in

Every prompt includes systematic quality checks:
- Sharp focus validation
- Color accuracy requirements
- Professional lighting standards
- Composition guidelines
- Material texture requirements
- Scale and proportion validation

### Constraint Enforcement

Automatic constraint application prevents common issues:
- Wall-mounted furniture placement errors
- Unrealistic scaling or proportions
- Amateur photography aesthetics
- Unwanted text or labels
- Non-commercial quality output

## 🔧 Configuration Options

### UI Settings Integration

```typescript
interface UiSettings {
  contextPreset: ContextPreset;           // Primary context type
  backgroundStyle: 'plain' | 'minimal' | 'lifestyle' | 'gradient';
  productPosition: 'left' | 'right' | 'center';
  reservedTextZone?: 'left' | 'right' | 'top' | 'bottom';  // For hero images
  props: Array<'plant' | 'lamp' | 'rug' | 'chair' | 'artwork'>;
  lighting: 'soft_daylight' | 'studio_softbox' | 'warm_ambient';
  strictMode: boolean;                    // Exact fidelity enforcement
  quality: 'high' | 'medium' | 'low';    // Output quality level
  variations: 1 | 2 | 3 | 4;             // Number of variations
}
```

### Product Specifications

```typescript
interface ProductSpecs {
  productName: string;                    // Clear, descriptive name
  productType: string;                    // Specific furniture type
  materials: string;                      // Material composition
  dimensions?: {                          // Optional but recommended
    width: number;                        // cm
    height: number;                       // cm
    depth: number;                        // cm
  };
  additionalSpecs?: string;               // Extra specifications
}
```

## 🎨 Prompt Architecture

### Systematic Prompt Structure

1. **Context Header**: Professional photography specification
2. **Product Intelligence**: Smart categorization and placement
3. **Material Analysis**: Intelligent material handling
4. **Photography Standards**: Context-specific requirements
5. **Technical Specifications**: Quality and composition rules
6. **Multimodal Instructions**: Reference image utilization
7. **Quality Assurance**: Professional standards checklist
8. **Constraint Enforcement**: Error prevention system

### Example Generated Prompt Structure

```text
📸 PROFESSIONAL LIFESTYLE FURNITURE PHOTOGRAPHY

PRODUCT SPECIFICATION:
• Product: Modern Oak Executive Desk
• Type: executive desk (Category: workstations)
• Materials: solid oak wood, brushed steel hardware
• Dimensions: 180×75×90cm
• Additional Details: Cable management system, soft-close drawers

INTELLIGENT PLACEMENT & SCALE:
• Placement Type: floor standing positioning
• Scale Elements: floor contact, surface height 72-76cm, ergonomic proportions
• Product dimensions: 180×75×90cm
• Include subtle human scale references for size context
• Show stable floor contact with all support points
• Maintain appropriate clearance from walls for access

MATERIAL INTELLIGENCE:
• Primary Material: wood with matte finish
• Secondary Materials: metal
• Texture Complexity: moderate detail level required
• Lighting Intensity: balanced lighting approach
• Show natural wood grain patterns and authentic color undertones
• Emphasize surface texture and finish quality
• Display metal surface quality and finish consistency
• Show appropriate reflections without distracting hotspots

[... continues with detailed photography standards, quality requirements, and constraints ...]
```

## 🛠️ Advanced Features

### Lighting Intelligence
Each material type gets optimized lighting specifications:
- **Primary Angle**: Calculated based on material reflectance
- **Fill Ratio**: Optimized shadow-to-highlight ratios  
- **Color Temperature**: Material-appropriate lighting color
- **Special Requirements**: Material-specific lighting needs

### Scale Guidance
Intelligent scale and proportion handling:
- **Human Reference**: Adds scale context when needed
- **Proportional Elements**: Key measurement references
- **Viewing Distance**: Optimizes for intended use case
- **Dimensional Context**: Integrates provided measurements

### Quality Levels
Three professional quality tiers:
- **Enterprise**: Maximum quality for premium applications
- **Commercial**: High quality for standard commercial use
- **Standard**: Good quality for basic applications

## 📊 Performance Metrics

The system provides comprehensive generation metadata:

```typescript
interface PromptEngineResult {
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
```

## 🔍 Troubleshooting

### Common Issues and Solutions

**Issue**: Wall-mounted furniture appearing on floor
**Solution**: Enhanced placement detection automatically prevents this

**Issue**: Poor material representation  
**Solution**: Material intelligence system optimizes lighting for each material type

**Issue**: Inconsistent product appearance
**Solution**: Multimodal reference image processing ensures consistency

**Issue**: Non-commercial quality output
**Solution**: Built-in quality assurance and professional photography standards

**Issue**: Unrealistic proportions
**Solution**: Smart scale guidance with human reference integration

## 🔄 Integration Guide

### Step 1: Import the Engine
```typescript
import { generateGeminiPrompt, generateGeminiPromptWithMetadata } from '@/lib/gemini-prompt-engine';
```

### Step 2: Prepare Product Data
```typescript
const specs = createProductSpecs(
  productName,
  productType,
  materials,
  dimensions,
  additionalSpecs
);
```

### Step 3: Configure Settings
```typescript
const settings: UiSettings = {
  contextPreset: 'lifestyle',
  backgroundStyle: 'minimal',
  productPosition: 'center',
  lighting: 'soft_daylight',
  quality: 'high',
  strictMode: true,
  variations: 2
};
```

### Step 4: Generate Prompt
```typescript
const result = generateGeminiPromptWithMetadata(specs, contextPreset, settings);
```

### Step 5: Use with Gemini API
```typescript
const geminiRequest = {
  prompt: result.prompt,
  aspectRatio: getGeminiAspectRatio(contextPreset),
  referenceImages: processedReferenceImages // optional
};

const response = await generateImageWithGemini(geminiRequest);
```

## 📈 Benefits

### For Developers
- **Reduced Complexity**: No need for separate AI analysis steps
- **Consistent Results**: Professional quality guaranteed
- **Easy Integration**: Drop-in replacement for existing prompt systems
- **Comprehensive Logging**: Detailed metadata for debugging and optimization

### For End Users  
- **Professional Quality**: Enterprise-grade furniture photography
- **Accurate Representation**: Smart placement and material handling
- **Context Optimization**: Perfect for intended use case
- **Brand Consistency**: Commercial-standard presentation

### For Business
- **Reduced Costs**: Eliminates need for separate analysis APIs
- **Faster Generation**: Direct prompt-to-image workflow
- **Higher Quality**: Professional photography standards built-in
- **Scalable**: Handles any furniture type or context automatically

## 🔮 Future Enhancements

- **AI-Powered Material Detection**: Computer vision integration for automatic material analysis
- **Brand Style Learning**: Adaptive prompts that learn brand-specific preferences
- **Advanced Lighting Models**: Physics-based lighting simulation
- **Real-time Optimization**: Dynamic prompt adjustment based on generation results
- **Multi-language Support**: International market adaptations

---

This comprehensive prompt engineering framework transforms your furniture photography SaaS into a world-class image generation system, delivering professional results directly from user specifications without complex analysis dependencies.