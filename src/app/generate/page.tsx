"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/upload/file-upload";
import { JsonEditor } from "@/components/upload/json-editor";
import { Sparkles, Download, Loader2, ImageIcon, CheckCircle, AlertCircle } from "lucide-react";

interface UploadedFile extends File {
  preview?: string;
  id: string;
}

interface Feature {
  name: string;
  description: string;
  location: string;
  visibility: string;
}

interface Dimension {
  name: string;
  value: string;
  unit: string;
}

interface Constraints {
  strict_mode: boolean;
  must_be_wall_mounted: boolean;
  no_furniture_on_floor: boolean;
  no_extra_objects: boolean;
  respect_all_dimensions: boolean;
  no_text_in_image: boolean;
  no_labels: boolean;
}

interface AnalysisData {
  product?: {
    name?: string;
    material?: string;
    color?: string;
    dimensions?: string | object;
    style?: string;
    features?: Feature[];
  };
  output?: {
    type?: "packshot" | "lifestyle" | "instagram";
    aspect_ratio?: string;
    camera_angle?: string;
    prompt?: string;
  };
  constraints?: Constraints;
}

interface PromptData {
  product: {
    name: string;
    category: string;
    material: string;
    color: string;
    dimensions: Dimension[];
    style: string;
    features: Feature[];
  };
  output: {
    type: "packshot" | "lifestyle" | "instagram";
    background: string;
    lighting: string;
    aspectRatio: string;
    cameraAngle: string;
  };
  branding: {
    aesthetic: string;
    moodKeywords: string[];
  };
  constraints: Constraints;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  metadata: {
    model: string;
    timestamp: string;
    settings: PromptData;
  };
}

export default function GeneratePage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleAnalysisComplete = (analysis: AnalysisData) => {
    setAnalysisData(analysis);
    setCurrentStep(2);
  };

  const handlePromptDataChange = (data: PromptData) => {
    setPromptData(data);
  };

  const generateImage = async () => {
    if (!promptData || uploadedFiles.length === 0) return;

    setIsGenerating(true);
    setGenerationError(null);
    setCurrentStep(3);

    try {
      const formData = new FormData();
      
      // Add the first uploaded image
      const imageFile = uploadedFiles.find(f => f.type.startsWith('image/'));
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      // Add the prompt data
      formData.append('promptData', JSON.stringify(promptData));
      formData.append('analysisData', JSON.stringify(analysisData));

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const result = await response.json();
      
      const newImage: GeneratedImage = {
        url: result.imageUrl,
        prompt: result.prompt,
        metadata: {
          model: 'gpt-image-1',
          timestamp: new Date().toISOString(),
          settings: promptData
        }
      };

      setGeneratedImages([newImage, ...generatedImages]);
      setCurrentStep(4);
    } catch (error) {
      console.error('Image generation failed:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const resetGeneration = () => {
    setCurrentStep(1);
    setUploadedFiles([]);
    setAnalysisData(null);
    setPromptData(null);
    setGeneratedImages([]);
    setGenerationError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">AI Image Generation Studio</h1>
          <p className="text-muted-foreground">
            Upload furniture images, configure parameters, and generate professional product visuals with GPT Image
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { step: 1, title: "Upload", description: "Upload & Analyze" },
              { step: 2, title: "Configure", description: "Edit Parameters" },
              { step: 3, title: "Generate", description: "Create Images" },
              { step: 4, title: "Download", description: "Get Results" }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`flex flex-col items-center ${index < 3 ? 'mr-4' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= item.step 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > item.step ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      item.step
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > item.step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-8">
          {/* Left Column - Upload & Configuration */}
          <div className="space-y-6">
            {/* Step 1: Upload */}
            <Card className={currentStep === 1 ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    1
                  </span>
                  File Upload & Analysis
                </CardTitle>
                <CardDescription>
                  Upload furniture images to automatically generate JSON metadata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFilesChange={setUploadedFiles} 
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </CardContent>
            </Card>

            {/* Preview uploaded files */}
            {uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Image Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="aspect-square bg-muted/50 rounded-lg overflow-hidden relative"
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
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Configuration */}
            {analysisData && (
              <Card className={currentStep === 2 ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      2
                    </span>
                    Parameter Configuration
                  </CardTitle>
                  <CardDescription>
                    Review and adjust the generated parameters
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Right Column - JSON Editor & Generation */}
          <div className="space-y-6">
            {analysisData && (
              <JsonEditor 
                initialData={analysisData} 
                onDataChange={handlePromptDataChange}
              />
            )}

            {/* Step 3: Generation */}
            {promptData && (
              <Card className={currentStep === 3 ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      3
                    </span>
                    Image Generation
                  </CardTitle>
                  <CardDescription>
                    Generate professional product images using GPT Image
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generationError && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">Generation Error</p>
                      </div>
                      <p className="text-sm text-destructive/80 mt-1">{generationError}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={generateImage}
                      disabled={isGenerating || !promptData}
                      size="lg"
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Image...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={resetGeneration}
                      disabled={isGenerating}
                    >
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Results */}
            {generatedImages.length > 0 && (
              <Card className={currentStep === 4 ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      4
                    </span>
                    Generated Images
                  </CardTitle>
                  <CardDescription>
                    Download and use your generated product images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedImages.map((image, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="aspect-video bg-muted/50 rounded-lg overflow-hidden mb-4 relative">
                          <Image
                            src={image.url}
                            alt={`Generated image ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-1">
                              Generated on {new Date(image.metadata.timestamp).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {image.prompt}
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadImage(
                              image.url, 
                              `piktor-generated-${Date.now()}.png`
                            )}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}