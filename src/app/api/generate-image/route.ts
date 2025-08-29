import { NextRequest, NextResponse } from "next/server";
import { generateMultipleImagesWithBFL, getAspectRatio } from "@/lib/bfl-api";

interface PromptData {
  product: {
    name: string;
    category: string;
    material: string;
    color: string;
    dimensions: Array<{
      name: string;
      value: string;
      unit: string;
    }>;
    style: string;
    features: Array<{
      name: string;
      description: string;
      location: string;
      visibility: string;
    }>;
  };
  output: {
    type: "packshot" | "lifestyle" | "instagram" | "json_profile";
    background: string;
    lighting: string;
    aspectRatio: string;
    cameraAngle: string;
  };
  branding: {
    aesthetic: string;
    moodKeywords: string[];
  };
  constraints: {
    strict_mode: boolean;
    must_be_wall_mounted: boolean;
    no_furniture_on_floor: boolean;
    no_extra_objects: boolean;
    respect_all_dimensions: boolean;
    no_text_in_image: boolean;
    no_labels: boolean;
  };
  text_overlay?: {
    enabled: boolean;
    content: string;
    position: "top" | "bottom" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
    style: {
      font_family: string;
      font_size: string;
      font_weight: string;
      color: string;
      background_color?: string;
      opacity?: number;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BFL_API_KEY) {
      return NextResponse.json({ 
        error: "BFL API key not configured. Please add BFL_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const promptDataStr = formData.get("promptData") as string;
    const analysisDataStr = formData.get("analysisData") as string;
    const outputType = formData.get("outputType") as string;
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!promptDataStr) {
      return NextResponse.json({ error: "No prompt data provided" }, { status: 400 });
    }

    let promptData: PromptData;
    try {
      promptData = JSON.parse(promptDataStr);
    } catch (parseError) {
      console.error("Failed to parse prompt data:", parseError);
      return NextResponse.json({ error: "Invalid prompt data JSON" }, { status: 400 });
    }

    // Convert image to base64 (for future use if needed)
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = image.type;
    
    // Note: base64 and mimeType are prepared for potential future use
    console.log(`Processing image: ${image.name}, type: ${mimeType}, size: ${bytes.byteLength} bytes`);
    
    // Suppress unused variable warnings by referencing them
    void base64;
    void mimeType;

    // Check if this is a JSON profile request
    if (outputType === "json_profile" || promptData.output.type === "json_profile") {
      const jsonProfile = generateJsonProfile(promptData);
      return NextResponse.json({
        success: true,
        profile: jsonProfile,
        metadata: {
          model: "custom-json-generator",
          timestamp: new Date().toISOString(),
          originalImageName: image.name,
          promptData: promptData,
          analysisData: analysisDataStr ? JSON.parse(analysisDataStr) : null,
        },
      });
    }

    // Generate detailed prompt based on the configuration
    const detailedPrompt = generateDetailedPrompt(promptData);
    
    // BFL API has more flexible prompt length limits
    console.log(`Prompt length: ${detailedPrompt.length} characters`);

    // Generate image using FLUX Kontext Pro
    console.log("Generating image with FLUX Kontext Pro:", detailedPrompt.substring(0, 200) + "...");
    console.log("Prompt length:", detailedPrompt.length);
    // Map aspectRatio to contextPreset for getAspectRatio function
    const contextPreset = promptData.output.type === 'packshot' ? 'packshot' : 
                         promptData.output.type === 'lifestyle' ? 'lifestyle' : 'instagram';
    console.log("Aspect ratio:", getAspectRatio(contextPreset));
    
    const response = await generateMultipleImagesWithBFL({
      prompt: detailedPrompt,
      aspect_ratio: getAspectRatio(contextPreset),
      prompt_upsampling: false,
      safety_tolerance: 2,
      output_format: "jpeg"
    }, 1, contextPreset);
    
    console.log("BFL API response received successfully");
    console.log("Response structure:", {
      hasResults: !!response,
      resultsLength: response?.length,
      firstResult: response?.[0] ? Object.keys(response[0]) : 'no first result'
    });
    
    const firstResult = response?.[0];
    
    if (!firstResult?.url) {
      console.error("No URL found in response:", response);
      console.error("First result details:", firstResult);
      throw new Error("No image data returned from BFL API");
    }
    
    const generatedImageUrl = firstResult.url;
    console.log("Generated image URL:", generatedImageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      prompt: detailedPrompt,
      metadata: {
        model: "flux-kontext-pro",
        timestamp: new Date().toISOString(),
        originalImageName: image.name,
        promptData: promptData,
        analysisData: analysisDataStr ? JSON.parse(analysisDataStr) : null,
      },
    });

  } catch (error) {
    console.error("Image generation error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error occurred during image generation",
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

function generateDetailedPrompt(data: PromptData): string {
  const { product, output, branding, constraints } = data;
  
  // Build dimensions string
  const dimensionsStr = product.dimensions
    .map(d => `${d.name}: ${d.value}${d.unit}`)
    .join(", ");

  // Build features string
  const featuresStr = product.features.length > 0 
    ? product.features.map(f => `${f.name} (${f.location}): ${f.description}`).join("; ")
    : "";

  // Build constraints string
  const constraintsStr = [];
  if (constraints.strict_mode) constraintsStr.push("strict adherence to specifications");
  if (constraints.must_be_wall_mounted) constraintsStr.push("intelligent placement according to furniture type");
  if (constraints.no_furniture_on_floor) constraintsStr.push("no floor-based furniture");
  if (constraints.no_extra_objects) constraintsStr.push("no additional decorative objects");
  if (constraints.respect_all_dimensions) constraintsStr.push("exact dimensional accuracy");
  if (constraints.no_text_in_image) constraintsStr.push("no text or writing visible");
  if (constraints.no_labels) constraintsStr.push("no labels or signage");

  // Generate the prompt based on output type
  let basePrompt = "";
  
  switch (output.type) {
    case "packshot":
      basePrompt = `Create a professional product packshot photograph of a ${product.name}`;
      break;
    case "lifestyle":
      basePrompt = `Create a lifestyle photograph featuring a ${product.name} in a realistic home setting`;
      break;
    case "instagram":
      basePrompt = `Create an Instagram-ready photograph of a ${product.name} with modern, social media appeal`;
      break;
    case "json_profile":
      basePrompt = `Create a structured JSON profile for a ${product.name}`;
      break;
  }

  const prompt = `${basePrompt}.

🏢 PRIMARY PRODUCT IDENTIFICATION:
- PRODUCT TYPE: ${product.category} - ${product.name} (THIS IS THE SPECIFIC FURNITURE BEING GENERATED)
- PLACEMENT CONTEXT: ${constraints.must_be_wall_mounted ? 'WALL-MOUNTED - Must be attached to wall with no floor contact' : 'FREE-STANDING - Should be positioned on floor using interior design principles'}

PRODUCT SPECIFICATIONS:
- Name: ${product.name}
- Category: ${product.category}
- Material: ${product.material}
- Color: ${product.color}
- Style: ${product.style}
- Dimensions: ${dimensionsStr}
${featuresStr ? `- Special Features: ${featuresStr}` : ""}

VISUAL SETTINGS:
- Background: ${output.background}
- Lighting: ${output.lighting}
- Camera Angle: ${output.cameraAngle.replace(/_/g, " ")}
- Aspect Ratio: ${output.aspectRatio}

BRAND AESTHETIC:
- Overall Aesthetic: ${branding.aesthetic}
- Mood Keywords: ${branding.moodKeywords.join(", ")}

TECHNICAL CONSTRAINTS:
${constraintsStr.length > 0 ? `- ${constraintsStr.join(", ")}` : ""}

${constraints.must_be_wall_mounted ? 
  '🚨 WALL-MOUNTED FURNITURE: This furniture MUST be shown mounted to the wall with no floor contact. Show mounting hardware and clear space underneath.' :
  '🏠 FREE-STANDING FURNITURE: Position this furniture naturally using professional interior design principles. Allow proper clearance from walls unless specifically designed for wall placement.'}

Create a high-quality, photorealistic image that emphasizes the furniture's craftsmanship, materials, and design. The image should be professionally lit with attention to detail, texture, and form. Ensure the furniture is the primary focus and matches all specified dimensions and features exactly.`;

  return prompt;
}

// getImageSize function removed - now using getAspectRatio from BFL API

function generateJsonProfile(data: PromptData) {
  const { product, output, branding, text_overlay } = data;
  
  // Generate format-specific configurations
  const formatConfig = output.aspectRatio === "1:1" ? {
    format: "website_square",
    dimensions: { width: 1024, height: 1024 },
    platform: "website",
    use_case: "product_showcase"
  } : {
    format: "instagram_square", 
    dimensions: { width: 1080, height: 1080 },
    platform: "instagram",
    use_case: "social_media"
  };

  // Build the JSON profile
  const profile = {
    meta: {
      format: formatConfig.format,
      platform: formatConfig.platform,
      use_case: formatConfig.use_case,
      generated_at: new Date().toISOString(),
      version: "1.0"
    },
    product: {
      name: product.name,
      category: product.category,
      material: product.material,
      color: product.color,
      style: product.style,
      dimensions: product.dimensions,
      features: product.features
    },
    visual: {
      dimensions: formatConfig.dimensions,
      aspect_ratio: output.aspectRatio,
      background: output.background,
      lighting: output.lighting,
      camera_angle: output.cameraAngle,
      branding: {
        aesthetic: branding.aesthetic,
        mood_keywords: branding.moodKeywords
      }
    },
    text_content: text_overlay?.enabled ? {
      enabled: true,
      content: text_overlay.content,
      position: text_overlay.position,
      style: text_overlay.style,
      rendering_instructions: `Render the text "${text_overlay.content}" in ${text_overlay.position} position with ${text_overlay.style.font_family} font, size ${text_overlay.style.font_size}, weight ${text_overlay.style.font_weight}, color ${text_overlay.style.color}${text_overlay.style.background_color ? `, background ${text_overlay.style.background_color}` : ''}${text_overlay.style.opacity ? `, opacity ${text_overlay.style.opacity}` : ''}`
    } : {
      enabled: false,
      content: null,
      rendering_instructions: "No text overlay required"
    },
    generation_prompt: generateTextAwarePrompt(data),
    constraints: data.constraints,
    export_settings: {
      format: "PNG",
      quality: "high",
      compression: "lossless",
      color_profile: "sRGB",
      metadata: {
        title: product.name,
        description: `${formatConfig.use_case} image for ${product.name}`,
        keywords: [product.category, product.style, ...branding.moodKeywords],
        creator: "Piktor AI"
      }
    }
  };

  return profile;
}

function generateTextAwarePrompt(data: PromptData): string {
  const { product, output, branding, text_overlay } = data;
  
  let basePrompt = `Create a high-quality ${output.aspectRatio} product image of ${product.name} (${product.category}) in ${product.style} style, made of ${product.material} in ${product.color} color.`;
  
  if (text_overlay?.enabled) {
    basePrompt += ` Include text overlay with the exact text: "${text_overlay.content}" positioned at ${text_overlay.position.replace(/_/g, ' ')} of the image. Text should use ${text_overlay.style.font_family} font, ${text_overlay.style.font_size} size, ${text_overlay.style.font_weight} weight, in ${text_overlay.style.color} color.`;
    
    if (text_overlay.style.background_color) {
      basePrompt += ` Add a background color ${text_overlay.style.background_color} behind the text.`;
    }
    
    if (text_overlay.style.opacity) {
      basePrompt += ` Set text opacity to ${text_overlay.style.opacity}.`;
    }
  }
  
  basePrompt += ` Background: ${output.background}. Lighting: ${output.lighting}. Camera angle: ${output.cameraAngle.replace(/_/g, ' ')}. Aesthetic: ${branding.aesthetic}. Mood: ${branding.moodKeywords.join(', ')}.`;
  
  return basePrompt;
}

/*
function optimizePrompt(prompt: string, targetLength: number): string {
  if (prompt.length <= targetLength) return prompt;

  // Progressive optimization strategies
  let optimized = prompt;

  // 1. Remove redundant phrases and clean up whitespace
  optimized = optimized
    .replace(/\s+/g, ' ')
    .replace(/\.\s+/g, '. ')
    .replace(/:\s+/g, ': ')
    .trim();

  if (optimized.length <= targetLength) return optimized;

  // 2. Abbreviate common words
  const abbreviations = {
    'professional': 'pro',
    'commercial': 'comm.',
    'high-quality': 'hi-qual',
    'specifications': 'specs',
    'requirements': 'req.',
    'composition': 'comp.',
    'lighting': 'light',
    'background': 'bg',
    'product': 'prod',
    'furniture': 'furn.',
    'dimensions': 'dims',
    'materials': 'mats',
    'aesthetic': 'style'
  };

  for (const [full, abbrev] of Object.entries(abbreviations)) {
    optimized = optimized.replace(new RegExp(full, 'gi'), abbrev);
  }

  if (optimized.length <= targetLength) return optimized;

  // 3. Remove less critical sections
  optimized = optimized
    .replace(/TECHNICAL CONSTRAINTS:[\s\S]*?(?=\n\n|$)/, 'Key constraints: maintain exact dimensions and features.')
    .replace(/BRAND AESTHETIC:[\s\S]*?(?=\n\n|$)/, '')
    .replace(/Create a high-quality, photorealistic image that emphasizes[\s\S]*$/, 'Create photorealistic commercial image.');

  if (optimized.length <= targetLength) return optimized;

  // 4. Final truncation with ellipsis
  return optimized.substring(0, targetLength - 3) + '...';
}
*/