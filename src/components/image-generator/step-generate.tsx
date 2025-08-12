"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
// Removed Dialog imports - no longer needed without prompt preview
import { Sparkles, Download, RefreshCw, Loader2, AlertCircle, CheckCircle, Eye, Camera, ImageIcon } from "lucide-react";
import { ProductConfiguration, GeneratedImage, getFieldValue } from "./types";
// Removed buildOptimizedPrompt import - using comprehensive prompts without optimization
import { cn } from "@/lib/utils";

interface StepGenerateProps {
  productConfiguration: ProductConfiguration | null;
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  generationProgress?: {
    current: number;
    total: number;
    stage: string;
  };
  generationError?: string;
  generationApproach: 'reference' | 'text';
  onGenerate: (useReferenceApproach?: boolean) => void;
  onRegenerate: (imageId: string) => void;
  onDownload: (imageUrl: string, filename: string) => void;
  onDownloadAll: () => void;
  isActive: boolean;
}

export function StepGenerate({
  productConfiguration,
  generatedImages,
  isGenerating,
  generationProgress,
  generationError,
  generationApproach,
  onGenerate,
  onRegenerate,
  onDownload,
  onDownloadAll,
  isActive,
}: StepGenerateProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  if (!productConfiguration) return null;

  const settings = productConfiguration.uiSettings;
  const productImages = productConfiguration.productImages;
  const profile = productImages.fusedProfile;
  const primaryImage = productImages.images.find(img => img.id === productImages.primaryImageId);
  
  const totalExpectedImages = settings.variations;
  const hasGeneratedImages = generatedImages.length > 0;

  const downloadImage = async (imageUrl: string, filename: string) => {
    onDownload(imageUrl, filename);
  };

  const regenerateImage = (imageId: string) => {
    onRegenerate(imageId);
  };

  const getImageFilename = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const productName = productImages.productName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `piktor-${productName}-${settings.contextPreset}-${timestamp}.png`;
  };

  return (
    <Card className={cn(isActive && "ring-2 ring-primary")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            4
          </span>
          Generate
        </CardTitle>
        <CardDescription>
          Generate professional product images using your fused product profile and primary reference image.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Product Summary */}
        <div className="bg-muted/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Product: {productImages.productName}</h3>
            <Badge variant="outline">{settings.contextPreset.toUpperCase()}</Badge>
          </div>
          
          {/* Primary Reference Image */}
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 bg-muted/50 rounded-lg overflow-hidden flex-shrink-0">
              {primaryImage && (
                <Image
                  src={primaryImage.preview}
                  alt="Primary reference"
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
              <div className="absolute top-1 right-1">
                <Camera className="w-3 h-3 text-white bg-black/50 rounded-full p-0.5" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Primary Reference Image</p>
              <p className="text-xs text-muted-foreground">Using: {primaryImage?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm">{productImages.images.length} images</p>
              <p className="text-xs text-muted-foreground">uploaded</p>
            </div>
          </div>

          {/* Product Specs Summary */}
          {profile && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t">
              <div className="text-xs">
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{getFieldValue(profile.type)}</p>
              </div>
              <div className="text-xs">
                <p className="text-muted-foreground">Style</p>
                <p className="font-medium">{getFieldValue(profile.style)}</p>
              </div>
              <div className="text-xs">
                <p className="text-muted-foreground">Color</p>
                <div className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: profile.colorOverride || getFieldValue(profile.detectedColor) }}
                  />
                  <span className="font-medium text-xs">
                    {profile.colorOverride ? 'Override' : 'Detected'}
                  </span>
                </div>
              </div>
              <div className="text-xs">
                <p className="text-muted-foreground">Wall Mount</p>
                <p className="font-medium">{getFieldValue(profile.wallMounted) ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Prompt Preview removed as requested - using comprehensive prompts without preview */}

        {/* Generation Status */}
        {!hasGeneratedImages && !isGenerating && (
          <div className="text-center py-8 bg-muted/20 rounded-lg">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
            <p className="text-muted-foreground mb-4">
              Generate {totalExpectedImages} {settings.contextPreset} image{totalExpectedImages !== 1 ? 's' : ''} using your product profile
            </p>
            <Button onClick={() => onGenerate()} size="lg" className="px-8">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Images
            </Button>
          </div>
        )}

        {/* Generation Progress */}
        {isGenerating && generationProgress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">Generating Images...</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {generationProgress.current} / {generationProgress.total}
              </span>
            </div>
            
            <Progress 
              value={(generationProgress.current / generationProgress.total) * 100} 
              className="h-2"
            />
            
            <p className="text-sm text-muted-foreground">
              {generationProgress.stage}
            </p>
          </div>
        )}

        {/* Generation Error */}
        {generationError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-4 w-4" />
              <p className="font-medium">Generation Error</p>
            </div>
            <p className="text-sm text-destructive/80">{generationError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerate()}
              className="mt-3"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Generated Images Grid */}
        {hasGeneratedImages && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Generated Images ({generatedImages.length})
              </h3>
              {generatedImages.length > 1 && (
                <Button variant="outline" onClick={onDownloadAll}>
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((image) => {
                return (
                  <div key={image.id} className="group border rounded-lg overflow-hidden">
                    <div className="relative bg-muted/50" style={{ aspectRatio: settings.contextPreset === 'story' ? '2/3' : settings.contextPreset === 'hero' ? '3/2' : '1/1' }}>
                      <Image
                        src={image.url}
                        alt={`Generated ${settings.contextPreset} for ${productImages.productName}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedImage(image)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => downloadImage(image.url, getImageFilename())}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => regenerateImage(image.id)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {settings.contextPreset}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {image.metadata.size}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => downloadImage(image.url, getImageFilename())}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => regenerateImage(image.id)}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p>Quality: {image.metadata.quality}</p>
                        <p>Generated: {new Date(image.metadata.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Generate More Button */}
            {!isGenerating && (
              <div className="text-center pt-4 border-t">
                <Button 
                  onClick={() => onGenerate(generationApproach === 'reference')} 
                  variant="outline" 
                  size="lg"
                  disabled={generationApproach === 'reference' && !primaryImage}
                >
                  {generationApproach === 'reference' ? (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate More with {generationApproach === 'reference' ? 'Reference' : 'Text'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <Image
                  src={selectedImage.url}
                  alt="Generated image preview"
                  width={800}
                  height={800}
                  className="max-h-[80vh] w-auto"
                  unoptimized
                />
                <Button
                  className="absolute top-4 right-4"
                  variant="secondary"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </Button>
              </div>
              <div className="p-4">
                <h4 className="font-medium mb-2">Generation Details</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedImage.prompt}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => downloadImage(selectedImage.url, getImageFilename())}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => regenerateImage(selectedImage.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Removed PromptPreview components - using comprehensive prompts without UI preview as requested