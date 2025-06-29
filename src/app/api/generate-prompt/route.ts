import { NextRequest, NextResponse } from "next/server";

interface Analysis {
  material?: { type?: string };
  colors?: { dominant?: string };
  dimensions?: { estimated?: string };
  style?: { keywords?: string[] };
  background?: { type?: string };
  lighting?: { type?: string };
}

interface PromptRequest {
  analysis?: Analysis;
  userInput?: {
    productName?: string;
    outputType?: "packshot" | "lifestyle" | "instagram";
    background?: string;
    lighting?: string;
    aspectRatio?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PromptRequest = await request.json();
    const { analysis, userInput } = body;

    const promptData = {
      product: {
        name: userInput?.productName || "Modern Desk",
        category: "office furniture",
        material: analysis?.material?.type || "wood",
        color: analysis?.colors?.dominant || "#DEB887",
        dimensions: analysis?.dimensions?.estimated || "120x60x75 cm",
        style: analysis?.style?.keywords?.join(", ") || "modern minimalist",
      },
      output: {
        type: userInput?.outputType || "packshot",
        background: userInput?.background || analysis?.background?.type || "white studio",
        lighting: userInput?.lighting || analysis?.lighting?.type || "soft professional lighting",
        aspectRatio: userInput?.aspectRatio || "16:9",
      },
      branding: {
        aesthetic: "modern, cozy, professional",
        moodKeywords: ["clean", "organized", "productive", "home office"],
      },
    };

    const generatePromptText = (data: typeof promptData) => {
      return `Create a ${data.output.type} image of a ${data.product.name}. 

Product Details:
- Material: ${data.product.material}
- Color: ${data.product.color}
- Style: ${data.product.style}
- Dimensions: ${data.product.dimensions}

Image Settings:
- Background: ${data.output.background}
- Lighting: ${data.output.lighting}
- Aspect Ratio: ${data.output.aspectRatio}

Brand Aesthetic: ${data.branding.aesthetic}
Mood: ${data.branding.moodKeywords.join(", ")}

Generate a photorealistic image of the desk exactly as shown. Include only the open wall-mounted fold-down desk, without any additional desks or chairs. Match the shape, proportions, features and texture. Avoid adding any surrounding furniture or duplicate elements. Treat this like a product image for a real e-commerce website. Accuracy is critical and nothing should be invented.`;
    };

    return NextResponse.json({
      success: true,
      prompt: {
        json: promptData,
        text: generatePromptText(promptData),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Prompt generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}