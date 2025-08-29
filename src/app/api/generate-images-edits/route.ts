import { NextRequest, NextResponse } from "next/server";
import { ProductConfiguration, ContextPreset, UiSettings, ProductProfile, getFieldValue } from "@/lib/types";
import { 
  editMultipleImagesWithGemini,
  fileToBase64Gemini
} from "@/lib/gemini-api";

interface GenerationParams {
  contextPreset: ContextPreset;
  variations: number;
  quality: 'high' | 'medium' | 'low';
}

// DALL-E-3 size mappings for images.generate
const getGptImageSize = (contextPreset: ContextPreset): "1024x1024" | "1024x1536" | "1536x1024" => {
  switch (contextPreset) {
    case 'story':
      return "1024x1536"; // Vertical for stories
    case 'hero':
    case 'lifestyle':
      return "1536x1024"; // Horizontal for banners
    case 'packshot':
    case 'instagram':
    case 'detail':
    default:
      return "1024x1024"; // Square for social media
  }
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    const formData = await request.formData();
    
    // Get product configuration
    const configStr = formData.get("configuration") as string;
    if (!configStr) {
      return NextResponse.json({ error: "No product configuration provided" }, { status: 400 });
    }

    let productConfig: ProductConfiguration;
    try {
      productConfig = JSON.parse(configStr);
    } catch {
      return NextResponse.json({ error: "Invalid configuration JSON" }, { status: 400 });
    }

    // Get generation parameters
    const paramsStr = formData.get("generationParams") as string;
    let generationParams: GenerationParams;
    try {
      generationParams = paramsStr ? JSON.parse(paramsStr) : {
        contextPreset: productConfig.uiSettings.contextPreset,
        variations: productConfig.uiSettings.variations,
        quality: productConfig.uiSettings.quality
      };
    } catch {
      return NextResponse.json({ error: "Invalid generation parameters" }, { status: 400 });
    }

    // Get primary reference image
    const primaryImageFile = formData.get("primaryImage") as File;
    if (!primaryImageFile) {
      return NextResponse.json({ 
        error: "No primary reference image provided. This endpoint requires a reference image for Gemini image editing." 
      }, { status: 400 });
    }

    // Validate that we have product analysis
    if (!productConfig.productImages.fusedProfile) {
      return NextResponse.json({ 
        error: "No product analysis found. Please analyze your product images first." 
      }, { status: 400 });
    }

    const profile = productConfig.productImages.fusedProfile;
    const settings = productConfig.uiSettings;

    console.log(`Generating ${generationParams.variations} ${generationParams.contextPreset} images using Gemini image editing`);
    console.log(`Primary image: ${primaryImageFile.name}, size: ${primaryImageFile.size} bytes`);
    console.log(`Product: ${productConfig.productImages.productName}`);

    // Generate JSON profile for direct inclusion in prompt
    const jsonProfile = generateStructuredJsonProfile(profile, settings, generationParams.contextPreset);
    
    // Check for placement type and add intelligent placement guidance
    const placementType = profile.placementType ? getFieldValue(profile.placementType) : 'floor_standing';
    const productType = String(profile.type || '').toLowerCase();
    
    // Build placement guidance prefix
    let placementPrefix = '';
    if (placementType === 'wall_mounted') {
      if (productType.includes('desk') || productType.includes('workstation')) {
        placementPrefix = `📐 PLACEMENT: Wall-mounted desk at ergonomic height (72-76cm) with proper mounting hardware visible. `;
      } else {
        placementPrefix = `📐 PLACEMENT: Wall-mounted furniture with appropriate mounting system and realistic clearances. `;
      }
    } else if (placementType === 'floor_standing') {
      placementPrefix = `📐 PLACEMENT: Floor-standing furniture positioned naturally with proper floor contact and room placement. `;
    }
    
    // Build the exact prompt structure from your working example
    const contextDescription = getContextDescription(generationParams.contextPreset);
    const prompt = `${placementPrefix}Create a ${contextDescription} image for our ecommerce website of our main product in the images and follow strictly the instructions included in the json profile below: ${JSON.stringify(jsonProfile)}`;

    console.log(`Prompt length: ${prompt.length} characters`);
    console.log(`JSON profile keys: ${Object.keys(jsonProfile).join(', ')}`);
    
    // Convert primary image to base64 for Gemini API
    const primaryImageBase64Data = await fileToBase64Gemini(primaryImageFile);
    const primaryImageDataUrl = `data:${primaryImageBase64Data.mimeType};base64,${primaryImageBase64Data.data}`;
    
    // Generate images using Gemini image editing
    const variations = await editMultipleImagesWithGemini(
      primaryImageDataUrl,
      prompt,
      generationParams.variations,
      generationParams.contextPreset
    );

    if (variations.length === 0) {
      return NextResponse.json({
        error: "All image generations failed",
        details: "No successful variations were generated using Gemini image editing"
      }, { status: 500 });
    }

    const result = {
      productConfigId: productConfig.id,
      productName: productConfig.productImages.productName,
      contextPreset: generationParams.contextPreset,
      variations,
      generationDetails: {
        sourceImageCount: productConfig.productImages.images?.length || 0,
        profileSource: 'gpt-4o-multi-image-analysis',
        prompt: prompt,
        promptLength: prompt.length,
        jsonProfile: jsonProfile,
        model: 'gemini-2.5-flash-image-preview',
        generationMethod: 'image-editing-with-json-profile',
        referenceImageUsed: true,
        primaryImageName: primaryImageFile.name,
        primaryImageSize: primaryImageFile.size,
        successfulVariations: variations.length,
        requestedVariations: generationParams.variations,
      }
    };

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        productName: productConfig.productImages.productName,
        contextPreset: generationParams.contextPreset,
        variationsGenerated: variations.length,
        model: 'gemini-2.5-flash-image-preview',
        approach: 'reference-based-with-json-profile',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Images editing generation error:", error);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Enhanced error handling for Gemini API issues
    let userError = "Unknown error occurred during generation";
    let statusCode = 500;
    let additionalInfo = {};
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      
      // Parse Gemini API error from error message
      if (error.message.includes('Gemini API error:')) {
        console.error('Gemini API Error detected:', error.message);
        
        // Handle generic Gemini API errors
        statusCode = 500;
        userError = "Gemini API error occurred";
        additionalInfo = {
          issue: "The image or prompt was not accepted by the Gemini API",
          solution: "Check that the reference image is valid and the prompt meets API requirements",
          geminiError: error.message
        };
      }
      
      if (userError === "Unknown error occurred during generation") {
        userError = error.message;
      }
    }
    
    return NextResponse.json({
      error: userError,
      details: error instanceof Error ? error.stack : undefined,
      approach: "gemini image editing with reference image and JSON profile",
      ...additionalInfo
    }, { status: statusCode });
  }
}

