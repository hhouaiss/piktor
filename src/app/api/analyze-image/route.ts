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
              text: `Analyze this furniture image and generate a JSON profile matching the structure below. This is a wall-mounted fold-down desk, so avoid describing any floor-based furniture. Do not invent or add unrelated elements. Focus only on the visible structure and material. Provide realistic outputs and constrain hallucinations. Return ONLY a valid JSON object with this exact structure:

{
  "product": {
    "type": "desk",
    "name": "descriptive name based on style and material",
    "dimensions": {"width": "estimate in cm", "depth": "estimate in cm", "height": "estimate in cm"},
    "material": "detailed material description",
    "color": "hex color code of dominant wood/surface color",
    "style": "style category (modern minimalist, industrial, etc.)"
  },
  "output": {
    "type": "packshot",
    "prompt": "detailed prompt for generating a packshot image",
    "aspect_ratio": "16:9",
    "resolution": "2048x1536"
  }
}

Be precise. Do not invent elements that aren't visible. This desk must be the only object in the scene.`
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
        dimensions: {"width": "140cm", "depth": "70cm", "height": "75cm"},
        material: "solid oak, matte lacquer",
        color: "#C19A6B",
        style: "modern minimalist"
      },
      output: {
        type: "packshot",
        prompt: "A high-resolution packshot of a modern minimalist oak desk, 140x70x75cm, #C19A6B color, matte finish, front angle, transparent background, soft even lighting, no shadows",
        aspect_ratio: "16:9",
        resolution: "2048x1536"
      }
    };

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