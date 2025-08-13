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
      model: "gpt-4o", // Use gpt-4o for superior image analysis
      max_tokens: 4000, // Ensure sufficient tokens for detailed analysis
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `🏢 ENTERPRISE FURNITURE ANALYSIS REQUEST: Analyze this commercial furniture image using professional furniture industry standards and terminology identical to analyze-product-profile endpoint. Generate a comprehensive JSON profile for enterprise furniture catalog integration.

🎯 ANALYSIS OBJECTIVES:
- Use precise furniture industry terminology from our centralized vocabulary system
- Focus on commercial-grade construction details and enterprise specifications
- Identify enterprise furniture materials with technical accuracy using standardized terms
- Determine wall-mounting requirements with commercial installation specifications
- Assess furniture for commercial environment suitability using industry classifications

⚠️ CRITICAL CONSTRAINTS:
- Do not invent elements not visible in the image
- Use only professional furniture industry terminology from FURNITURE_CATEGORIES vocabulary
- Focus exclusively on visible commercial furniture construction and materials
- Provide realistic specifications matching commercial furniture industry standards
- Avoid consumer-grade or residential furniture descriptions
- No text, labels, or written information should be added to descriptions
- Follow same analysis depth as analyze-product-profile endpoint for consistency

🔍 REQUIRED ANALYSIS DEPTH (matching analyze-product-profile standards):
- Materials: Specify exact material types using FURNITURE_MATERIALS terminology
- Construction: Identify commercial-grade construction methods and quality indicators
- Hardware: Detail visible hardware specifications using WALL_MOUNTING_TYPES if applicable
- Dimensions: Provide realistic commercial furniture dimensional estimates
- Features: Focus on functional features using FURNITURE_FEATURES classifications
- Style: Use FURNITURE_STYLES classifications for design aesthetic
- Color: Specify using COLOR_DESCRIPTIONS terminology

Return ONLY a valid JSON object with this exact structure:`
            },
            {
              type: "text",
              text: `

{
  "product": {
    "type": "wall_mounted_fold_down_workstation",
    "name": "descriptive name using commercial furniture terminology based on style and construction",
    "dimensions": [
      {
        "name": "width",
        "value": "realistic estimate number",
        "unit": "cm"
      },
      {
        "name": "depth", 
        "value": "realistic estimate number",
        "unit": "cm"
      },
      {
        "name": "height",
        "value": "realistic estimate number", 
        "unit": "cm"
      }
    ],
    "material": "detailed commercial furniture material specification using industry terminology",
    "color": "hex color code of dominant surface color with material-appropriate characteristics",
    "style": "commercial furniture style classification (contemporary_commercial, industrial_modern, etc.)",
    "features": [
      {
        "name": "commercial feature name using furniture industry terminology",
        "description": "detailed description focusing on commercial functionality and construction quality",
        "location": "precise location using furniture component terminology",
        "visibility": "visibility assessment with commercial importance rating"
      }
    ]
  },
  "output": {
    "type": "packshot",
    "prompt": "Generate a professional commercial furniture packshot of this wall-mounted fold-down workstation in fully deployed position. Use enterprise furniture catalog photography standards with studio lighting and seamless white backdrop. Match exact dimensions, commercial materials, and construction details precisely. No surrounding furniture, no floor contact, no duplicated products. Professional three-point lighting with material detail emphasis.",
    "aspect_ratio": "16:9",
    "resolution": "2048x1536",
    "camera_angle": "three_quarter_commercial_view"
  },
  "constraints": {
    "strict_mode": true,
    "commercial_furniture_standards": true,
    "must_be_wall_mounted": true,
    "no_floor_contact_ever": true,
    "no_extra_furniture_objects": true,
    "respect_all_commercial_dimensions": true,
    "enterprise_catalog_quality": true
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