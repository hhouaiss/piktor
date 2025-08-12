import { NextResponse } from "next/server";
import { generateMultipleImagesWithBFL } from "@/lib/bfl-api";
import { ContextPreset } from "@/components/image-generator/types";

export async function GET() {
  try {
    if (!process.env.BFL_API_KEY) {
      return NextResponse.json({ 
        error: "BFL API key not configured" 
      }, { status: 500 });
    }

    console.log("Testing FLUX Kontext Pro API...");

    const response = await generateMultipleImagesWithBFL({
      prompt: "Generate a photorealistic image of the desk exactly as shown. Include only the open wall-mounted fold-down desk, without any additional desks or chairs. Match the shape, proportions, features and texture. Avoid adding any surrounding furniture or duplicate elements. Treat this like a product image for a real e-commerce website. Accuracy is critical and nothing should be invented.",
      aspect_ratio: "1:1",
      prompt_upsampling: false,
      safety_tolerance: 2,
      output_format: "jpeg"
    }, 1, 'packshot' as ContextPreset);

    console.log("Test response received");
    console.log("Has images:", !!response);
    console.log("Images length:", response?.length);
    console.log("First image keys:", response?.[0] ? Object.keys(response[0]) : 'none');

    const firstImage = response?.[0];
    const imageUrl = firstImage?.url || null;

    return NextResponse.json({
      success: true,
      hasImages: !!response,
      imagesLength: response?.length,
      hasUrl: !!firstImage?.url,
      imageUrl: imageUrl,
      firstImageKeys: firstImage ? Object.keys(firstImage) : null,
      model: "flux-kontext-pro"
    });

  } catch (error) {
    console.error("Test API Error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}