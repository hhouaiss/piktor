import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ProductConfiguration, ContextPreset, TextToImagePrompts, UiSettings } from "@/components/image-generator/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerationParams {
  contextPreset: ContextPreset;
  variations: number;
  quality: 'high' | 'medium' | 'low';
}

// GPT-image-1 size mappings
const getGptImageSize = (contextPreset: ContextPreset): "1024x1024" | "1024x1536" | "1536x1024" => {
  switch (contextPreset) {
    case 'story':
      return "1024x1536"; // Vertical for stories (corrected from 1792)
    case 'hero':
    case 'lifestyle':
      return "1536x1024"; // Horizontal for banners (corrected from 1792)
    case 'packshot':
    case 'instagram':
    case 'detail':
    default:
      return "1024x1024"; // Square for social media
  }
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    const { productConfiguration, generationParams } = await request.json();
    
    if (!productConfiguration) {
      return NextResponse.json({ error: "No product configuration provided" }, { status: 400 });
    }

    const config = productConfiguration as ProductConfiguration;
    const params = generationParams as GenerationParams;

    // Validate that we have enhanced analysis data
    if (!config.productImages.fusedProfile) {
      return NextResponse.json({ 
        error: "No product analysis found. Please analyze your product images first." 
      }, { status: 400 });
    }

    if (!config.productImages.fusedProfile.textToImagePrompts) {
      return NextResponse.json({ 
        error: "Enhanced product analysis required. Please re-analyze your product images with the updated system.",
        debug: {
          hasProfile: !!config.productImages.fusedProfile,
          profileKeys: config.productImages.fusedProfile ? Object.keys(config.productImages.fusedProfile) : [],
          analysisVersion: config.productImages.fusedProfile?.analysisVersion,
        }
      }, { status: 400 });
    }

    if (!config.productImages.fusedProfile.textToImagePrompts.baseDescription) {
      return NextResponse.json({ 
        error: "Incomplete enhanced analysis data. Missing baseDescription. Please re-analyze your product images.",
        debug: {
          hasTextToImagePrompts: !!config.productImages.fusedProfile.textToImagePrompts,
          textToImagePromptsKeys: config.productImages.fusedProfile.textToImagePrompts ? Object.keys(config.productImages.fusedProfile.textToImagePrompts) : [],
        }
      }, { status: 400 });
    }

    const profile = config.productImages.fusedProfile;

    // Build comprehensive prompt for GPT-image-1
    const detailedPrompt = buildGptImagePrompt(
      profile.textToImagePrompts as TextToImagePrompts, 
      params.contextPreset, 
      config.uiSettings,
      profile
    );

    console.log(`Generating ${params.variations} ${params.contextPreset} images using GPT-image-1`);
    console.log(`Prompt length: ${detailedPrompt.length} characters`);
    console.log(`Product: ${config.productImages.productName}`);

    // Note: Removed prompt length validation - using comprehensive prompts for better quality
    console.log(`Using comprehensive prompt with ${detailedPrompt.length} characters for superior image generation`);

    const size = getGptImageSize(params.contextPreset);
    
    console.log(`Generating with comprehensive prompt derived from ${config.productImages.images.length} reference images`);

    // Generate images using GPT-image-1 with text prompts derived from multi-image analysis
    const qualityMapping = {
      'high': 'high' as const,
      'medium': 'medium' as const, 
      'low': 'low' as const
    };
    
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: detailedPrompt,
      n: params.variations,
      size: size,
      quality: qualityMapping[params.quality]
    });

    const variations = (response.data || []).map((imageData, index) => ({
      url: imageData.url || `data:image/png;base64,${imageData.b64_json}`,
      prompt: detailedPrompt,
      metadata: {
        model: "gpt-image-1",
        timestamp: new Date().toISOString(),
        size: size,
        quality: params.quality,
        variation: index + 1,
        contextPreset: params.contextPreset,
        generationMethod: "text-to-image" as const,
        referenceImagesAnalyzed: config.productImages.images.length,
      },
    }));

    const result = {
      productConfigId: config.id,
      productName: config.productImages.productName,
      contextPreset: params.contextPreset,
      variations,
      generationDetails: {
        sourceImageCount: config.productImages.images.length,
        profileSource: 'gpt-4o-multi-image-analysis',
        prompt: detailedPrompt,
        promptLength: detailedPrompt.length,
        model: 'gpt-image-1',
        generationMethod: 'text-to-image',
        referenceImagesAnalyzed: config.productImages.images.length
      }
    };

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        productName: config.productImages.productName,
        contextPreset: params.contextPreset,
        variationsGenerated: variations.length,
        model: 'gpt-image-1',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("GPT-image-1 generation error:", error);
    
    // Enhanced error handling for OpenAI API issues
    let userError = "Unknown error occurred during generation";
    let statusCode = 500;
    let additionalInfo = {};
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
      });
      
      // Check for OpenAI API response errors
      if ('response' in error) {
        const apiError = error as Error & { response?: { status?: number; data?: unknown } };
        console.error('OpenAI API Response:', {
          status: apiError.response?.status,
          data: apiError.response?.data,
        });
        
        if (apiError.response?.status === 400) {
          statusCode = 400;
          userError = "Invalid request to GPT-image-1";
          additionalInfo = {
            issue: "The prompt or parameters were not accepted by GPT-image-1",
            solution: "Try simplifying the prompt or adjusting generation parameters"
          };
        } else if (apiError.response?.status === 429) {
          statusCode = 429;
          userError = "API rate limit exceeded";
          additionalInfo = {
            issue: "Too many requests to OpenAI API",
            solution: "Please wait a moment before trying again"
          };
        }
      }
      
      if (userError === "Unknown error occurred during generation") {
        userError = error.message;
      }
    }
    
    return NextResponse.json({
      error: userError,
      details: error instanceof Error ? error.stack : undefined,
      ...additionalInfo
    }, { status: statusCode });
  }
}

