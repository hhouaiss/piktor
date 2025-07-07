import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured" 
      }, { status: 500 });
    }

    console.log("Testing gpt-image-1 API...");

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: "Generate a photorealistic image of the desk exactly as shown. Include only the open wall-mounted fold-down desk, without any additional desks or chairs. Match the shape, proportions, features and texture. Avoid adding any surrounding furniture or duplicate elements. Treat this like a product image for a real e-commerce website. Accuracy is critical and nothing should be invented.",
      n: 1,
      size: "1024x1024",
      quality: "high",
      response_format: "b64_json"
    });

    console.log("Test response received");
    console.log("Has data:", !!response.data);
    console.log("Data length:", response.data?.length);
    console.log("First item keys:", response.data?.[0] ? Object.keys(response.data[0]) : 'none');

    const firstImage = response.data?.[0];
    let imageUrl = null;
    
    if (firstImage?.b64_json) {
      imageUrl = `data:image/png;base64,${firstImage.b64_json}`;
    } else if (firstImage?.url) {
      imageUrl = firstImage.url;
    }

    return NextResponse.json({
      success: true,
      hasData: !!response.data,
      dataLength: response.data?.length,
      hasB64Json: !!firstImage?.b64_json,
      hasUrl: !!firstImage?.url,
      imageUrl: imageUrl,
      firstItemKeys: firstImage ? Object.keys(firstImage) : null,
    });

  } catch (error) {
    console.error("Test API Error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}