"use client";

import { useState, useCallback, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Camera, Lightbulb, Grid, Upload, X, ImagePlus } from "lucide-react";
import Image from "next/image";

/**
 * Edit parameters interface matching backend types
 */
export interface EditParams {
  aspectRatio?: '16:9' | '1:1' | '9:16' | '4:3' | '3:2';
  viewAngle?: 'frontal' | '45-degree' | 'top-down' | 'perspective' | 'custom';
  lighting?: 'soft' | 'dramatic' | 'natural' | 'studio' | 'golden-hour' | 'custom';
  style?: 'photorealistic' | 'minimalist' | 'artistic' | 'vintage' | 'modern' | 'custom';
  variations: number;
  customInstructions?: string;
  productImages?: Array<{
    data: string; // base64
    mimeType: string;
    description?: string;
  }>;
}

/**
 * Props for EditControls component
 */
interface EditControlsProps {
  /** Callback when parameters change */
  onParamsChange: (params: EditParams) => void;
  /** Whether controls are disabled (during generation) */
  disabled?: boolean;
  /** Initial parameters */
  initialParams?: Partial<EditParams>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EditControls Component
 *
 * Provides UI controls for selecting image edit parameters including:
 * - Aspect ratio selection
 * - View angle selection
 * - Lighting selection
 * - Style selection
 * - Variations count slider
 *
 * Features:
 * - Clear visual feedback for selections
 * - Mobile-responsive layout
 * - Disabled state during processing
 * - Real-time parameter updates
 *
 * @example
 * <EditControls
 *   onParamsChange={(params) => console.log(params)}
 *   disabled={false}
 * />
 */
export function EditControls({
  onParamsChange,
  disabled = false,
  initialParams = {},
  className
}: EditControlsProps) {
  // Get available options from prompt specifications
  const aspectRatioOptions = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '4:3', label: '4:3 (Classic)' },
    { value: '3:2', label: '3:2 (Photo)' },
  ];

  const viewAngleOptions = [
    { value: 'frontal', label: 'Frontal View' },
    { value: '45-degree', label: '45° Angle' },
    { value: 'top-down', label: 'Top-Down' },
    { value: 'perspective', label: 'Perspective' },
    { value: 'custom', label: 'Custom' },
  ];

  const lightingOptions = [
    { value: 'soft', label: 'Soft Lighting' },
    { value: 'dramatic', label: 'Dramatic' },
    { value: 'natural', label: 'Natural' },
    { value: 'studio', label: 'Studio' },
    { value: 'golden-hour', label: 'Golden Hour' },
    { value: 'custom', label: 'Custom' },
  ];

  // State for all edit parameters
  const [params, setParams] = useState<EditParams>({
    aspectRatio: initialParams.aspectRatio,
    viewAngle: initialParams.viewAngle,
    lighting: initialParams.lighting,
    style: initialParams.style,
    variations: initialParams.variations || 1,
    customInstructions: initialParams.customInstructions || '',
    productImages: initialParams.productImages || [],
  });

  // File input ref for product upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Update a specific parameter and notify parent
   */
  const updateParam = useCallback((key: keyof EditParams, value: any) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange(newParams);
  }, [params, onParamsChange]);

  /**
   * Clear all selections
   */
  const clearAll = useCallback(() => {
    const clearedParams: EditParams = {
      aspectRatio: undefined,
      viewAngle: undefined,
      lighting: undefined,
      style: undefined,
      variations: 1,
      customInstructions: '',
      productImages: [],
    };
    setParams(clearedParams);
    onParamsChange(clearedParams);
  }, [onParamsChange]);

  /**
   * Handle product image file selection
   */
  const handleProductImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Maximum 5 products
    const currentCount = params.productImages?.length || 0;
    const remainingSlots = 5 - currentCount;

    if (remainingSlots <= 0) {
      alert('Maximum 5 products can be added');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    try {
      const newProductImages = await Promise.all(
        filesToProcess.map(async (file) => {
          return new Promise<{data: string; mimeType: string; description?: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              // Extract base64 data without the data URL prefix
              const base64Data = result.split(',')[1];
              resolve({
                data: base64Data,
                mimeType: file.type,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const updatedProducts = [...(params.productImages || []), ...newProductImages];
      updateParam('productImages', updatedProducts);
    } catch (error) {
      console.error('Error processing product images:', error);
      alert('Failed to process product images');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [params.productImages, updateParam]);

  /**
   * Remove a product image
   */
  const removeProductImage = useCallback((index: number) => {
    const updatedProducts = params.productImages?.filter((_, i) => i !== index) || [];
    updateParam('productImages', updatedProducts);
  }, [params.productImages, updateParam]);

  /**
   * Update product description
   */
  const updateProductDescription = useCallback((index: number, description: string) => {
    const updatedProducts = [...(params.productImages || [])];
    updatedProducts[index] = {
      ...updatedProducts[index],
      description
    };
    updateParam('productImages', updatedProducts);
  }, [params.productImages, updateParam]);

  /**
   * Check if any parameters are selected
   */
  const hasSelections = params.aspectRatio || params.viewAngle || params.lighting || params.customInstructions || (params.productImages && params.productImages.length > 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
          Edit Parameters
        </h3>
        {hasSelections && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Aspect Ratio Selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Grid className="w-4 h-4 text-ocean-blue-600" />
          Aspect Ratio
        </Label>
        <Select
          value={params.aspectRatio || "none"}
          onValueChange={(value) => updateParam('aspectRatio', value === "none" ? undefined : value)}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Keep original ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keep original ratio</SelectItem>
            {aspectRatioOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
          Change the image dimensions and composition
        </p>
      </div>

      {/* View Angle Selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Camera className="w-4 h-4 text-ocean-blue-600" />
          View Angle
        </Label>
        <Select
          value={params.viewAngle || "none"}
          onValueChange={(value) => updateParam('viewAngle', value === "none" ? undefined : value)}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Keep original angle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keep original angle</SelectItem>
            {viewAngleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
          Change the camera perspective and angle
        </p>
      </div>

      {/* Lighting Selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="w-4 h-4 text-ocean-blue-600" />
          Lighting
        </Label>
        <Select
          value={params.lighting || "none"}
          onValueChange={(value) => updateParam('lighting', value === "none" ? undefined : value)}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Keep original lighting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keep original lighting</SelectItem>
            {lightingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
          Adjust the lighting and atmosphere
        </p>
      </div>


      {/* Product Addition Section */}
      <div className="space-y-3 pt-4 border-t border-sophisticated-gray-200 dark:border-sophisticated-gray-700">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <ImagePlus className="w-4 h-4 text-coral-red-600" />
          Add Products to Scene
        </Label>
        <p className="text-xs text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
          Upload product images to seamlessly integrate into your generated image (Max 5)
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleProductImageUpload}
          className="hidden"
          disabled={disabled || (params.productImages?.length || 0) >= 5}
        />

        {/* Upload button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || (params.productImages?.length || 0) >= 5}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Product Image(s)
        </Button>

        {/* Product images list */}
        {params.productImages && params.productImages.length > 0 && (
          <div className="space-y-2">
            {params.productImages.map((product, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg border border-sophisticated-gray-200 dark:border-sophisticated-gray-700 bg-white dark:bg-sophisticated-gray-800"
              >
                {/* Preview thumbnail */}
                <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-sophisticated-gray-100 dark:bg-sophisticated-gray-700">
                  <Image
                    src={`data:${product.mimeType};base64,${product.data}`}
                    alt={`Product ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Description input */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder={`Product ${index + 1} placement (optional)`}
                    value={product.description || ''}
                    onChange={(e) => updateProductDescription(index, e.target.value)}
                    disabled={disabled}
                    className="w-full px-2 py-1 text-xs rounded border border-sophisticated-gray-200 dark:border-sophisticated-gray-600 bg-white dark:bg-sophisticated-gray-700 text-sophisticated-gray-900 dark:text-sophisticated-gray-100 placeholder-sophisticated-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-blue-500"
                  />
                  <p className="text-[10px] text-sophisticated-gray-500 dark:text-sophisticated-gray-400 mt-1">
                    e.g., "Place on the left side" or "In the foreground"
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeProductImage(index)}
                  disabled={disabled}
                  className="p-1 rounded hover:bg-sophisticated-gray-100 dark:hover:bg-sophisticated-gray-700 text-sophisticated-gray-500 hover:text-coral-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Instructions Section */}
      <div className="space-y-3 pt-4 border-t border-sophisticated-gray-200 dark:border-sophisticated-gray-700">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Grid className="w-4 h-4 text-ocean-blue-600" />
          Additional Instructions (Optional)
        </Label>
        <Textarea
          value={params.customInstructions || ''}
          onChange={(e) => updateParam('customInstructions', e.target.value)}
          placeholder="Add any specific instructions for the AI... (e.g., 'Add more shadows', 'Make background brighter', etc.)"
          disabled={disabled}
          rows={3}
          className="resize-none text-sm"
        />
        <p className="text-xs text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
          Provide additional guidance to customize the edit beyond standard parameters
        </p>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-ocean-blue-50 dark:bg-ocean-blue-950/30 border border-ocean-blue-200 dark:border-ocean-blue-800 p-4">
        <p className="text-sm text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
          <strong>Tip:</strong> Select multiple parameters to combine effects. Add products to create variations with additional items seamlessly integrated.
        </p>
      </div>
    </div>
  );
}
