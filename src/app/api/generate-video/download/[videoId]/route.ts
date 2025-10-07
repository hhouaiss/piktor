import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "OpenAI API key not configured"
      }, { status: 500 });
    }
    console.log(`Downloading video: ${videoId}`);

    // Fetch the video from OpenAI with authentication
    const videoUrl = `https://api.openai.com/v1/videos/${videoId}/content`;

    const response = await fetch(videoUrl, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch video: ${response.status}`);
      return NextResponse.json({
        error: `Failed to fetch video: ${response.status}`
      }, { status: response.status });
    }

    // Get the video content
    const videoBlob = await response.blob();
    const arrayBuffer = await videoBlob.arrayBuffer();

    // Return the video with proper headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="piktor-ad-${videoId}.mp4"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error("Video download error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to download video"
    }, { status: 500 });
  }
}
