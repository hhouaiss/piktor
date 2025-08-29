"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Upload, X, Image as ImageIcon } from "lucide-react";
import { ProductInput, ProductSpecs, UploadedImage, createProductInput } from "./types";
import { cn } from "@/lib/utils";

interface StepUnifiedInputProps {
  productInput: ProductInput | null;
  onProductInputChange: (productInput: ProductInput) => void;
  onComplete: () => void;
  isActive: boolean;
}

export function StepUnifiedInput({ 
  productInput, 
  onProductInputChange, 
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

  // Validation
  const isValid = uploadedImages.length > 0 && 
                  specs.productName.trim() !== '' && 
                  specs.productType.trim() !== '';

  return (
    <Card className={cn(isActive && "ring-2 ring-primary")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            1
          </span>
          Product Input
        </CardTitle>
        <CardDescription>
          Upload your product images and provide specifications for AI generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
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

        {/* Continue Button */}
        <div className="flex justify-between items-center pt-4 border-t">
          {isValid ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">
                Ready for generation - {uploadedImages.length} images uploaded
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploadedImages.length === 0 
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
            Continue to Generation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}