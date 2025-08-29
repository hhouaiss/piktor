import { NextRequest, NextResponse } from "next/server";
import { ProductConfiguration, ContextPreset } from "@/lib/types";
import { buildGptImagePrompt } from "@/lib/prompt-builder";
import { 
  generateMultipleImagesWithGemini, 
  getGeminiAspectRatio
} from "@/lib/gemini-api";

interface GenerationParams {
  contextPreset: ContextPreset;
  variations: number;
  quality: 'high' | 'medium' | 'low';
}



export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file" 
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

    // Build comprehensive prompt for FLUX Kontext Max
    if (!profile.textToImagePrompts) {
      return NextResponse.json({
        error: "Product profile missing text-to-image prompts",
        details: "The product profile needs to be analyzed with GPT-4o to generate enhanced prompts"
      }, { status: 400 });
    }
    
    const detailedPrompt = buildGptImagePrompt(profile.textToImagePrompts, params.contextPreset, config.uiSettings);

    console.log(`Generating ${params.variations} ${params.contextPreset} images using Gemini 2.5 Flash Image`);
    console.log(`Prompt length: ${detailedPrompt.length} characters`);
    console.log(`Product: ${config.productImages.productName}`);

    // Note: Using comprehensive prompts for better quality with Gemini
    console.log(`Using comprehensive prompt with ${detailedPrompt.length} characters for superior image generation`);

    const aspectRatio = getGeminiAspectRatio(params.contextPreset);
    
    console.log(`Generating with comprehensive prompt derived from ${config.productImages.images?.length || 0} reference images`);

    // Generate images using Gemini 2.5 Flash Image
    const geminiRequest = {
      prompt: detailedPrompt,
      aspectRatio: aspectRatio,
    };

    const variations = await generateMultipleImagesWithGemini(
      geminiRequest,
      params.variations,
      params.contextPreset
    );

    const result = {
      productConfigId: config.id,
      productName: config.productImages.productName,
      contextPreset: params.contextPreset,
      variations,
      generationDetails: {
        sourceImageCount: config.productImages.images?.length || 0,
        profileSource: 'gpt-4o-multi-image-analysis',
        prompt: detailedPrompt,
        promptLength: detailedPrompt.length,
        model: 'gemini-2.5-flash-image-preview',
        generationMethod: 'text-to-image',
        referenceImagesAnalyzed: config.productImages.images?.length || 0
      }
    };

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        productName: config.productImages.productName,
        contextPreset: params.contextPreset,
        variationsGenerated: variations.length,
        model: 'gemini-2.5-flash-image-preview',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Gemini generation error:", error);
    
    // Enhanced error handling for Gemini API issues
    let userError = "Unknown error occurred during generation";
    let statusCode = 500;
    let additionalInfo = {};
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
      });
      
      // Check for Gemini API response errors
      if (error.message.includes('Gemini API error:')) {
        statusCode = 500;
        userError = "Gemini API error occurred";
        additionalInfo = {
          issue: "The prompt or parameters were not accepted by Gemini API",
          solution: "Try simplifying the prompt or adjusting generation parameters",
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
      ...additionalInfo
    }, { status: statusCode });
  }
}

/*
function convertProfileToStructuredDescription(profile: { type?: string; style?: string; estimatedDimensions?: { width: number; height: number; depth: number; unit: string }; materials?: string[]; color?: string; features?: string[] }): string {
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
}*/