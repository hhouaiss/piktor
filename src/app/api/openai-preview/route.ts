import { NextRequest, NextResponse } from "next/server";

interface OpenAIRequest {
  prompt: string;
  type: "packshot" | "lifestyle" | "instagram";
  aspectRatio?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OpenAIRequest = await request.json();
    const { prompt, type, aspectRatio = "16:9" } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const mockResponse = {
      success: true,
      image: {
        url: `/api/placeholder/600/400?text=${encodeURIComponent(type)}`,
        width: aspectRatio === "1:1" ? 600 : 600,
        height: aspectRatio === "1:1" ? 600 : 400,
        format: "png",
      },
      metadata: {
        prompt: prompt,
        type: type,
        aspectRatio: aspectRatio,
        generatedAt: new Date().toISOString(),
        processingTime: Math.floor(Math.random() * 10 + 5) + "s",
      },
    };

    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error("OpenAI preview error:", error);
    return NextResponse.json(
      { error: "Failed to generate image preview" },
      { status: 500 }
    );
  }
}