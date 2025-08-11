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
                required: ["baseDescription", "packshot", "lifestyle", "hero", "story", "photographySpecs", "visualDetails"],
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
  return `You are analyzing ${imageCount} images of THE SAME PRODUCT from different angles and perspectives. Your task is to create a comprehensive product profile by combining insights from all images.

CRITICAL MISSION: This analysis will be used to generate NEW AI images of the product using GPT-image-1 text-to-image model. The textToImagePrompts must be extremely detailed and comprehensive to ensure accurate recreation of the product.

IMPORTANT: All images show the SAME PRODUCT. Use information from ALL images to create the most comprehensive and accurate profile.

ENHANCED ANALYSIS REQUIREMENTS:

1. VISUAL CHARACTERISTICS - Be extremely detailed about:
   - Exact materials and their textures (leather grain, wood finish, fabric weave, metal type)
   - Precise color descriptions with lighting characteristics
   - Surface properties (matte, glossy, brushed, polished, textured)
   - Construction details (joints, connections, hardware, stitching)
   - Proportions and geometric relationships between parts
   - Any unique design elements, curves, angles, or decorative features

2. DIMENSIONAL ANALYSIS:
   - Estimate proportions between different parts of the product
   - Identify key structural relationships (base-to-top ratios, depth perspectives)
   - Note any scale indicators visible in the images

3. LIGHTING AND SHADOW BEHAVIOR:
   - How the product interacts with light (reflections, shadows, highlights)
   - Material-specific light characteristics
   - Areas that naturally create depth and dimensionality

4. CONTEXTUAL RECOMMENDATIONS:
   - Best angles and perspectives for different use cases
   - Optimal lighting conditions for each context type
   - Background styles that complement the product

5. TEXT-TO-IMAGE OPTIMIZATION:
   - Create highly detailed prompts that capture every visual aspect
   - Include technical photography terms and lighting setups
   - Specify camera angles, depth of field, and composition elements
   - Ensure prompts are rich enough to recreate the product without reference images

The textToImagePrompts section is CRITICAL - these will be used directly with GPT-image-1 to generate new product images. They must be comprehensive enough to recreate the product accurately from text alone.`;
}