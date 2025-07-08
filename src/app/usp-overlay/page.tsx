"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadCanvas } from "@/components/usp/image-upload-canvas";
import { USPControls } from "@/components/usp/usp-controls";

interface USPTextConfig {
  content: string;
  position: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right";
  font_family: string;
  font_size: string;
  font_weight: string;
  color: string;
  background_color?: string;
  opacity: number;
}

interface UploadedImage {
  file: File;
  url: string;
}

export default function USPOverlayPage() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [uspConfig, setUSPConfig] = useState<USPTextConfig>({
    content: "",
    position: "bottom-center",
    font_family: "Arial",
    font_size: "24",
    font_weight: "bold",
    color: "#FFFFFF",
    background_color: "#000000",
    opacity: 0.9,
  });
  const [generatedJSON, setGeneratedJSON] = useState<string>("");

  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image);
  };

  const handleUSPConfigChange = (newConfig: Partial<USPTextConfig>) => {
    setUSPConfig(prev => ({ ...prev, ...newConfig }));
  };

  const generateJSON = () => {
    if (!uploadedImage || !uspConfig.content.trim()) {
      return;
    }

    const jsonOutput = {
      meta: {
        format: "usp_overlay",
        platform: "marketing",
        use_case: "product_marketing",
        generated_at: new Date().toISOString(),
        version: "1.0"
      },
      source_image: {
        filename: uploadedImage.file.name,
        size: uploadedImage.file.size,
        type: uploadedImage.file.type,
        dimensions: "auto-detected"
      },
      usp_overlay: {
        enabled: true,
        content: uspConfig.content,
        position: uspConfig.position,
        style: {
          font_family: uspConfig.font_family,
          font_size: uspConfig.font_size,
          font_weight: uspConfig.font_weight,
          color: uspConfig.color,
          background_color: uspConfig.background_color,
          opacity: uspConfig.opacity
        },
        rendering_instructions: `Render the USP text "${uspConfig.content}" in ${uspConfig.position.replace(/-/g, ' ')} position with ${uspConfig.font_family} font, size ${uspConfig.font_size}, weight ${uspConfig.font_weight}, color ${uspConfig.color}${uspConfig.background_color ? `, background ${uspConfig.background_color}` : ''}, opacity ${uspConfig.opacity}`
      },
      generation_prompt: `Add the marketing text "${uspConfig.content}" to this product image. Position the text at ${uspConfig.position.replace(/-/g, ' ')} using ${uspConfig.font_family} font, ${uspConfig.font_size} size, ${uspConfig.font_weight} weight, in ${uspConfig.color} color${uspConfig.background_color ? ` with ${uspConfig.background_color} background` : ''}. Set opacity to ${uspConfig.opacity}. Ensure the text is clearly readable and professionally positioned for marketing purposes.`,
      export_settings: {
        format: "PNG",
        quality: "high",
        compression: "lossless",
        color_profile: "sRGB",
        metadata: {
          title: `USP Overlay for ${uploadedImage.file.name}`,
          description: "Product image with marketing USP text overlay",
          keywords: ["marketing", "usp", "overlay", "product"],
          creator: "Piktor AI"
        }
      }
    };

    setGeneratedJSON(JSON.stringify(jsonOutput, null, 2));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">USP Overlay Generator</h1>
          <p className="text-muted-foreground">
            Upload your product image and add compelling marketing text with live preview
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Image Upload and Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Image Upload & Preview</CardTitle>
                <CardDescription>
                  Upload your product image and see the USP text overlay in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploadCanvas 
                  onImageUpload={handleImageUpload}
                  uspConfig={uspConfig}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - USP Controls and JSON Output */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>USP Text Controls</CardTitle>
                <CardDescription>
                  Customize your marketing text overlay
                </CardDescription>
              </CardHeader>
              <CardContent>
                <USPControls 
                  config={uspConfig}
                  onChange={handleUSPConfigChange}
                  onGenerateJSON={generateJSON}
                  disabled={!uploadedImage || !uspConfig.content.trim()}
                  generatedJSON={generatedJSON}
                />
              </CardContent>
            </Card>

            {generatedJSON && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated JSON & Prompt</CardTitle>
                  <CardDescription>
                    Copy this configuration for your AI image generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                    {generatedJSON}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}