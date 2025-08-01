import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" 
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

    // Generate image using gpt-image-1
    console.log("Generating image with prompt:", detailedPrompt.substring(0, 200) + "...");
    console.log("Image size:", getImageSize(promptData.output.aspectRatio));
    
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: detailedPrompt,
      n: 1,
      size: getImageSize(promptData.output.aspectRatio),
      quality: "high",
    });
    
    console.log("OpenAI response received successfully");
    console.log("Response structure:", {
      hasData: !!response.data,
      dataLength: response.data?.length,
      firstItem: response.data?.[0] ? Object.keys(response.data[0]) : 'no first item'
    });
    
    const firstImage = response.data?.[0];
    let generatedImageUrl: string;
    
    if (firstImage?.b64_json) {
      // Handle base64 response (gpt-image-1 format)
      generatedImageUrl = `data:image/png;base64,${firstImage.b64_json}`;
      console.log("Generated image as base64 data URL");
    } else if (firstImage?.url) {
      // Handle URL response (fallback for other models)
      generatedImageUrl = firstImage.url;
      console.log("Generated image URL:", generatedImageUrl);
    } else {
      console.error("No URL or b64_json found in response data:", response.data);
      console.error("First item details:", firstImage);
      throw new Error("No image data returned from OpenAI");
    }

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      prompt: detailedPrompt,
      metadata: {
        model: "gpt-image-1",
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
  if (constraints.must_be_wall_mounted) constraintsStr.push("wall-mounted design only");
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

Create a high-quality, photorealistic image that emphasizes the furniture's craftsmanship, materials, and design. The image should be professionally lit with attention to detail, texture, and form. Ensure the furniture is the primary focus and matches all specified dimensions and features exactly.`;

  return prompt;
}

function getImageSize(aspectRatio: string): "1024x1024" | "1792x1024" | "1024x1792" {
  switch (aspectRatio) {
    case "16:9":
      return "1792x1024";
    case "9:16":
      return "1024x1792";
    case "1:1":
    case "4:3":
    default:
      return "1024x1024";
  }
}

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