function getContextDescription(contextPreset: ContextPreset): string {
  switch (contextPreset) {
    case 'packshot':
      return 'professional product packshot';
    case 'lifestyle':
      return 'lifestyle';
    case 'hero':
      return 'hero banner';
    case 'instagram':
      return 'Instagram post';
    case 'story':
      return 'Instagram story';
    case 'detail':
      return 'detail shot';
    default:
      return 'product';
  }
}

function generateStructuredJsonProfile(profile: ProductProfile, settings: UiSettings, contextPreset: ContextPreset) {
  // Extract key information from the analyzed product profile
  const productData = {
    type: getFieldValue(profile.type) || 'furniture',
    name: `${getFieldValue(profile.style) || 'modern'} ${getFieldValue(profile.type) || 'furniture'}`,
    materials: getFieldValue(profile.materials) || 'mixed materials',
    color: getFieldValue(profile.detectedColor) || 'neutral',
    style: getFieldValue(profile.style) || 'modern',
    features: Array.isArray(getFieldValue(profile.features)) 
      ? (getFieldValue(profile.features) as string[]).map((f: string) => ({ name: f, importance: 'medium' as const }))
      : []
  };

  // Get dimensions if available
  const dimensions = profile.realDimensions;
  
  // Ensure dimensions have unit property
  if (dimensions && !('unit' in dimensions)) {
    (dimensions as { width: number; height: number; depth: number; unit?: string }).unit = 'cm';
  }

  // Context-specific requirements
  const contextRequirements = getContextSpecificJsonRequirements(contextPreset, settings);

  // Build comprehensive JSON profile following your working example structure
  const jsonProfile = {
    meta: {
      format: contextPreset,
      platform: getContextPlatform(contextPreset),
      use_case: "ecommerce_product_image",
      generated_at: new Date().toISOString(),
      version: "2.0",
      generation_method: "images_edits_with_reference"
    },
    product: {
      name: productData.name,
      type: productData.type,
      materials: productData.materials,
      primary_color: productData.color,
      style: productData.style,
      dimensions: dimensions ? {
        width: dimensions.width,
        height: dimensions.height,
        depth: dimensions.depth,
        unit: (dimensions as { width: number; height: number; depth: number; unit?: string }).unit || 'cm'
      } : null,
      key_features: productData.features.filter(f => f.importance === 'medium').map(f => f.name),
      all_features: productData.features
    },
    visual_requirements: {
      context_preset: contextPreset,
      background_style: settings.backgroundStyle,
      lighting_setup: settings.lighting.replace('_', ' '),
      product_position: settings.productPosition,
      image_dimensions: getGptImageSize(contextPreset),
      quality_level: settings.quality,
      strict_mode: settings.strictMode,
      props_allowed: settings.props || [],
      reserved_text_zone: settings.reservedTextZone || null
    },
    photography_specs: profile.textToImagePrompts?.photographySpecs || {
      camera_angle: "Professional three-quarter view",
      lighting_setup: "Professional studio lighting with soft shadows",
      depth_of_field: "Product in sharp focus with appropriate background blur",
      composition: "Balanced composition following rule of thirds"
    },
    material_details: profile.textToImagePrompts?.visualDetails || {
      material_textures: `High-quality ${productData.materials} with realistic texture rendering`,
      color_accuracy: `Accurate ${productData.color} color representation`,
      hardware_details: "Detailed hardware elements and connections",
      surface_finishes: "Realistic surface finishes and material properties"
    },
    context_specific: contextRequirements,
    output_specifications: {
      format: "PNG",
      quality: settings.quality === 'high' ? 'maximum' : 'high',
      color_profile: "sRGB",
      compression: "lossless",
      background_handling: "auto",
      moderation: "auto"
    },
    constraints: {
      no_text_overlay: settings.strictMode,
      no_watermarks: true,
      no_logos: settings.strictMode,
      maintain_product_fidelity: true,
      respect_aspect_ratio: true,
      commercial_use: true,
      // Placement-specific constraints
      placement_type_adherence: true,
      realistic_mounting_system_display: profile.placementType ? getFieldValue(profile.placementType) === 'wall_mounted' : false,
      proper_floor_contact_for_standing: profile.placementType ? getFieldValue(profile.placementType) === 'floor_standing' : true,
      appropriate_clearances_and_spacing: true,
      professional_interior_design_placement: true
    }
  };

  return jsonProfile;
}

