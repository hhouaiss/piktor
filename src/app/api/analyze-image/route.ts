import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const outputType = formData.get("outputType") as string;
  const textOverlay = formData.get("textOverlay") as string;
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" 
      }, { status: 500 });
    }
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type;

    // OpenAI Vision API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this furniture image and generate a JSON profile matching the structure below. This is a wall-mounted fold-down desk, so avoid describing any floor-based furniture. Do not invent or add unrelated elements. Focus only on the visible structure and material. Provide realistic outputs and constrain hallucinations. Do not add any text, labels, or written information in the image. Return ONLY a valid JSON object with this exact structure:

{
  "product": {
    "type": "desk",
    "name": "descriptive name based on style and material",
    "dimensions": [
      {
        "name": "width",
        "value": "estimate number",
        "unit": "cm"
      },
      {
        "name": "depth", 
        "value": "estimate number",
        "unit": "cm"
      },
      {
        "name": "height",
        "value": "estimate number", 
        "unit": "cm"
      }
    ],
    "material": "detailed material description",
    "color": "hex color code of dominant wood/surface color",
    "style": "style category (modern minimalist, industrial, etc.)",
    "features": [
      {
        "name": "feature name if visible",
        "description": "detailed description of the feature",
        "location": "where the feature is located",
        "visibility": "how visible/prominent the feature is"
      }
    ]
  },
  "output": {
    "type": "packshot",
    "prompt": "Generate a photorealistic packshot of the Supreme wall-mounted desk, fully open. Do not include any surrounding furniture or duplicated desks. Match the dimensions, materials, and design precisely. Show the desk against a neutral studio background with soft lighting.",
    "aspect_ratio": "16:9",
    "resolution": "2048x1536",
    "camera_angle": "front_center"
  },
  "constraints": {
    "strict_mode": true,
    "must_be_wall_mounted": true,
    "no_furniture_on_floor": true,
    "no_extra_objects": true,
    "respect_all_dimensions": true
  }
}

