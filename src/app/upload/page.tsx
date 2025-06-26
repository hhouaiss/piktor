"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/upload/file-upload";
import { JsonEditor } from "@/components/upload/json-editor";

interface UploadedFile extends File {
  preview?: string;
  id: string;
}

interface AnalysisData {
  product?: {
    name?: string;
    material?: string;
    color?: string;
    dimensions?: string | object;
    style?: string;
  };
  output?: {
    type?: "packshot" | "lifestyle" | "instagram";
    aspect_ratio?: string;
  };
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Upload Your Furniture Images</h1>
          <p className="text-muted-foreground">
            Upload images from multiple angles or 3D models to generate AI-powered product visuals
          </p>
        </div>

        <div className="grid xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>
                  Upload images (PNG/JPEG, min 2K resolution) or 3D models (OBJ/FBX)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFilesChange={setUploadedFiles} 
                  onAnalysisComplete={setAnalysisData}
                />
              </CardContent>
            </Card>

            {uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Preview uploaded images and 3D models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="aspect-square bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center"
                      >
                        {file.preview ? (
                          <Image
                            src={file.preview}
                            alt={file.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted-foreground text-sm">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              3D Model
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <JsonEditor initialData={analysisData || undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}