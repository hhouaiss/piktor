import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createDetectedField } from "@/components/image-generator/types";

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

    // Call OpenAI Vision API with all images
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI Vision API');
    }

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Failed to parse analysis response');
    }

    // Validate and structure the response
    const fusedProfile = {
      type: analysis.type || 'furniture',
      materials: analysis.materials || 'unknown',
      colorHex: analysis.colorHex || '#ffffff',
      style: analysis.style || 'modern',
      wallMounted: analysis.wallMounted || false,
      features: analysis.features || [],
      confidence: analysis.confidence || 'medium',
      notes: analysis.notes || '',
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
  return `You are analyzing ${imageCount} images of THE SAME PRODUCT from different angles and perspectives. Your task is to create a unified product profile by combining insights from all images.

IMPORTANT: All images show the SAME PRODUCT. Use information from ALL images to create the most comprehensive and accurate profile.

Analyze the product across all images and provide a JSON response with this exact structure:

{
  "type": "specific product type (e.g., 'ergonomic_office_chair', 'modern_desk_lamp', 'wall_mounted_shelf')",
  "materials": "primary materials visible (e.g., 'wood_and_metal', 'plastic', 'fabric_upholstery')",
  "colorHex": "#RRGGBB hex code of the dominant/primary color",
  "style": "design style (e.g., 'modern', 'industrial', 'scandinavian', 'minimalist')",
  "wallMounted": true/false - whether the product is wall-mounted,
  "features": ["array", "of", "notable", "features", "or", "characteristics"],
  "confidence": "high/medium/low - your confidence in this analysis",
  "notes": "any additional observations about the product"
}

ANALYSIS GUIDELINES:
1. CONSISTENCY: Ensure all detected attributes are consistent across all images
2. PRECISION: Be specific about product type (not just "chair" but "ergonomic_office_chair")
3. COLOR: Choose the most accurate hex color for the primary/dominant color
4. MATERIALS: Identify primary materials, not every minor component
5. FEATURES: List 3-7 most notable features or selling points
6. WALL-MOUNTED: Carefully determine if the product is designed to be wall-mounted
7. STYLE: Be precise about the design style/aesthetic

Return ONLY the JSON object, no additional text or explanation.`;
}