function convertProfileToStructuredDescription(profile: any): string {
  const productData = {
    type: profile.type || 'furniture',
    name: `${profile.style || 'modern'} ${profile.type}`,
    dimensions: profile.estimatedDimensions ? 
      `${profile.estimatedDimensions.width}×${profile.estimatedDimensions.height}×${profile.estimatedDimensions.depth} ${profile.estimatedDimensions.unit}` : 
      'standard proportions',
    material: profile.materials || 'mixed materials',
    color: `${profile.colorName || 'neutral'} (${profile.colorHex || '#ffffff'})`,
    style: profile.style || 'modern',
    features: Array.isArray(profile.features) ? profile.features : (profile.detailedFeatures?.map((f: { name: string }) => f.name) || [])
  };

  return `Product: ${productData.name}
Dimensions: ${productData.dimensions}
Material: ${productData.material}
Color: ${productData.color}
Style: ${productData.style}
Features: ${productData.features.join(', ')}`;
}

function buildGptImagePrompt(
  textPrompts: TextToImagePrompts,
  contextPreset: ContextPreset,
  uiSettings: UiSettings,
  profileData: any
): string {
  const contextPrompt = (contextPreset in textPrompts ? textPrompts[contextPreset] : null) || textPrompts.packshot || "Clean product shot";
  const photographySpecs = textPrompts.photographySpecs || {
    cameraAngle: 'Professional three-quarter view',
    lightingSetup: 'Professional studio lighting',
    depthOfField: 'Product in sharp focus',
    composition: 'Balanced professional composition'
  };
  const visualDetails = textPrompts.visualDetails || {
    materialTextures: 'High-quality materials',
    colorPalette: 'Accurate product colors',
    hardwareDetails: 'Detailed hardware elements',
    proportionalRelationships: 'Correct product proportions'
  };

  // Get structured product description
  const productDescription = convertProfileToStructuredDescription(profileData);

  // Build concise hierarchical prompt for GPT-image-1
  let prompt = `${contextPrompt}

PRODUCT SPECIFICATIONS:
${productDescription}

MATERIALS: ${visualDetails.materialTextures}
COLORS: ${visualDetails.colorPalette}  
CONSTRUCTION: ${visualDetails.hardwareDetails}
PROPORTIONS: ${visualDetails.proportionalRelationships}

PHOTOGRAPHY CONSTRAINTS:
- Camera: ${photographySpecs.cameraAngle}
- Lighting: ${photographySpecs.lightingSetup}
- Focus: ${photographySpecs.depthOfField}
- Composition: ${photographySpecs.composition}

CONTEXT REQUIREMENTS:
- Background: ${uiSettings.backgroundStyle}
- Position: ${uiSettings.productPosition}
- Lighting: ${uiSettings.lighting?.replace('_', ' ')}
- Quality: Professional commercial standard`;

  // Add context-specific constraints
  switch (contextPreset) {
    case 'packshot':
      prompt += `\n\nPACKSHOT CONSTRAINTS:
- Clean background, no distractions
- Studio lighting, sharp detail
- Product as focal point
- E-commerce catalog quality`;
      break;
      
    case 'lifestyle':
      prompt += `\n\nLIFESTYLE CONSTRAINTS:
- Authentic home environment
- Natural lighting, lived-in feel
- Product integrated organically
- Emotional connection`;
      break;
      
    case 'hero':
      prompt += `\n\nHERO CONSTRAINTS:
- Bold dramatic composition
- High-end marketing quality
- Visual impact, premium feel
- Space for text overlay`;
      break;
      
    case 'story':
      prompt += `\n\nSTORY CONSTRAINTS:
- Vertical mobile-optimized
- Eye-catching, vibrant
- Product in upper section
- Social media appeal`;
      break;
      
    case 'instagram':
      prompt += `\n\nINSTAGRAM CONSTRAINTS:
- Square composition
- Feed-optimized aesthetics
- Thumb-stopping appeal
- Contemporary trends`;
      break;
      
    case 'detail':
      prompt += `\n\nDETAIL CONSTRAINTS:
- Extreme close-up focus
- Material quality showcase
- Craftsmanship emphasis
- Technical documentation quality`;
      break;
  }

  // Add quality standards
  prompt += `\n\nQUALITY REQUIREMENTS:
- Photorealistic rendering with accurate materials
- Sharp detail and proper depth of field
- Commercial photography standards
- No artifacts, clean composition`;

  return prompt.trim();
}

// Removed optimizeGptImagePrompt function - we're now using comprehensive prompts without length restrictions