"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Upload, File, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";

interface UploadedFile extends File {
  preview?: string;
  id: string;
}

interface AnalysisResult {
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

interface FileUploadProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
}

export function FileUpload({ onFilesChange, onAnalysisComplete }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImages = async () => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsAnalyzing(true);
    try {
      // For now, analyze the first image. In the future, this could analyze multiple images
      const formData = new FormData();
      formData.append('file', imageFiles[0]);

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      onAnalysisComplete?.(result.analysis);
    } catch (error) {
      console.error('Image analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasImages = files.some(file => file.type.startsWith('image/'));

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => {
      const fileWithId = Object.assign(file, {
        id: Math.random().toString(36).substring(2, 11),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
      return fileWithId;
    });

    const updated = [...files, ...newFiles];
    setFiles(updated);
  }, [files]);

  // Use effect to call onFilesChange when files change
  useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'model/*': ['.obj', '.fbx'],
      'application/octet-stream': ['.obj', '.fbx'],
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Support for images (PNG, JPEG) and 3D models (OBJ, FBX)
                </p>
                <Button variant="outline">Browse Files</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Uploaded Files ({files.length})</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                        <Image
                          src={file.preview}
                          alt={file.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <File className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {hasImages && (
              <div className="mt-6 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Ready to analyze your images and generate AI prompts?
                  </p>
                  <Button 
                    onClick={analyzeImages}
                    disabled={isAnalyzing}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing Images...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze Images & Generate JSON
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}