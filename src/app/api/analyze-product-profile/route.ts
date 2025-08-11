import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
// Note: createDetectedField not needed - frontend handles DetectedField pattern

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
    
    // Extract all uploaded images
    const images: File[] = [];
    let imageIndex = 0;
    
    while (true) {
      const imageEntry = formData.get(`image_${imageIndex}`);
      if (!imageEntry) break;
      
      // Type guard to ensure we have a File object
      if (!(imageEntry instanceof File)) {
        return NextResponse.json({ 
          error: "Invalid file format. Please provide valid image files." 
        }, { status: 400 });
      }
      
      images.push(imageEntry);
      imageIndex++;
    }
    
    if (images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Convert images to base64 for OpenAI vision API
    const imagePromises = images.map(async (image) => {
      if (!image.arrayBuffer || typeof image.arrayBuffer !== 'function') {
        throw new Error(`Invalid image object: missing arrayBuffer method`);
      }
      
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:${image.type};base64,${base64}`;
    });

    const base64Images = await Promise.all(imagePromises);

    // Build the analysis prompt for multiple images
    const analysisPrompt = buildAnalysisPrompt(images.length);

    // Call OpenAI Vision API with all images using GPT-4o-2024-08-06 for structured output
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt
            },
            ...base64Images.map(base64Image => ({
              type: "image_url" as const,
              image_url: {
                url: base64Image,
                detail: "high" as const
              }
            }))
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                description: "Specific product type (e.g. 'ergonomic_office_chair', 'modern_desk_lamp')"
              },
              materials: {
                type: "array",
                items: { type: "string" },
                description: "Primary materials visible in the product"
              },
              primaryColor: {
                type: "object",
                properties: {
                  hex: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                  name: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 }
                },
                required: ["hex", "name", "confidence"],
                additionalProperties: false
              },
              style: {
                type: "string",
                description: "Design style (e.g. 'modern', 'industrial', 'scandinavian')"
              },
              wallMounted: {
                type: "boolean",
                description: "Whether the product is designed to be wall-mounted"
              },
              features: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    importance: { type: "string", enum: ["high", "medium", "low"] }
                  },
                  required: ["name", "description", "importance"],
                  additionalProperties: false
                },
                description: "Notable features and characteristics"
              },
              dimensions: {
                type: "object",
                properties: {
                  estimated: {
                    type: "object",
                    properties: {
                      width: { type: "number" },
                      height: { type: "number" },
                      depth: { type: "number" },
                      unit: { type: "string", enum: ["cm", "inches"] },
                      confidence: { type: "string", enum: ["high", "medium", "low"] }
                    },
                    required: ["width", "height", "depth", "unit", "confidence"],
                    additionalProperties: false
                  }
                },
                required: ["estimated"],
                additionalProperties: false
              },
              contextRecommendations: {
                type: "object",
                properties: {
                  bestContexts: {
                    type: "array",
                    items: { type: "string", enum: ["packshot", "lifestyle", "instagram", "hero"] },
                    description: "Recommended context presets for this product"
                  },
                  backgroundSuggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Suggested background styles that would complement this product"
                  },
                  lightingRecommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lighting setups that would best showcase this product"
                  }
                },
                required: ["bestContexts", "backgroundSuggestions", "lightingRecommendations"],
                additionalProperties: false
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Overall confidence in this analysis"
              },
              notes: {
                type: "string",
                description: "Additional observations about the product"
              },
              textToImagePrompts: {
                type: "object",
                properties: {
                  baseDescription: {
                    type: "string",
                    description: "Extremely detailed base description capturing all visual characteristics, materials, textures, colors, and construction details"
                  },
                  packshot: {
                    type: "string",
                    description: "Complete prompt for clean product packshots with studio lighting and neutral background"
                  },
                  lifestyle: {
                    type: "string",
                    description: "Detailed prompt for lifestyle scenes with contextual environments and natural lighting"
                  },
                  hero: {
                    type: "string",
                    description: "Comprehensive prompt for hero/banner images with dramatic composition and professional lighting"
                  },
                  story: {
                    type: "string",
                    description: "Optimized prompt for vertical story format with mobile-friendly composition"
                  },
                  instagram: {
                    type: "string",
                    description: "Instagram post format prompt optimized for square compositions and social media engagement"
                  },
                  detail: {
                    type: "string",
                    description: "Detail shot format prompt for close-up product photography showcasing craftsmanship and materials"
                  },
                  photographySpecs: {
                    type: "object",
                    properties: {
                      cameraAngle: {
                        type: "string",
                        description: "Optimal camera angles and perspectives for this product"
                      },
                      lightingSetup: {
                        type: "string",
                        description: "Detailed lighting specifications including key light, fill light, and rim light positioning"
                      },
                      depthOfField: {
                        type: "string",
                        description: "Recommended depth of field and focus characteristics"
                      },
                      composition: {
                        type: "string",
                        description: "Composition guidelines including rule of thirds, leading lines, and visual balance"
                      }
                    },
                    required: ["cameraAngle", "lightingSetup", "depthOfField", "composition"],
                    additionalProperties: false
                  },
                  visualDetails: {
                    type: "object",
                    properties: {
                      materialTextures: {
                        type: "string",
                        description: "Detailed description of all material textures and surface properties"
                      },
                      colorPalette: {
                        type: "string",
                        description: "Complete color palette with undertones, highlights, and shadow characteristics"
                      },
                      hardwareDetails: {
                        type: "string",
                        description: "Specific details about hardware, joints, connections, and mechanical elements"
                      },
                      proportionalRelationships: {
                        type: "string",
                        description: "Key proportional relationships between different parts of the product"
                      }
                    },
                    required: ["materialTextures", "colorPalette", "hardwareDetails", "proportionalRelationships"],
                    additionalProperties: false
                  }
                },
                required: ["baseDescription", "packshot", "lifestyle", "hero", "story", "instagram", "detail", "photographySpecs", "visualDetails"],
                additionalProperties: false
              }
            },
            required: ["type", "materials", "primaryColor", "style", "wallMounted", "features", "dimensions", "contextRecommendations", "confidence", "notes", "textToImagePrompts"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI Vision API');
    }

    // Parse the structured JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse structured OpenAI response:', content);
      throw new Error('Failed to parse analysis response from GPT-4o structured output');
    }

    // Transform the comprehensive analysis into our current format plus enhanced data
    const fusedProfile = {
      // Core product info (existing format)
      type: analysis.type || 'furniture',
      materials: Array.isArray(analysis.materials) ? analysis.materials.join(', ') : (analysis.materials || 'unknown'),
      colorHex: analysis.primaryColor?.hex || '#ffffff',
      colorName: analysis.primaryColor?.name || 'unknown',
      colorConfidence: analysis.primaryColor?.confidence || 0.5,
      style: analysis.style || 'modern',
      wallMounted: analysis.wallMounted || false,
      features: analysis.features?.map(f => f.name) || [],
      confidence: analysis.confidence || 'medium',
      notes: analysis.notes || '',
      
      // Enhanced data from comprehensive analysis
      detailedFeatures: analysis.features || [],
      estimatedDimensions: analysis.dimensions?.estimated || null,
      contextRecommendations: analysis.contextRecommendations || {
        bestContexts: ['packshot'],
        backgroundSuggestions: ['neutral'],
        lightingRecommendations: ['soft_daylight']
      },
      textToImagePrompts: analysis.textToImagePrompts || {
        baseDescription: `Professional product image of ${analysis.type}`,
        packshot: `Clean product shot of ${analysis.type} on neutral background`,
        lifestyle: `Show ${analysis.type} in a realistic home setting`,
        hero: `Dramatic hero image of ${analysis.type} for website banner`,
        story: `Vertical mobile-optimized image of ${analysis.type}`,
        instagram: `Square format Instagram post of ${analysis.type} with social media appeal`,
        detail: `Close-up detail shot of ${analysis.type} showing craftsmanship and materials`,
        photographySpecs: {
          cameraAngle: "Three-quarter view, eye-level perspective",
          lightingSetup: "Three-point lighting with key light, fill light, and rim light",
          depthOfField: "Medium depth of field with product in sharp focus",
          composition: "Rule of thirds with product as focal point"
        },
        visualDetails: {
          materialTextures: "Standard material textures",
          colorPalette: "Primary product colors",
          hardwareDetails: "Standard hardware elements",
          proportionalRelationships: "Standard product proportions"
        }
      },
      
      // Metadata
      analysisVersion: '2.0',
      analysisModel: 'gpt-4o-2024-08-06',
      analysisTimestamp: new Date().toISOString(),
      sourceImageCount: images.length
    };

    return NextResponse.json(fusedProfile);

  } catch (error) {
    console.error("Multi-image analysis error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error occurred during analysis",
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

function buildAnalysisPrompt(imageCount: number): string {
  return `You are analyzing ${imageCount} images of THE SAME PRODUCT from different angles and perspectives. Your task is to create an EXTREMELY COMPREHENSIVE product profile by combining insights from ALL images.

🎯 CRITICAL MISSION: This analysis will be used to generate NEW AI images using GPT-image-1 text-to-image model. Since GPT-image-1 cannot see reference images, your textToImagePrompts must be SO DETAILED and COMPREHENSIVE that they can accurately recreate the product from text descriptions alone.

📸 ANALYSIS METHODOLOGY:
- Examine ALL ${imageCount} images thoroughly
- Note variations in lighting, angles, and visible details across images
- Combine information from ALL perspectives to create the most complete description possible
- Pay special attention to details that are only visible in certain angles/lighting

🔍 ULTRA-DETAILED VISUAL ANALYSIS REQUIREMENTS:

1. MATERIAL & TEXTURE ANALYSIS (be extraordinarily specific):
   - Exact material types with technical descriptions (e.g., "brushed aluminum with hairline finish", "full-grain leather with natural pebbling", "solid oak with hand-rubbed oil finish")
   - Surface characteristics: grain direction, texture patterns, reflectivity levels
   - Material transitions and joints (how different materials connect)
   - Wear patterns, natural variations, or intentional distressing
   - Hardware specifications: screw types, bracket designs, hinge mechanisms

2. COLOR & LIGHTING CHARACTERISTICS:
   - Primary colors with specific names and undertones
   - How colors appear under different lighting conditions shown in the images
   - Color variations across the product (gradients, shadows, highlights)
   - Reflective properties and how light interacts with different surfaces
   - Any metallic, pearlescent, or special finish effects

3. GEOMETRIC & STRUCTURAL DETAILS:
   - Precise shape descriptions including curves, angles, and transitions
   - Dimensional proportions between all components
   - Structural elements: supports, joints, connection points
   - Symmetry or asymmetrical design elements
   - Edge treatments: rounded, sharp, beveled, chamfered

4. CONSTRUCTION & CRAFTSMANSHIP:
   - Assembly methods visible in the images
   - Joint types: mortise-and-tenon, dovetail, welded, screwed, etc.
   - Quality indicators: flush surfaces, tight tolerances, smooth edges
   - Manufacturing techniques evident from the finish quality
   - Any visible branding, model numbers, or identifying marks

5. FUNCTIONAL ELEMENTS:
   - Moving parts and their mechanisms
   - Operational features and how they work
   - Ergonomic considerations visible in the design
   - Storage or utility aspects
   - Any electrical components, cords, or technological elements

6. CONTEXTUAL ENVIRONMENT ANALYSIS:
   - Background elements visible in different images
   - Lighting conditions that show the product best
   - Scale references (other objects, furniture, room elements)
   - Setting types that complement the product

🎨 TEXT-TO-IMAGE PROMPT CREATION (MAXIMUM DETAIL REQUIRED):

For each context type (packshot, lifestyle, hero, story), create prompts that are:
- MINIMUM 200+ words each for main contexts
- Include specific technical photography terms
- Reference exact materials, colors, and construction details
- Specify lighting setups, camera angles, and composition rules
- Describe how shadows and highlights should fall
- Include atmospheric and environmental details

The baseDescription should be 300+ words capturing EVERY visual aspect visible across all uploaded images.

Photography specifications must include:
- Specific lens recommendations (wide angle, macro, etc.)
- Lighting ratios and setup descriptions
- Depth of field specifications
- Color temperature and mood requirements

Visual details must capture:
- Every texture and material property
- All color variations and undertones  
- Every structural and geometric element
- Surface treatments and finish characteristics

Remember: Since GPT-image-1 cannot see reference images, your descriptions must be so thorough that they serve as complete visual blueprints for recreating the product. Include every detail you can observe across all ${imageCount} images.`;
}