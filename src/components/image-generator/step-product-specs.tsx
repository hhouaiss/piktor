"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Edit3, Sparkles } from "lucide-react";
import { ProductImages, ProductProfile, DetectedField, createDetectedField, getFieldValue } from "./types";
import { cn } from "@/lib/utils";

interface StepProductSpecsProps {
  productImages: ProductImages | null;
  onProductImagesChange: (productImages: ProductImages) => void;
  onComplete: () => void;
  isActive: boolean;
}

export function StepProductSpecs({ productImages, onProductImagesChange, onComplete, isActive }: StepProductSpecsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Local state for override values
  const [overrides, setOverrides] = useState({
    realDimensions: productImages?.fusedProfile?.realDimensions || { width: 0, height: 0, depth: 0 },
    colorOverride: productImages?.fusedProfile?.colorOverride || '',
    notes: productImages?.fusedProfile?.notes || '',
  });

  const analyzeProductImages = useCallback(async () => {
    if (!productImages?.images.length) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Call the multi-image analysis API
      const formData = new FormData();
      
      // Create proper File objects from UploadedImage objects
      for (let index = 0; index < productImages.images.length; index++) {
        const uploadedImage = productImages.images[index];
        
        // Create a proper File object from the UploadedImage
        const file = new File([await uploadedImage.arrayBuffer()], uploadedImage.name, {
          type: uploadedImage.type,
          lastModified: uploadedImage.lastModified,
        });
        
        formData.append(`image_${index}`, file);
      }
      
      const response = await fetch('/api/analyze-product-profile', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze product images');
      }
      
      const result = await response.json();
      
      // Create fused profile with DetectedField pattern + enhanced data
      const fusedProfile: ProductProfile = {
        type: createDetectedField(result.type || 'furniture'),
        materials: createDetectedField(result.materials || 'unknown'),
        detectedColor: createDetectedField(result.colorHex || '#ffffff'),
        style: createDetectedField(result.style || 'modern'),
        features: createDetectedField(result.features || []),
        placementType: createDetectedField(result.placementType || 'floor_standing'),
        
        // Enhanced analysis data from GPT-4o (CRITICAL for generation)
        colorAnalysis: result.colorAnalysis,
        detailedFeatures: result.detailedFeatures,
        estimatedDimensions: result.estimatedDimensions,
        contextRecommendations: result.contextRecommendations,
        textToImagePrompts: result.textToImagePrompts, // REQUIRED for GPT-image-1 generation
        
        // Override fields
        realDimensions: overrides.realDimensions,
        colorOverride: overrides.colorOverride,
        notes: overrides.notes,
        
        // Analysis metadata
        analysisVersion: result.analysisVersion,
        analysisModel: result.analysisModel,
        analysisTimestamp: result.analysisTimestamp,
        sourceImageCount: result.sourceImageCount,
      };
      
      onProductImagesChange({
        ...productImages,
        fusedProfile,
        isAnalyzing: false,
        analysisError: undefined,
      });
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      onProductImagesChange({
        ...productImages,
        isAnalyzing: false,
        analysisError: error instanceof Error ? error.message : 'Analysis failed',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [productImages, overrides, onProductImagesChange]);

  const updateDetectedField = <T,>(
    fieldName: keyof ProductProfile,
    value: T,
    source: 'detected' | 'override'
  ) => {
    if (!productImages?.fusedProfile) return;
    
    const updatedProfile = {
      ...productImages.fusedProfile,
      [fieldName]: { value, source } as DetectedField<T>,
    };
    
    onProductImagesChange({
      ...productImages,
      fusedProfile: updatedProfile,
    });
  };

  const updateOverrideField = (fieldName: 'realDimensions' | 'colorOverride' | 'notes', value: string | { width: number; height: number; depth: number }) => {
    const newOverrides = { ...overrides, [fieldName]: value };
    setOverrides(newOverrides);
    
    if (productImages?.fusedProfile) {
      onProductImagesChange({
        ...productImages,
        fusedProfile: {
          ...productImages.fusedProfile,
          [fieldName]: value,
        },
      });
    }
  };

  const hasProfile = productImages?.fusedProfile;
  const canContinue = hasProfile && !isAnalyzing;

  return (
    <Card className={cn(isActive && "ring-2 ring-primary")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            2
          </span>
          Product Specs
        </CardTitle>
        <CardDescription>
          AI analyzes your product images to detect specifications. You can override any detected values.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Analysis Trigger */}
        {!hasProfile && !isAnalyzing && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Analyze Product</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI will analyze all {productImages?.images.length || 0} images to detect product specifications
            </p>
            <Button onClick={analyzeProductImages} size="lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Product Images
            </Button>
          </div>
        )}

        {/* Analysis in Progress */}
        {isAnalyzing && (
          <div className="text-center py-8 border-2 border-dashed border-primary/25 rounded-lg">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Analyzing Product Images...</h3>
            <p className="text-sm text-muted-foreground">
              AI is processing {productImages?.images.length || 0} images to detect product specifications
            </p>
          </div>
        )}

        {/* Analysis Error */}
        {analysisError && (
          <div className="text-center py-8 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
            <h3 className="text-lg font-medium mb-2 text-red-800">Analysis Failed</h3>
            <p className="text-sm text-red-600 mb-4">{analysisError}</p>
            <Button onClick={analyzeProductImages} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* AI Detected Section */}
        {hasProfile && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">AI Detected Specifications</h3>
                <Badge variant="secondary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Type */}
                {productImages.fusedProfile?.type && (
                  <DetectedFieldEditor
                    label="Product Type"
                    field={productImages.fusedProfile.type}
                    onUpdate={(value, source) => updateDetectedField('type', value, source)}
                  />
                )}

                {/* Materials */}
                {productImages.fusedProfile?.materials && (
                  <DetectedFieldEditor
                    label="Materials"
                    field={productImages.fusedProfile.materials}
                    onUpdate={(value, source) => updateDetectedField('materials', value, source)}
                  />
                )}

                {/* Detected Color */}
                {productImages.fusedProfile?.detectedColor && (
                  <div>
                    <Label className="text-sm font-medium">Detected Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-8 h-8 rounded border-2 border-gray-200"
                        style={{ backgroundColor: getFieldValue(productImages.fusedProfile.detectedColor) }}
                      />
                      <Input 
                        value={getFieldValue(productImages.fusedProfile.detectedColor)}
                        onChange={(e) => updateDetectedField('detectedColor', e.target.value, 'override')}
                        placeholder="#ffffff"
                        className="font-mono text-xs"
                      />
                      <Badge variant={productImages.fusedProfile.detectedColor.source === 'detected' ? 'secondary' : 'outline'}>
                        {productImages.fusedProfile.detectedColor.source === 'detected' ? 'AI' : 'Override'}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Style */}
                {productImages.fusedProfile?.style && (
                  <DetectedFieldEditor
                    label="Style"
                    field={productImages.fusedProfile.style}
                    onUpdate={(value, source) => updateDetectedField('style', value, source)}
                  />
                )}


                {/* Features */}
                {productImages.fusedProfile?.features && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Features</Label>
                    <div className="mt-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {getFieldValue(productImages.fusedProfile.features)?.map((feature, index) => (
                          <Badge key={index} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Badge variant={productImages.fusedProfile.features.source === 'detected' ? 'secondary' : 'outline'}>
                        {productImages.fusedProfile.features.source === 'detected' ? 'AI Detected' : 'Overridden'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Override Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Override & Additional Info</h3>
                <Badge variant="outline">
                  <Edit3 className="w-3 h-3 mr-1" />
                  Manual Input
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Real Dimensions */}
                <div>
                  <Label className="text-sm font-medium">Real Dimensions (cm)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Width"
                      value={overrides.realDimensions.width || ''}
                      onChange={(e) => updateOverrideField('realDimensions', {
                        ...overrides.realDimensions,
                        width: parseFloat(e.target.value) || 0
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Height"
                      value={overrides.realDimensions.height || ''}
                      onChange={(e) => updateOverrideField('realDimensions', {
                        ...overrides.realDimensions,
                        height: parseFloat(e.target.value) || 0
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Depth"
                      value={overrides.realDimensions.depth || ''}
                      onChange={(e) => updateOverrideField('realDimensions', {
                        ...overrides.realDimensions,
                        depth: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>

                {/* Color Override */}
                <div>
                  <Label className="text-sm font-medium">Color Override (Hex)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-200"
                      style={{ backgroundColor: overrides.colorOverride || '#ffffff' }}
                    />
                    <Input 
                      value={overrides.colorOverride}
                      onChange={(e) => updateOverrideField('colorOverride', e.target.value)}
                      placeholder="#ffffff - Override detected color"
                      className="font-mono text-xs"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use AI detected color
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <Textarea
                    value={overrides.notes}
                    onChange={(e) => updateOverrideField('notes', e.target.value)}
                    placeholder="Additional context or special instructions for generation..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  Product specifications ready
                </span>
              </div>
              
              <Button
                onClick={onComplete}
                disabled={!canContinue}
                size="lg"
              >
                Continue to Generation Settings
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for editing detected fields
function DetectedFieldEditor<T>({ 
  label, 
  field, 
  onUpdate 
}: { 
  label: string;
  field: DetectedField<T>;
  onUpdate: (value: T, source: 'detected' | 'override') => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <Input 
          value={String(getFieldValue(field))}
          onChange={(e) => onUpdate(e.target.value as T, 'override')}
          className="flex-1"
        />
        <Badge variant={field.source === 'detected' ? 'secondary' : 'outline'}>
          {field.source === 'detected' ? 'AI' : 'Override'}
        </Badge>
      </div>
    </div>
  );
}