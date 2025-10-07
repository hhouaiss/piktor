import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file"
      }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const prompt = formData.get("prompt") as string || "Create a cinematic advertisement showcasing this furniture product in a modern, elegant setting. Show the product from multiple angles with smooth camera movements, professional lighting, and an upscale atmosphere.";
    const seconds = formData.get("seconds") as string || "4";

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    console.log(`Processing video generation - Duration: ${seconds}s`);

    // Create FormData for multipart/form-data request
    const openaiFormData = new FormData();
    openaiFormData.append("prompt", prompt);
    // Temporarily removed input_reference to test text-to-video
    // openaiFormData.append("input_reference", image);
    openaiFormData.append("model", "sora-2");
    openaiFormData.append("seconds", seconds);
    openaiFormData.append("size", "1280x720"); // Try with size for text-to-video

    // Retry logic for video creation
    let result;
    const maxRetries = 3;

    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        console.log(`Creating video job (attempt ${retry + 1}/${maxRetries})...`);

        // Create video generation job
        const response = await fetch("https://api.openai.com/v1/videos", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: openaiFormData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // If it's a 520 or 5xx error, retry
          if (response.status >= 500 && retry < maxRetries - 1) {
            console.log(`Server error ${response.status}, retrying in 3 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }

          console.error("OpenAI API Error:", errorData);
          throw new Error(
            errorData.error?.message ||
            `API request failed with status ${response.status}`
          );
        }

        result = await response.json();
        console.log("Video job created:", result.id);
        break; // Success, exit retry loop

      } catch (error) {
        if (retry === maxRetries - 1) {
          throw error; // Last attempt failed
        }
        console.log(`Request failed, retrying... (${error instanceof Error ? error.message : 'Unknown error'})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    if (!result) {
      throw new Error("Failed to create video job after all retries");
    }

    try {

      // Poll for completion
      const videoData = await pollVideoGeneration(result.id);

      return NextResponse.json({
        success: true,
        jobId: result.id,
        videoUrl: videoData.url,
        prompt: prompt,
        metadata: {
          model: result.model,
          timestamp: new Date().toISOString(),
          duration: result.seconds,
          size: result.size,
          status: result.status
        }
      });

    } catch (apiError) {
      console.error("OpenAI API Error:", apiError);

      return NextResponse.json({
        error: "Video generation failed",
        message: apiError instanceof Error ? apiError.message : "Failed to generate video",
        details: apiError instanceof Error ? apiError.message : "API error"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Video generation error:", error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error occurred during video generation",
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

// Helper function to poll video generation status
async function pollVideoGeneration(jobId: string): Promise<{ url: string; status: string; videoId?: string }> {
  const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
  const pollInterval = 5000; // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const statusResponse = await fetch(
        `https://api.openai.com/v1/videos/${jobId}`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        // If we get 520 or other server errors after several attempts, retry
        if (statusResponse.status >= 500 && attempt < maxAttempts - 1) {
          console.log(`Server error ${statusResponse.status}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
        throw new Error(`Failed to check video generation status: ${statusResponse.status}`);
      }

      const status = await statusResponse.json();
      console.log(`Video generation progress: ${status.progress}% (${status.status})`);

      // Log the full response to debug
      console.log("Full status response:", JSON.stringify(status, null, 2));

      // Check if completed - return immediately with the URL
      if (status.status === "completed") {
        // OpenAI videos require authentication, so we use a proxy endpoint
        // that will fetch the video with our API key and serve it to the client
        const proxyUrl = `/api/generate-video/download/${status.id}`;

        console.log(`Video completed! Video ID: ${status.id}`);
        console.log(`Proxy URL: ${proxyUrl}`);

        return {
          url: proxyUrl,
          status: status.status,
          videoId: status.id
        };
      }

      if (status.status === "failed") {
        throw new Error(status.error || "Video generation failed");
      }

      // Still in progress, wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));

    } catch (error) {
      // If it's a network error or timeout, retry
      if (error instanceof TypeError || (error as any).code === 'ECONNRESET') {
        console.log(`Network error, retrying... (${attempt + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }
      // Re-throw other errors
      throw error;
    }
  }

  throw new Error("Video generation timed out after 10 minutes");
}
