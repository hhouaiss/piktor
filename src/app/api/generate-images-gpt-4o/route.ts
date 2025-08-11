import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ProductConfiguration, ContextPreset } from "@/components/image-generator/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerationParams {
  contextPreset: ContextPreset;
  variations: number;
  quality: 'high' | 'medium' | 'low';
}

// GPT-image-1 size mappings
const getGptImageSize = (contextPreset: ContextPreset): "1024x1024" | "1024x1792" | "1792x1024" => {
  switch (contextPreset) {
    case 'story':
      return "1024x1792"; // Vertical for stories
    case 'hero':
    case 'lifestyle':
      return "1792x1024"; // Horizontal for banners
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
    const textPrompts = profile.textToImagePrompts;

    // Build comprehensive prompt for GPT-image-1
    const detailedPrompt = buildGptImagePrompt(
      textPrompts, 
      params.contextPreset, 
      config.uiSettings
    );

    console.log(`Generating ${params.variations} ${params.contextPreset} images using GPT-image-1`);
    console.log(`Prompt length: ${detailedPrompt.length} characters`);
    console.log(`Product: ${config.productImages.productName}`);

    // Validate prompt length for GPT-image-1 (4000 char limit)
    if (detailedPrompt.length > 4000) {
      const optimizedPrompt = optimizeGptImagePrompt(detailedPrompt, 3900);
      console.log(`Applied prompt optimization: ${detailedPrompt.length} -> ${optimizedPrompt.length} characters`);
      
      return NextResponse.json({
        error: "Prompt too long for GPT-image-1",
        details: `Optimized prompt is ${optimizedPrompt.length} characters. Please simplify product specifications.`,
        optimizedPrompt,
        originalLength: detailedPrompt.length,
        limit: 4000
      }, { status: 400 });
    }

    const size = getGptImageSize(params.contextPreset);
    
    // Generate images using GPT-image-1  
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
      quality: qualityMapping[params.quality] || 'medium',
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
        generationMethod: 'text-to-image'
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

function buildGptImagePrompt(
  textPrompts: any,
  contextPreset: ContextPreset,
  uiSettings: any
): string {
  const baseDescription = textPrompts.baseDescription || "Professional product image";
  const contextPrompt = textPrompts[contextPreset] || textPrompts.packshot || "Clean product shot";
  const photographySpecs = textPrompts.photographySpecs || {};
  const visualDetails = textPrompts.visualDetails || {};

  // Build comprehensive prompt for GPT-image-1
  let prompt = `${contextPrompt}

PRODUCT DETAILS:
${baseDescription}

VISUAL SPECIFICATIONS:
- Materials: ${visualDetails.materialTextures || 'High-quality materials'}
- Colors: ${visualDetails.colorPalette || 'Accurate product colors'}  
- Hardware: ${visualDetails.hardwareDetails || 'Detailed hardware elements'}
- Proportions: ${visualDetails.proportionalRelationships || 'Correct product proportions'}

PHOTOGRAPHY SPECIFICATIONS:
- Camera Angle: ${photographySpecs.cameraAngle || 'Professional three-quarter view'}
- Lighting: ${photographySpecs.lightingSetup || 'Professional studio lighting'}
- Depth of Field: ${photographySpecs.depthOfField || 'Product in sharp focus'}
- Composition: ${photographySpecs.composition || 'Balanced professional composition'}

CONTEXT SETTINGS:
- Background: ${uiSettings.backgroundStyle || 'neutral'}
- Product Position: ${uiSettings.productPosition || 'center'}
- Lighting Style: ${uiSettings.lighting?.replace('_', ' ') || 'soft daylight'}`;

  // Add context-specific requirements
  switch (contextPreset) {
    case 'packshot':
      prompt += `\n\nPACKSHOT REQUIREMENTS:
- Clean, minimal background
- Studio lighting setup
- Product as primary focus
- Commercial photography quality
- No distracting elements`;
      break;
      
    case 'lifestyle':
      prompt += `\n\nLIFESTYLE REQUIREMENTS:
- Realistic home environment
- Natural lighting conditions
- Contextual scene elements
- Lived-in atmosphere
- Product integrated naturally`;
      break;
      
    case 'hero':
      prompt += `\n\nHERO BANNER REQUIREMENTS:
- Dramatic composition
- Professional lighting
- Visual impact suitable for website headers
- Space for text overlay consideration
- High-end commercial appeal`;
      break;
      
    case 'story':
      prompt += `\n\nSTORY FORMAT REQUIREMENTS:
- Vertical mobile-optimized composition
- Eye-catching visual appeal
- Product prominently displayed
- Social media friendly
- Thumb-stopping quality`;
      break;
      
    case 'instagram':
      prompt += `\n\nINSTAGRAM POST REQUIREMENTS:
- Square composition optimized for feeds
- Social media engagement appeal
- Balanced lighting for mobile screens
- Professional yet approachable aesthetic`;
      break;
  }

  // Add quality constraints
  prompt += `\n\nQUALITY REQUIREMENTS:
- Photorealistic rendering
- High detail and clarity
- Professional commercial photography quality
- Accurate product representation
- No text, labels, or watermarks in image`;

  return prompt.trim();
}

function optimizeGptImagePrompt(prompt: string, targetLength: number): string {
  if (prompt.length <= targetLength) return prompt;

  // Progressive optimization for GPT-image-1
  let optimized = prompt;

  // 1. Clean up whitespace
  optimized = optimized
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  if (optimized.length <= targetLength) return optimized;

  // 2. Abbreviate common photography terms
  const abbreviations = {
    'professional': 'pro',
    'photography': 'photo',
    'commercial': 'comm',
    'requirements': 'req',
    'specifications': 'specs',
    'background': 'bg',
    'lighting': 'light',
    'composition': 'comp',
    'product': 'prod'
  };

  for (const [full, abbrev] of Object.entries(abbreviations)) {
    optimized = optimized.replace(new RegExp(full, 'gi'), abbrev);
  }

  if (optimized.length <= targetLength) return optimized;

  // 3. Remove less critical sections
  optimized = optimized
    .replace(/CONTEXT SETTINGS:[\s\S]*?(?=\n[A-Z]|\n\n|$)/, '')
    .replace(/QUALITY REQUIREMENTS:[\s\S]*$/, 'High-quality photorealistic image.');

  if (optimized.length <= targetLength) return optimized;

  // 4. Final truncation
  return optimized.substring(0, targetLength - 3) + '...';
}