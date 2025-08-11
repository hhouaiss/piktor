import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ProductConfiguration, GenerationMethod, GenerationSource, ContextPreset, CONTEXT_PRESET_SETTINGS } from "@/components/image-generator/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" 
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

    // Validate that we have a comprehensive profile
    if (!productConfig.productImages.fusedProfile) {
      return NextResponse.json({ error: "Product profile not analyzed. Please complete product specs first." }, { status: 400 });
    }

    const profile = productConfig.productImages.fusedProfile;
    const settings = productConfig.uiSettings;
    const contextPreset = settings.contextPreset;

    // Get the preferred generation method for this context
    const presetSettings = CONTEXT_PRESET_SETTINGS[contextPreset];
    const preferredMethod = presetSettings.preferredMethod;

    console.log(`Generating ${settings.variations} ${contextPreset} variations using ${preferredMethod} method`);

    // Prepare generation requests based on method
    const generationResults = [];
    
    for (let i = 0; i < settings.variations; i++) {
      try {
        let result;
        
        switch (preferredMethod) {
          case 'text-to-image':
            result = await generateTextToImage(profile, settings, contextPreset, i + 1);
            break;
            
          case 'reference-based':
            // Get primary reference image
            const primaryImageFile = formData.get("primaryImage");
            if (!primaryImageFile) {
              console.warn("Reference-based method requested but no primary image provided, falling back to text-to-image");
              result = await generateTextToImage(profile, settings, contextPreset, i + 1);
            } else {
              result = await generateReferenceBased(primaryImageFile, profile, settings, contextPreset, i + 1);
            }
            break;
            
          case 'hybrid':
            // Try reference-based first, fallback to text-to-image
            const hybridImageFile = formData.get("primaryImage");
            if (hybridImageFile) {
              try {
                result = await generateReferenceBased(hybridImageFile, profile, settings, contextPreset, i + 1);
              } catch (referenceError) {
                console.warn("Reference-based generation failed, falling back to text-to-image:", referenceError);
                result = await generateTextToImage(profile, settings, contextPreset, i + 1);
              }
            } else {
              result = await generateTextToImage(profile, settings, contextPreset, i + 1);
            }
            break;
            
          default:
            result = await generateTextToImage(profile, settings, contextPreset, i + 1);
        }
        
        generationResults.push(result);
      } catch (error) {
        console.error(`Error generating variation ${i + 1}:`, error);
        // Continue with other variations even if one fails
        generationResults.push({
          error: error instanceof Error ? error.message : "Unknown generation error",
          variation: i + 1
        });
      }
    }

    // Filter out errors and return successful generations
    const successfulResults = generationResults.filter(result => !result.error);
    const errors = generationResults.filter(result => result.error);

    if (successfulResults.length === 0) {
      return NextResponse.json({
        error: "All image generations failed",
        details: errors,
      }, { status: 500 });
    }

    // Format response similar to the original API
    const variations = successfulResults.map((result, index) => ({
      url: result.url,
      prompt: result.prompt,
      metadata: {
        model: result.generationSource.model,
        timestamp: new Date().toISOString(),
        size: presetSettings.size,
        quality: settings.quality,
        variation: result.variation || index + 1,
        contextPreset: contextPreset,
        generationMethod: result.generationSource.method,
        confidence: result.generationSource.confidence,
        processingTime: result.processingTime
      },
    }));

    const result = {
      productConfigId: productConfig.id,
      productName: productConfig.productImages.productName,
      contextPreset: contextPreset,
      variations,
      generationDetails: {
        primaryImageUsed: formData.get("primaryImage") ? "provided" : "none",
        totalSourceImages: productConfig.productImages.images.length,
        profileSource: 'comprehensive_gpt4o_analysis',
        preferredMethod: preferredMethod,
        successfulGenerations: successfulResults.length,
        failedGenerations: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    };

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        productName: productConfig.productImages.productName,
        contextPreset: contextPreset,
        variationsGenerated: variations.length,
        settings: settings,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Hybrid image generation error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error occurred during hybrid generation",
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

// Generate images using GPT-image-1 (text-to-image)
async function generateTextToImage(
  profile: any,
  settings: any,
  contextPreset: ContextPreset,
  variation: number
): Promise<any> {
  const startTime = Date.now();
  
  // Use the enhanced prompts from the analysis if available
  let prompt = '';
  if (profile.textToImagePrompts) {
    switch (contextPreset) {
      case 'packshot':
        prompt = profile.textToImagePrompts.packshot;
        break;
      case 'lifestyle':
        prompt = profile.textToImagePrompts.lifestyle;
        break;
      default:
        prompt = profile.textToImagePrompts.detailed;
    }
    
    // Enhance prompt with current settings
    prompt = enhancePromptWithSettings(prompt, settings, contextPreset);
  } else {
    // Fallback to building prompt from profile data
    prompt = buildTextToImagePrompt(profile, settings, contextPreset);
  }

  console.log(`Text-to-image prompt (${prompt.length} chars):`, prompt.substring(0, 200) + "...");

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: prompt,
    n: 1,
    size: CONTEXT_PRESET_SETTINGS[contextPreset].size as "1024x1024" | "1536x1024" | "1024x1536",
    quality: "medium" // Use gpt-image-1 quality options: low, medium, high
  });

  const imageData = response.data?.[0];
  if (!imageData?.b64_json) {
    throw new Error("No image data received from OpenAI text-to-image generation");
  }

  return {
    url: `data:image/png;base64,${imageData.b64_json}`,
    prompt: prompt,
    generationSource: {
      method: 'text-to-image' as GenerationMethod,
      model: 'gpt-image-1',
      confidence: 0.8,
      referenceImageUsed: false
    } as GenerationSource,
    variation: variation,
    processingTime: Date.now() - startTime
  };
}

