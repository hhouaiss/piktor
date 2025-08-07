import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ 
        error: "Only image files are supported (JPG, PNG, WebP)" 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product image and extract detailed product profile information. Return ONLY a valid JSON object with this exact structure:

{
  "type": "product category (e.g., desk, chair, lamp, etc.)",
  "material": "primary material (e.g., wood, metal, plastic, fabric, etc.)",
  "dimensions": {
    "width": "width measurement (e.g., 90cm, 24in, or 'unknown')",
    "depth": "depth measurement (e.g., 40cm, 16in, or 'unknown')", 
    "height": "height measurement (e.g., 75cm, 30in, or 'unknown')"
  },
  "color": "primary color as hex code or descriptive name (e.g., #f5f5f0, white, natural wood)",
  "style": "design style (e.g., modern minimalist, industrial, rustic, contemporary, etc.)",
  "features": [
    "notable feature 1",
    "notable feature 2", 
    "notable feature 3"
  ],
  "brand": "brand name if visible, or 'unknown'",
  "condition": "new, used, or unknown"
}

Focus on what you can clearly observe in the image. If something is not visible or unclear, use 'unknown' for that field.`
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
      max_tokens: 600,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    let productProfile;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      productProfile = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Validate the response structure
    const requiredFields = ['type', 'material', 'dimensions', 'color', 'style'];
    for (const field of requiredFields) {
      if (!productProfile[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return NextResponse.json({
      success: true,
      product: productProfile,
      metadata: {
        filename: file.name,
        size: file.size,
        type: file.type,
        processedAt: new Date().toISOString(),
        model: "gpt-4o"
      },
    });

  } catch (error) {
    console.error("Product profile extraction error:", error);
    
    // Fallback with basic product profile
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = file?.name || "Unknown";
    
    const fallbackProduct = {
      type: "furniture",
      material: "unknown",
      dimensions: {
        width: "unknown",
        depth: "unknown", 
        height: "unknown"
      },
      color: "unknown",
      style: "modern",
      features: [
        "Quality construction",
        "Functional design",
        "Durable materials"
      ],
      brand: "unknown",
      condition: "new"
    };

    return NextResponse.json({
      success: true,
      product: fallbackProduct,
      metadata: {
        filename: filename,
        size: file?.size || 0,
        type: file?.type || "unknown",
        processedAt: new Date().toISOString(),
        fallback: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}