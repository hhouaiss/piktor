"use client";

import { useState, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera, Lightbulb, Grid } from "lucide-react";

/**
 * Edit parameters interface matching backend types
 */
export interface EditParams {
  aspectRatio?: '16:9' | '1:1' | '9:16' | '4:3' | '3:2';
  viewAngle?: 'frontal' | '45-degree' | 'top-down' | 'perspective' | 'custom';
  lighting?: 'soft' | 'dramatic' | 'natural' | 'studio' | 'golden-hour' | 'custom';
  style?: 'photorealistic' | 'minimalist' | 'artistic' | 'vintage' | 'modern' | 'custom';
  variations: number;
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
  });

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
    };
    setParams(clearedParams);
    onParamsChange(clearedParams);
  }, [onParamsChange]);

  /**
   * Check if any parameters are selected
   */
  const hasSelections = params.aspectRatio || params.viewAngle || params.lighting;

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


      {/* Info Box */}
      <div className="rounded-lg bg-ocean-blue-50 dark:bg-ocean-blue-950/30 border border-ocean-blue-200 dark:border-ocean-blue-800 p-4">
        <p className="text-sm text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
          <strong>Tip:</strong> Select multiple parameters to combine effects. Leave unselected to preserve original characteristics.
        </p>
      </div>
    </div>
  );
}
