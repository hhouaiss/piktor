"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Download, Eye, Loader2, CheckCircle2 } from "lucide-react";

/**
 * Single edit result interface
 */
export interface EditResult {
  editId: string;
  editedImageUrl: string;
  thumbnailUrl: string | null;
  editParams: {
    aspectRatio?: string;
    viewAngle?: string;
    lighting?: string;
    style?: string;
  };
  metadata?: any;
  versionNumber?: number;
}

/**
 * Props for EditResults component
 */
interface EditResultsProps {
  /** Original image URL for comparison */
  originalImage: string;
  /** Array of edit results */
  edits: EditResult[];
  /** Callback when download button is clicked */
  onDownload: (editId: string) => void;
  /** Loading state during generation */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EditResults Component
 *
 * Displays edited image variations with comparison tools:
 * - Variation thumbnails grid
 * - Before/After comparison slider
 * - Download buttons for each variation
 * - Edit parameters display
 * - Loading states
 *
 * Features:
 * - Interactive thumbnail selection
 * - Side-by-side comparison view
 * - Download functionality
 * - Parameter badges showing applied edits
 * - Responsive grid layout
 *
 * @example
 * <EditResults
 *   originalImage="/original.jpg"
 *   edits={[...]}
 *   onDownload={(id) => console.log('Download', id)}
 * />
 */
export function EditResults({
  originalImage,
  edits,
  onDownload,
  isLoading = false,
  className
}: EditResultsProps) {
  const [selectedEditId, setSelectedEditId] = useState<string | null>(
    edits.length > 0 ? edits[0].editId : null
  );

  // Auto-select the first edit when new edits arrive
  useEffect(() => {
    if (edits.length > 0 && !edits.find(edit => edit.editId === selectedEditId)) {
      // If current selection doesn't exist in edits (new edits loaded), select the first one
      setSelectedEditId(edits[0].editId);
    }
  }, [edits, selectedEditId]);

  const selectedEdit = edits.find(edit => edit.editId === selectedEditId);

  /**
   * Handle thumbnail click
   */
  const handleThumbnailClick = useCallback((editId: string) => {
    setSelectedEditId(editId);
  }, []);

  /**
   * Handle download click
   */
  const handleDownload = useCallback((editId: string) => {
    onDownload(editId);
  }, [onDownload]);

  /**
   * Get label for parameter type
   */
  const getParameterLabel = (key: string, value: string): string => {
    const labels: Record<string, Record<string, string>> = {
      aspectRatio: {
        '1:1': '1:1 Square',
        '16:9': '16:9 Wide',
        '9:16': '9:16 Portrait',
        '4:3': '4:3 Classic',
        '3:2': '3:2 Photo',
      },
      viewAngle: {
        'frontal': 'Frontal',
        '45-degree': '45° Angle',
        'top-down': 'Top-Down',
        'perspective': 'Perspective',
        'custom': 'Custom',
      },
      lighting: {
        'soft': 'Soft',
        'dramatic': 'Dramatic',
        'natural': 'Natural',
        'studio': 'Studio',
        'golden-hour': 'Golden Hour',
        'custom': 'Custom',
      },
      style: {
        'photorealistic': 'Photorealistic',
        'minimalist': 'Minimalist',
        'artistic': 'Artistic',
        'vintage': 'Vintage',
        'modern': 'Modern',
        'custom': 'Custom',
      },
    };

    return labels[key]?.[value] || value;
  };

  /**
   * Render parameter badges
   */
  const renderParameterBadges = useCallback((parameters: Record<string, any>) => {
    const badges: React.ReactElement[] = [];

    if (parameters.aspectRatio) {
      badges.push(
        <Badge key="aspect" variant="secondary">
          {getParameterLabel('aspectRatio', parameters.aspectRatio)}
        </Badge>
      );
    }

    if (parameters.viewAngle) {
      badges.push(
        <Badge key="angle" variant="secondary">
          {getParameterLabel('viewAngle', parameters.viewAngle)}
        </Badge>
      );
    }

    if (parameters.lighting) {
      badges.push(
        <Badge key="lighting" variant="secondary">
          {getParameterLabel('lighting', parameters.lighting)}
        </Badge>
      );
    }

    if (parameters.style) {
      badges.push(
        <Badge key="style" variant="secondary">
          {getParameterLabel('style', parameters.style)}
        </Badge>
      );
    }

    return badges;
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-ocean-blue-600 animate-spin" />
          <div className="text-center">
            <p className="text-lg font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
              Generating variations...
            </p>
            <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
              This may take 30-60 seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (edits.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
          <Eye className="w-12 h-12 text-sophisticated-gray-400" />
          <div>
            <p className="text-lg font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
              No variations yet
            </p>
            <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
              Select edit parameters and click Generate to create variations
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Back Arrow */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
            Edit Generated Successfully
          </h3>
        </div>
      </div>

      {/* Full Edited Image Display */}
      {selectedEdit && (
        <div className="space-y-4">
          {/* Main Edited Image */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-sophisticated-gray-100 dark:bg-sophisticated-gray-900 border border-sophisticated-gray-200 dark:border-sophisticated-gray-800">
            <Image
              src={selectedEdit.editedImageUrl}
              alt="Edited image"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Edit Parameters and Download */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-sophisticated-gray-50 dark:bg-sophisticated-gray-900 border border-sophisticated-gray-200 dark:border-sophisticated-gray-800">
            <div className="flex flex-wrap gap-2">
              {renderParameterBadges(selectedEdit.editParams)}
            </div>
            <Button
              onClick={() => handleDownload(selectedEdit.editId)}
              size="default"
              variant="default"
              className="gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Download Edited Image
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