// Generate images using reference-based approach (current images.edit method)
async function generateReferenceBased(
  primaryImageFile: any,
  profile: any,
  settings: any,
  contextPreset: ContextPreset,
  variation: number
): Promise<any> {
  const startTime = Date.now();
  
  // Convert and validate image (reuse existing logic)
  let imageBuffer: Buffer;
  let fileName = "reference-image.png";
  let fileType = "image/png";

  if (primaryImageFile instanceof File) {
    fileName = primaryImageFile.name;
    fileType = primaryImageFile.type;
    imageBuffer = Buffer.from(await primaryImageFile.arrayBuffer());
  } else if (typeof primaryImageFile === 'object' && 'arrayBuffer' in primaryImageFile) {
    const fileObj = primaryImageFile as { name?: string; type?: string; arrayBuffer: () => Promise<ArrayBuffer> };
    fileName = fileObj.name || fileName;
    fileType = fileObj.type || fileType;
    imageBuffer = Buffer.from(await fileObj.arrayBuffer());
  } else {
    throw new Error('Invalid primary image format for reference-based generation');
  }

  // Build prompt for reference-based generation (should be more focused on modifications)
  const prompt = buildReferenceBasedPrompt(profile, settings, contextPreset);
  
  console.log(`Reference-based prompt (${prompt.length} chars):`, prompt.substring(0, 200) + "...");

  // Create proper File object for OpenAI
  const imageFile = new File([imageBuffer], fileName, { type: fileType });

  const response = await openai.images.edit({
    image: imageFile,
    prompt: prompt,
    model: "gpt-image-1", // Use gpt-image-1 for better editing results
    n: 1,
    size: CONTEXT_PRESET_SETTINGS[contextPreset].size as "1024x1024" | "1024x1536" | "1536x1024"
  });

  const imageData = response.data?.[0];
  if (!imageData?.b64_json) {
    throw new Error("No image data received from OpenAI reference-based generation");
  }

  return {
    url: `data:image/png;base64,${imageData.b64_json}`,
    prompt: prompt,
    generationSource: {
      method: 'reference-based' as GenerationMethod,
      model: 'gpt-image-1',
      confidence: 0.9,
      referenceImageUsed: true
    } as GenerationSource,
    variation: variation,
    processingTime: Date.now() - startTime
  };
}

