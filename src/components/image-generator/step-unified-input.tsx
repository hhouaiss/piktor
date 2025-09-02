"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Upload, X, Image as ImageIcon, Instagram, Facebook, Camera, Home, Package, Smartphone } from "lucide-react";
import { ProductInput, ProductSpecs, UploadedImage, createProductInput, ContextSelection, ContextType, SocialMediaFormat, CONTEXT_TYPE_CONFIG, createContextSelection } from "./types";
import { cn } from "@/lib/utils";

interface StepUnifiedInputProps {
  productInput: ProductInput | null;
  contextSelection: ContextSelection | null;
  onProductInputChange: (productInput: ProductInput) => void;
  onContextSelectionChange: (selection: ContextSelection) => void;
  onComplete: () => void;
  isActive: boolean;
}

export function StepUnifiedInput({ 
  productInput, 
  contextSelection,
  onProductInputChange, 
  onContextSelectionChange,
  onComplete, 
  isActive 
}: StepUnifiedInputProps) {
  const [specs, setSpecs] = useState<ProductSpecs>({
    productName: productInput?.specs.productName || '',
    productType: productInput?.specs.productType || '',
    materials: productInput?.specs.materials || '',
    dimensions: productInput?.specs.dimensions || undefined,
    additionalSpecs: productInput?.specs.additionalSpecs || '',
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(
    productInput?.images || []
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Context selection state
  const [selectedContextType, setSelectedContextType] = useState<ContextType | null>(
    contextSelection?.contextType || null
  );
  const [selectedSocialFormat, setSelectedSocialFormat] = useState<SocialMediaFormat | null>(
    contextSelection?.socialMediaFormat || null
  );
  const [showSocialFormats, setShowSocialFormats] = useState(
    contextSelection?.contextType === 'social-media'
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update product input when specs or images change
  const updateProductInput = useCallback((newSpecs: ProductSpecs, newImages: UploadedImage[]) => {
    if (newImages.length > 0 && newSpecs.productName) {
      const input = createProductInput(newImages, newSpecs);
      onProductInputChange(input);
    }
  }, [onProductInputChange]);

  // Handle spec changes
  const handleSpecChange = (field: keyof ProductSpecs, value: string | number) => {
    const newSpecs = { ...specs, [field]: value };
    setSpecs(newSpecs);
    updateProductInput(newSpecs, uploadedImages);
  };

  // Handle dimension changes
  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newDimensions = { ...specs.dimensions, [dimension]: numValue };
    const newSpecs = { ...specs, dimensions: newDimensions };
    setSpecs(newSpecs);
    updateProductInput(newSpecs, uploadedImages);
  };

  // File handling
  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!files.length) return;
    
    setIsUploading(true);
    setUploadError(null);

    try {
      const newImages: UploadedImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`);
        }
        
        // Create preview URL
        const preview = URL.createObjectURL(file);
        
        // Create UploadedImage object
        const uploadedImage = Object.assign(file, {
          id: `${Date.now()}-${i}-${file.name}`,
          preview,
        }) as UploadedImage;
        
        newImages.push(uploadedImage);
      }
      
      const updatedImages = [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
      updateProductInput(specs, updatedImages);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [uploadedImages, specs, updateProductInput]);

  // Remove image
  const removeImage = (imageId: string) => {
    const imageToRemove = uploadedImages.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedImages = uploadedImages.filter(img => img.id !== imageId);
    setUploadedImages(updatedImages);
    updateProductInput(specs, updatedImages);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Context selection handlers
  const handleContextTypeSelect = (contextType: ContextType) => {
    setSelectedContextType(contextType);
    
    if (contextType === 'social-media') {
      setShowSocialFormats(true);
      setSelectedSocialFormat(null);
    } else {
      setShowSocialFormats(false);
      setSelectedSocialFormat(null);
      
      // Immediately create and emit selection for non-social-media types
      const selection = createContextSelection(contextType);
      onContextSelectionChange(selection);
    }
  };

  const handleSocialFormatSelect = (format: SocialMediaFormat) => {
    setSelectedSocialFormat(format);
    
    // Create and emit selection for social media with format
    const selection = createContextSelection('social-media', format);
    onContextSelectionChange(selection);
  };

  const isContextSelectionComplete = () => {
    return contextSelection && (
      contextSelection.contextType !== 'social-media' || 
      (contextSelection.contextType === 'social-media' && contextSelection.socialMediaFormat)
    );
  };

  const getContextIcon = (contextType: ContextType) => {
    switch (contextType) {
      case 'packshot':
        return Package;
      case 'social-media':
        return Smartphone;
      case 'lifestyle':
        return Home;
      default:
        return Camera;
    }
  };

  // Validation
  const isValid = uploadedImages.length > 0 && 
                  specs.productName.trim() !== '' && 
                  specs.productType.trim() !== '' &&
                  isContextSelectionComplete();

  return (
    <Card className={cn(isActive && "ring-2 ring-primary")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
            isActive ? "bg-gradient-ocean-gold text-white" : "bg-muted text-muted-foreground"
          )}>
            1
          </span>
          Generate Product Images
        </CardTitle>
        <CardDescription>
          Choose your image context, upload product images, and provide specifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Image Upload Section */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Product Images</Label>
          
          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              uploadedImages.length > 0 ? "mb-4" : ""
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span>Uploading images...</span>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Product Images</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your images here, or click to select files
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Images
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                />
              </>
            )}
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="text-red-600 text-sm mt-2">{uploadError}</div>
          )}

          {/* Uploaded Images Grid */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={image.preview}
                      alt={image.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-1 left-1 text-xs"
                  >
                    {image.name.length > 10 ? image.name.substring(0, 10) + '...' : image.name}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Upload multiple images of your product from different angles for best results
          </p>
        </div>

        {/* Product Specifications */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Product Specifications</Label>
          
          <div className="space-y-4">
            {/* Product Name - Required */}
            <div>
              <Label htmlFor="productName" className="text-sm font-medium">
                Product Name *
              </Label>
              <Input
                id="productName"
                value={specs.productName}
                onChange={(e) => handleSpecChange('productName', e.target.value)}
                placeholder="e.g., Modern Office Chair, Floating Desk, etc."
                className="mt-1"
              />
            </div>

            {/* Product Type - Required */}
            <div>
              <Label htmlFor="productType" className="text-sm font-medium">
                Product Type *
              </Label>
              <Input
                id="productType"
                value={specs.productType}
                onChange={(e) => handleSpecChange('productType', e.target.value)}
                placeholder="e.g., ergonomic office chair, wall-mounted desk, table lamp"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific about the type and mounting/placement style
              </p>
            </div>

            {/* Materials */}
            <div>
              <Label htmlFor="materials" className="text-sm font-medium">
                Materials
              </Label>
              <Input
                id="materials"
                value={specs.materials}
                onChange={(e) => handleSpecChange('materials', e.target.value)}
                placeholder="e.g., solid oak, brushed aluminum, full-grain leather"
                className="mt-1"
              />
            </div>

            {/* Dimensions */}
            <div>
              <Label className="text-sm font-medium">Dimensions (cm)</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Width"
                  value={specs.dimensions?.width || ''}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Height"
                  value={specs.dimensions?.height || ''}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Depth"
                  value={specs.dimensions?.depth || ''}
                  onChange={(e) => handleDimensionChange('depth', e.target.value)}
                />
              </div>
            </div>

            {/* Additional Specifications */}
            <div>
              <Label htmlFor="additionalSpecs" className="text-sm font-medium">
                Additional Specifications
              </Label>
              <Textarea
                id="additionalSpecs"
                value={specs.additionalSpecs || ''}
                onChange={(e) => handleSpecChange('additionalSpecs', e.target.value)}
                placeholder="Any additional details, special features, color specifications, or generation instructions..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Context Selection Section */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Choose Image Context</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Select the type of images you want to create for your product
          </p>
          
          {/* Main Context Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(Object.keys(CONTEXT_TYPE_CONFIG) as ContextType[]).map((contextType) => {
              const config = CONTEXT_TYPE_CONFIG[contextType];
              const IconComponent = getContextIcon(contextType);
              const isSelected = selectedContextType === contextType;
              
              return (
                <Card
                  key={contextType}
                  variant={isSelected ? "premium" : "outlined"}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:scale-105",
                    isSelected && "ring-2 ring-ocean-blue-500 shadow-lg"
                  )}
                  onClick={() => handleContextTypeSelect(contextType)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="mb-3">
                      <div className={cn(
                        "w-12 h-12 mx-auto rounded-full flex items-center justify-center transition-colors",
                        isSelected 
                          ? "bg-gradient-ocean-gold text-white" 
                          : "bg-sophisticated-gray-100 text-sophisticated-gray-600 dark:bg-sophisticated-gray-800 dark:text-sophisticated-gray-400"
                      )}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-base mb-2">{config.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {config.description}
                    </p>
                    
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">
                        {config.size}
                      </Badge>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {config.examples.slice(0, 2).map((example, index) => (
                          <Badge 
                            key={index}
                            variant="outline" 
                            className="text-xs"
                          >
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="mt-3">
                        <CheckCircle className="w-5 h-5 mx-auto text-ocean-blue-600" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Social Media Format Selection */}
          {showSocialFormats && selectedContextType === 'social-media' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <h4 className="text-base font-semibold mb-2">Choose Social Media Format</h4>
                <p className="text-sm text-muted-foreground">
                  Select the format that best fits your social media strategy
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {(Object.keys(CONTEXT_TYPE_CONFIG['social-media'].formats) as SocialMediaFormat[]).map((format) => {
                  const formatConfig = CONTEXT_TYPE_CONFIG['social-media'].formats[format];
                  const isSelected = selectedSocialFormat === format;
                  const IconComponent = format === 'square' ? Instagram : Facebook;
                  
                  return (
                    <Card
                      key={format}
                      variant={isSelected ? "premium" : "outlined"}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:scale-105",
                        isSelected && "ring-2 ring-ocean-blue-500 shadow-lg"
                      )}
                      onClick={() => handleSocialFormatSelect(format)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="mb-3">
                          <div className={cn(
                            "w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-colors",
                            isSelected 
                              ? "bg-gradient-ocean-gold text-white" 
                              : "bg-sophisticated-gray-100 text-sophisticated-gray-600 dark:bg-sophisticated-gray-800 dark:text-sophisticated-gray-400"
                          )}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                        </div>
                        
                        <h4 className="font-semibold mb-2">{formatConfig.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {formatConfig.description}
                        </p>
                        
                        <Badge variant="secondary" className="text-xs">
                          {formatConfig.size}
                        </Badge>
                        
                        {isSelected && (
                          <div className="mt-3">
                            <CheckCircle className="w-4 h-4 mx-auto text-ocean-blue-600" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="flex justify-between items-center pt-4 border-t">
          {isValid ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">
                Ready for generation - {uploadedImages.length} images, context selected
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {!isContextSelectionComplete()
                  ? "Select image context first"
                  : uploadedImages.length === 0 
                    ? "Upload images and fill required fields"
                    : "Complete required fields (Product Name & Type)"
                }
              </span>
            </div>
          )}
          
          <Button
            onClick={onComplete}
            disabled={!isValid}
            size="lg"
          >
            Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}