Be precise. Do not add any text, labels, or written information in the image. Do not invent elements that aren't visible. This desk must be the only object in the scene. Treat this like a product image for a real e-commerce website. Accuracy is critical and nothing should be invented.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response - handle markdown code blocks
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      console.error("Parse error:", parseError);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Check if JSON profile generation is requested
    if (outputType === "json_profile") {
      const jsonProfile = generateJsonProfileFromAnalysis(analysisResult, textOverlay);
      return NextResponse.json({
        success: true,
        analysis: analysisResult,
        profile: jsonProfile,
        metadata: {
          filename: file.name,
          size: file.size,
          type: file.type,
          processedAt: new Date().toISOString(),
          model: "gpt-4o",
          outputType: "json_profile",
        },
      });
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      metadata: {
        filename: file.name,
        size: file.size,
        type: file.type,
        processedAt: new Date().toISOString(),
        model: "gpt-4o",
      },
    });

  } catch (error) {
    console.error("Image analysis error:", error);
    
    // Fallback to mock data if OpenAI fails
    const mockAnalysis = {
      product: {
        type: "desk",
        name: "Modern Oak Desk",
        dimensions: [
          {
            "name": "width",
            "value": "140",
            "unit": "cm"
          },
          {
            "name": "depth",
            "value": "70", 
            "unit": "cm"
          },
          {
            "name": "height",
            "value": "75",
            "unit": "cm"
          }
        ],
        material: "solid oak, matte lacquer",
        color: "#C19A6B",
        style: "modern minimalist",
        features: [
          {
            "name": "Cable management",
            "description": "Built-in cable routing system for organized workspace",
            "location": "rear panel",
            "visibility": "subtle"
          }
        ]
      },
      output: {
        type: "packshot",
        prompt: "A high-resolution packshot of a modern minimalist oak desk, 140x70x75cm, #C19A6B color, matte finish, front angle, transparent background, soft even lighting, no shadows",
        aspect_ratio: "16:9",
        resolution: "2048x1536",
        camera_angle: "front_center"
      },
      constraints: {
        strict_mode: true,
        must_be_wall_mounted: true,
        no_furniture_on_floor: true,
        no_extra_objects: true,
        respect_all_dimensions: true
      }
    };

    // Check if JSON profile generation is requested for fallback too
    if (outputType === "json_profile") {
      const jsonProfile = generateJsonProfileFromAnalysis(mockAnalysis, textOverlay);
      return NextResponse.json({
        success: true,
        analysis: mockAnalysis,
        profile: jsonProfile,
        metadata: {
          filename: "unknown",
          size: 0,
          type: "unknown",
          processedAt: new Date().toISOString(),
          fallback: true,
          error: error instanceof Error ? error.message : "Unknown error",
          outputType: "json_profile",
        },
      });
    }

    return NextResponse.json({
      success: true,
      analysis: mockAnalysis,
      metadata: {
        filename: "unknown",
        size: 0,
        type: "unknown",
        processedAt: new Date().toISOString(),
        fallback: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

interface AnalysisData {
  product?: {
    name?: string;
    type?: string;
    material?: string;
    color?: string;
    style?: string;
    dimensions?: Array<{
      name: string;
      value: string;
      unit: string;
    }>;
    features?: Array<{
      name: string;
      description: string;
      location: string;
      visibility: string;
    }>;
  };
  output?: {
    aspect_ratio?: string;
    background?: string;
    lighting?: string;
    camera_angle?: string;
  };
  constraints?: {
    strict_mode?: boolean;
    no_extra_objects?: boolean;
    respect_all_dimensions?: boolean;
  };
}

function generateJsonProfileFromAnalysis(analysis: AnalysisData, textOverlayStr?: string) {
  // Parse text overlay if provided
  let textOverlay = null;
  if (textOverlayStr) {
    try {
      textOverlay = JSON.parse(textOverlayStr);
    } catch (e) {
      console.error("Failed to parse text overlay:", e);
    }
  }

  // Determine format based on aspect ratio or default to website
  const aspectRatio = analysis.output?.aspect_ratio || "1:1";
  const formatConfig = aspectRatio === "1:1" ? {
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

  // Build comprehensive JSON profile
  const profile = {
    meta: {
      format: formatConfig.format,
      platform: formatConfig.platform,
      use_case: formatConfig.use_case,
      generated_at: new Date().toISOString(),
      version: "1.0"
    },
    product: {
      name: analysis.product?.name || "Unknown Product",
      category: analysis.product?.type || "furniture",
      material: analysis.product?.material || "unknown material",
      color: analysis.product?.color || "#000000",
      style: analysis.product?.style || "modern",
      dimensions: analysis.product?.dimensions || [],
      features: analysis.product?.features || []
    },
    visual: {
      dimensions: formatConfig.dimensions,
      aspect_ratio: aspectRatio,
      background: analysis.output?.background || "clean white studio",
      lighting: analysis.output?.lighting || "soft natural lighting",
      camera_angle: analysis.output?.camera_angle || "front_center",
      branding: {
        aesthetic: "modern minimalist",
        mood_keywords: ["clean", "professional", "sophisticated"]
      }
    },
    text_content: textOverlay?.enabled ? {
      enabled: true,
      content: textOverlay.content || "",
      position: textOverlay.position || "bottom",
      style: textOverlay.style || {
        font_family: "Arial",
        font_size: "20px",
        font_weight: "bold",
        color: "#333333"
      },
      rendering_instructions: `Render the text "${textOverlay.content}" in ${textOverlay.position} position with specified styling`
    } : {
      enabled: false,
      content: null,
      rendering_instructions: "No text overlay required"
    },
    generation_prompt: generatePromptFromAnalysis(analysis, textOverlay),
    constraints: analysis.constraints || {
      strict_mode: true,
      no_extra_objects: true,
      respect_all_dimensions: true
    },
    export_settings: {
      format: "PNG",
      quality: "high",
      compression: "lossless",
      color_profile: "sRGB",
      metadata: {
        title: analysis.product?.name || "Product Image",
        description: `${formatConfig.use_case} image for ${analysis.product?.name || "product"}`,
        keywords: [
          analysis.product?.type || "furniture",
          analysis.product?.style || "modern",
          "product",
          "commercial"
        ],
        creator: "Piktor AI"
      }
    }
  };

  return profile;
}

interface TextOverlayData {
  enabled?: boolean;
  content?: string;
  position?: string;
  style?: {
    font_family?: string;
    font_size?: string;
    font_weight?: string;
    color?: string;
    background_color?: string;
    opacity?: number;
  };
}

function generatePromptFromAnalysis(analysis: AnalysisData, textOverlay?: TextOverlayData): string {
  const product = analysis.product || {};
  
  let basePrompt = `Create a high-quality 1:1 product image of ${product.name || "furniture item"} (${product.type || "furniture"}) in ${product.style || "modern"} style, made of ${product.material || "quality materials"} in ${product.color || "natural"} color.`;
  
  if (textOverlay?.enabled && textOverlay.content) {
    basePrompt += ` Include text overlay with the exact text: "${textOverlay.content}" positioned at ${textOverlay.position?.replace(/_/g, ' ') || 'bottom'} of the image.`;
    
    if (textOverlay.style) {
      basePrompt += ` Text should use ${textOverlay.style.font_family || 'Arial'} font, ${textOverlay.style.font_size || '20px'} size, ${textOverlay.style.font_weight || 'bold'} weight, in ${textOverlay.style.color || '#333333'} color.`;
    }
  }
  
  basePrompt += ` Background: clean white studio. Lighting: soft natural lighting. Camera angle: front center. Professional product photography style.`;
  
  return basePrompt;
}