function getContextPlatform(contextPreset: ContextPreset): string {
  switch (contextPreset) {
    case 'instagram':
      return 'instagram';
    case 'story':
      return 'instagram_stories';
    case 'hero':
      return 'website_hero';
    case 'packshot':
      return 'ecommerce_catalog';
    case 'lifestyle':
      return 'marketing_lifestyle';
    case 'detail':
      return 'product_documentation';
    default:
      return 'general_ecommerce';
  }
}

function getContextSpecificJsonRequirements(contextPreset: ContextPreset, settings: UiSettings): Record<string, unknown> {
  const base = {
    background: settings.backgroundStyle,
    lighting: settings.lighting.replace('_', ' '),
    product_position: settings.productPosition,
  };

  switch (contextPreset) {
    case 'packshot':
      return {
        ...base,
        style: "Clean professional product photography",
        background_requirement: "Minimal, non-distracting background",
        lighting_requirement: "Even studio lighting with no harsh shadows",
        composition_requirement: "Product centered, fills appropriate portion of frame",
        focus_requirement: "Product in sharp focus throughout",
        context: "E-commerce catalog presentation",
        placement_requirement: "Position furniture according to its intended placement type with appropriate support systems visible"
      };
      
    case 'lifestyle':
      return {
        ...base,
        style: "Natural lifestyle photography in realistic home setting",
        background_requirement: "Authentic home environment matching product category",
        lighting_requirement: "Natural or warm artificial lighting",
        composition_requirement: "Product integrated naturally into living space",
        focus_requirement: "Product prominent but contextually placed",
        context: "Home lifestyle inspiration"
      };
      
    case 'hero':
      return {
        ...base,
        style: "Premium hero banner with dramatic composition",
        background_requirement: "Premium background suitable for text overlay",
        lighting_requirement: "Dramatic lighting with visual impact",
        composition_requirement: `Product positioned ${settings.productPosition} with negative space`,
        focus_requirement: "Product as primary focal point",
        context: "Website hero banner for marketing",
        text_space: settings.reservedTextZone ? `Reserve ${settings.reservedTextZone} area for text` : "Include space for text overlay"
      };
      
    case 'instagram':
      return {
        ...base,
        style: "Social media optimized square format",
        background_requirement: "Instagram-friendly background with visual appeal",
        lighting_requirement: "Bright, appealing lighting for mobile viewing",
        composition_requirement: "Square composition optimized for Instagram feed",
        focus_requirement: "Thumb-stopping visual appeal",
        context: "Instagram post for social media marketing"
      };
      
    case 'story':
      return {
        ...base,
        style: "Vertical mobile story format",
        background_requirement: "Mobile-optimized background for story format",
        lighting_requirement: "High contrast lighting for mobile screens",
        composition_requirement: "Vertical composition with product in upper portion",
        focus_requirement: "Product clearly visible on mobile devices",
        context: "Instagram/Facebook story for social media"
      };
      
    case 'detail':
      return {
        ...base,
        style: "Extreme close-up detail photography",
        background_requirement: "Minimal background to emphasize details",
        lighting_requirement: "High-key lighting to show material details",
        composition_requirement: "Close-up composition highlighting key details",
        focus_requirement: "Sharp macro-level focus on materials and craftsmanship",
        context: "Product detail documentation"
      };
      
    default:
      return base;
  }
}