// Build comprehensive text-to-image prompt
function buildTextToImagePrompt(profile: any, settings: any, contextPreset: ContextPreset): string {
  const productType = profile.type?.value || profile.type || 'furniture';
  const materials = Array.isArray(profile.materials) ? profile.materials.join(', ') : 
                   (profile.materials?.value || profile.materials || 'unknown materials');
  const color = profile.colorAnalysis?.name || profile.detectedColor?.value || profile.colorHex || 'neutral';
  const style = profile.style?.value || profile.style || 'modern';
  
  // Get enhanced features if available
  const features = profile.detailedFeatures ? 
    profile.detailedFeatures.filter((f: any) => f.importance === 'high').map((f: any) => f.name).join(', ') :
    (profile.features?.value || profile.features || []).slice(0, 3).join(', ');

  let basePrompt = '';
  
  switch (contextPreset) {
    case 'packshot':
      basePrompt = `Professional product photography of ${productType} made from ${materials} in ${color} color, ${style} style. Clean studio lighting, neutral background, product centered and prominent.`;
      break;
    case 'lifestyle':
      basePrompt = `Lifestyle photography showing ${productType} made from ${materials} in ${color} color, ${style} style, in a realistic modern home setting. Natural lighting, lived-in environment.`;
      break;
    case 'hero':
      basePrompt = `Hero banner image of ${productType} made from ${materials} in ${color} color, ${style} style. Dramatic composition with negative space for text overlay, premium presentation.`;
      break;
    case 'instagram':
      basePrompt = `Instagram-ready photo of ${productType} made from ${materials} in ${color} color, ${style} style. Social media optimized, engaging composition, mobile-friendly.`;
      break;
    case 'story':
      basePrompt = `Vertical story format image of ${productType} made from ${materials} in ${color} color, ${style} style. Mobile-optimized vertical composition.`;
      break;
    default:
      basePrompt = `Professional image of ${productType} made from ${materials} in ${color} color, ${style} style.`;
  }

  if (features) {
    basePrompt += ` Key features: ${features}.`;
  }

  // Add context-specific requirements
  basePrompt += ` ${getContextSpecificRequirements(contextPreset, settings)}`;
  
  // Add quality and style requirements
  basePrompt += ` High-quality commercial photography, photorealistic, professional lighting, sharp focus.`;

  return basePrompt;
}

// Build focused prompt for reference-based generation
function buildReferenceBasedPrompt(profile: any, settings: any, contextPreset: ContextPreset): string {
  let prompt = `Transform this product image for ${contextPreset} context. `;
  
  switch (contextPreset) {
    case 'packshot':
      prompt += 'Clean, professional product shot with neutral background and studio lighting.';
      break;
    case 'lifestyle':
      prompt += 'Place in realistic home environment with natural lighting and contextual props.';
      break;
    case 'hero':
      prompt += 'Create hero banner composition with dramatic lighting and space for text overlay.';
      break;
    case 'instagram':
      prompt += 'Optimize for social media with engaging, mobile-friendly composition.';
      break;
    case 'story':
      prompt += 'Adapt to vertical story format, centered product, mobile-optimized.';
      break;
  }

  prompt += ` Maintain exact product fidelity, ${settings.backgroundStyle} background, ${settings.lighting.replace('_', ' ')} lighting.`;
  
  if (settings.strictMode) {
    prompt += ' No text, labels, or extra objects not specified.';
  }

  return prompt;
}

// Enhance existing prompts with current settings
function enhancePromptWithSettings(basePrompt: string, settings: any, contextPreset: ContextPreset): string {
  let enhanced = basePrompt;
  
  // Add settings-specific enhancements
  enhanced += ` Background: ${settings.backgroundStyle}, lighting: ${settings.lighting.replace('_', ' ')}.`;
  
  if (settings.productPosition && (contextPreset === 'hero' || contextPreset === 'packshot')) {
    enhanced += ` Product positioned ${settings.productPosition}.`;
  }
  
  if (settings.reservedTextZone) {
    enhanced += ` Leave ${settings.reservedTextZone} area clear for text overlay.`;
  }
  
  if (settings.props && settings.props.length > 0) {
    enhanced += ` Include props: ${settings.props.join(', ')}.`;
  }
  
  if (settings.strictMode) {
    enhanced += ' No text, labels, watermarks, or unauthorized objects.';
  }

  return enhanced;
}

// Get context-specific requirements
function getContextSpecificRequirements(contextPreset: ContextPreset, settings: any): string {
  switch (contextPreset) {
    case 'packshot':
      return 'Studio photography setup, minimal distractions, catalog-quality presentation.';
    case 'lifestyle':
      return 'Realistic home environment, natural context, lived-in feeling.';
    case 'hero':
      return `Dramatic composition, negative space ${settings.reservedTextZone || 'right side'} for text, premium appeal.`;
    case 'instagram':
      return 'Social media optimized, thumb-stopping appeal, mobile-friendly composition.';
    case 'story':
      return 'Vertical mobile format, centered product, story-appropriate framing.';
    case 'detail':
      return 'Close-up detail shot, texture focus, material emphasis.';
    default:
      return 'Professional commercial photography standards.';
  }
}