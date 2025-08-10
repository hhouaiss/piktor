"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, CheckCircle, MoveUp, MoveDown, Camera } from "lucide-react";
import { ProductImages, UploadedImage } from "./types";
import { cn } from "@/lib/utils";

interface StepProductBlockProps {
  productImages: ProductImages | null;
  onProductImagesChange: (productImages: ProductImages | null) => void;
  onComplete: () => void;
  isActive: boolean;
}

export function StepProductBlock({ productImages, onProductImagesChange, onComplete, isActive }: StepProductBlockProps) {
  const [productName, setProductName] = useState(productImages?.productName || '');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: UploadedImage[] = acceptedFiles.map((file) => ({
      ...file,
      id: Math.random().toString(36).substring(2, 11),
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      stream: file.stream.bind(file),
      text: file.text.bind(file),
      arrayBuffer: file.arrayBuffer.bind(file),
      slice: file.slice.bind(file),
      webkitRelativePath: file.webkitRelativePath,
    }));

    const currentImages = productImages?.images || [];
    const allImages = [...currentImages, ...newImages];
    
    onProductImagesChange({
      productName: productName,
      images: allImages,
      primaryImageId: productImages?.primaryImageId || (allImages.length > 0 ? allImages[0].id : undefined),
      fusedProfile: undefined, // Reset profile when images change
    });
  }, [productImages, productName, onProductImagesChange]);

  const removeImage = (imageId: string) => {
    if (!productImages) return;
    
    const image = productImages.images.find(img => img.id === imageId);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }

    const remainingImages = productImages.images.filter(img => img.id !== imageId);
    const newPrimaryId = productImages.primaryImageId === imageId 
      ? (remainingImages.length > 0 ? remainingImages[0].id : undefined)
      : productImages.primaryImageId;

    onProductImagesChange({
      ...productImages,
      images: remainingImages,
      primaryImageId: newPrimaryId,
      fusedProfile: undefined, // Reset profile when images change
    });
  };

  const setPrimaryImage = (imageId: string) => {
    if (!productImages) return;
    
    onProductImagesChange({
      ...productImages,
      primaryImageId: imageId,
    });
  };

  const moveImage = (imageId: string, direction: 'up' | 'down') => {
    if (!productImages) return;
    
    const currentIndex = productImages.images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= productImages.images.length) return;
    
    const reorderedImages = [...productImages.images];
    [reorderedImages[currentIndex], reorderedImages[newIndex]] = [reorderedImages[newIndex], reorderedImages[currentIndex]];
    
    onProductImagesChange({
      ...productImages,
      images: reorderedImages,
    });
  };

  const handleProductNameChange = (name: string) => {
    setProductName(name);
    if (productImages) {
      onProductImagesChange({
        ...productImages,
        productName: name,
      });
    } else if (name.trim()) {
      onProductImagesChange({
        productName: name,
        images: [],
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
    },
    multiple: true,
  });

  const canContinue = productName.trim() && productImages?.images && productImages.images.length > 0 && productImages.primaryImageId;

  const handleContinue = () => {
    if (canContinue) {
      onComplete();
    }
  };

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
          Product Block
        </CardTitle>
        <CardDescription>
          Set up your product by providing a name and uploading multiple photos of THE SAME product from different angles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Name */}
        <div>
          <Label htmlFor="productName">Product Name *</Label>
          <Input
            id="productName"
            type="text"
            placeholder="e.g., Ergonomic Office Chair"
            value={productName}
            onChange={(e) => handleProductNameChange(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Multi-image Upload */}
        <div>
          <Label>Product Images *</Label>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all mt-1",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the images here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Upload multiple photos of the same product
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Different angles and perspectives help create better results. JPG, PNG, WebP supported.
                </p>
                <Button variant="outline" type="button" onClick={(e) => { e.preventDefault(); }}>
                  Browse Images
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Images with Reordering and Primary Selection */}
        {productImages?.images && productImages.images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Product Images ({productImages.images.length})</h3>
              <p className="text-sm text-muted-foreground">Select primary reference image for AI generation</p>
            </div>
            <div className="space-y-3">
              {productImages.images.map((image, index) => (
                <div key={image.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  {/* Image Preview */}
                  <div className="relative w-16 h-16 bg-muted/50 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={image.preview}
                      alt={image.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{image.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(image.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Primary Selection */}
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`primary-${image.id}`}
                      name="primaryImage"
                      checked={productImages.primaryImageId === image.id}
                      onChange={() => setPrimaryImage(image.id)}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`primary-${image.id}`} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Primary
                    </label>
                  </div>

                  {/* Reorder Controls */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(image.id, 'up')}
                      disabled={index === 0}
                      className="w-6 h-6 p-0"
                    >
                      <MoveUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(image.id, 'down')}
                      disabled={index === productImages.images.length - 1}
                      className="w-6 h-6 p-0"
                    >
                      <MoveDown className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(image.id)}
                    className="w-6 h-6 p-0 text-red-500 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        {productName.trim() && productImages?.images && productImages.images.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              {canContinue ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    Product setup complete
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm text-orange-600">
                    Select a primary reference image
                  </span>
                </>
              )}
            </div>
            
            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              size="lg"
            >
              Continue to Product Specs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}