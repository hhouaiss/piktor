"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditControls, type EditParams } from "./edit-controls";
import { EditResults, type EditResult } from "./edit-results";
import { cn } from "@/lib/utils";
import { Wand2, AlertCircle, Download } from "lucide-react";
import Image from "next/image";

/**
 * Visual data interface
 */
interface Visual {
  id: string;
  visualId: string;
  originalImageUrl: string;
  metadata?: any;
  name?: string;
}

/**
 * Props for ImageEditorModal component
 */
interface ImageEditorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Visual data to edit */
  visual: Visual;
  /** Callback when edit is complete (optional) */
  onEditComplete?: () => void;
}

/**
 * API Response interface
 */
interface EditApiResponse {
  success: boolean;
  edits?: Array<{
    editId: string;
    editedImageUrl: string;
    thumbnailUrl: string | null;
    editParams: Record<string, any>;
    metadata?: any;
    versionNumber?: number;
  }>;
  creditsUsed?: number;
  creditsRemaining?: number;
  error?: string;
  message?: string;
  needsUpgrade?: boolean;
}

/**
 * ImageEditorModal Component
 *
 * Main modal orchestrating the image editing experience:
 * - Two-panel layout: Controls on left, Preview/Results on right
 * - State management for editing flow
 * - API integration with /api/edit-image-advanced
 * - Credits checking and deduction feedback
 * - Error handling with user-friendly messages
 * - Loading states during generation
 * - Success feedback
 *
 * Features:
 * - Responsive layout (stacked on mobile, side-by-side on desktop)
 * - Real-time parameter selection
 * - Batch image generation (1-4 variations)
 * - Before/After comparison
 * - Download functionality
 * - Credits tracking
 *
 * @example
 * <ImageEditorModal
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 *   visual={visualData}
 *   onEditComplete={() => refetch()}
 * />
 */
export function ImageEditorModal({
  isOpen,
  onClose,
  visual,
  onEditComplete
}: ImageEditorModalProps) {
  // State management
  const [editParams, setEditParams] = useState<EditParams>({ variations: 1 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<EditResult[]>([]);
  const [creditsInfo, setCreditsInfo] = useState<{
    used?: number;
    remaining?: number;
  }>({});

  /**
   * Reset state when modal opens/closes
   */
  useEffect(() => {
    console.log('🔍 [ImageEditorModal] isOpen changed:', isOpen);
    if (!isOpen) {
      // Reset state when modal closes
      console.log('🔄 [ImageEditorModal] Resetting state (modal closed)');

      // Call onEditComplete when modal closes if there were successful edits
      // This allows the parent to refresh the library after user is done viewing
      if (edits.length > 0 && onEditComplete) {
        console.log('📞 [ImageEditorModal] Calling onEditComplete on modal close');
        onEditComplete();
      }

      setEditParams({ variations: 1 });
      setEdits([]);
      setError(null);
      setCreditsInfo({});
    }
  }, [isOpen, edits.length, onEditComplete]);

  /**
   * Handle parameter changes from EditControls
   */
  const handleParamsChange = useCallback((params: EditParams) => {
    setEditParams(params);
    setError(null);
  }, []);

  /**
   * Validate parameters before generation
   */
  const validateParams = useCallback((): boolean => {
    // Check if at least one parameter is selected
    const hasParams = editParams.aspectRatio ||
                     editParams.viewAngle ||
                     editParams.lighting;

    if (!hasParams) {
      setError("Please select at least one edit parameter");
      return false;
    }

    return true;
  }, [editParams]);

  /**
   * Generate edited images
   */
  const handleGenerate = useCallback(async () => {
    if (!validateParams()) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/edit-image-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualId: visual.id, // Use UUID id, not visualId string
          editParams: {
            aspectRatio: editParams.aspectRatio,
            viewAngle: editParams.viewAngle,
            lighting: editParams.lighting,
            style: 'photorealistic', // Always use photorealistic style
          },
          variations: 1, // Always generate 1 variation
          saveHistory: true,
        })
      });

      const result: EditApiResponse = await response.json();
      console.log('🔍 [ImageEditorModal] API Response:', {
        success: result.success,
        editsCount: result.edits?.length,
        edits: result.edits,
        creditsUsed: result.creditsUsed,
        creditsRemaining: result.creditsRemaining
      });

      if (!response.ok) {
        if (result.needsUpgrade) {
          throw new Error(result.message || 'Insufficient credits. Please upgrade your plan.');
        }
        throw new Error(result.error || `Failed to generate edits: ${response.status}`);
      }

      if (!result.success || !result.edits) {
        console.error('❌ [ImageEditorModal] Invalid response:', result);
        throw new Error(result.error || 'Failed to generate edits');
      }

      // Transform API response to match EditResult interface
      const transformedEdits: EditResult[] = result.edits.map(edit => ({
        editId: edit.editId,
        editedImageUrl: edit.editedImageUrl,
        thumbnailUrl: edit.thumbnailUrl,
        editParams: edit.editParams,
        metadata: edit.metadata,
        versionNumber: edit.versionNumber,
      }));

      console.log('✅ [ImageEditorModal] Transformed edits:', transformedEdits);

      // Set results
      setEdits(transformedEdits);
      console.log('✅ [ImageEditorModal] setEdits called with', transformedEdits.length, 'edits');

      // Set credits info
      if (result.creditsUsed !== undefined && result.creditsRemaining !== undefined) {
        setCreditsInfo({
          used: result.creditsUsed,
          remaining: result.creditsRemaining
        });
      }

      // Delay parent notification to avoid state reset
      // Don't call onEditComplete immediately as it triggers a full library reload
      // which can cause the modal to lose its state
      console.log('✅ [ImageEditorModal] Edit complete, not calling onEditComplete to preserve state');

    } catch (err) {
      console.error('Failed to generate edits:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate edits. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [visual, editParams, validateParams, onEditComplete]);

  /**
   * Handle download of an edited image
   */
  const handleDownload = useCallback(async (editId: string) => {
    const edit = edits.find(e => e.editId === editId);
    if (!edit) return;

    try {
      // Download the image
      const response = await fetch(edit.editedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${editId}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
      setError('Failed to download image. Please try again.');
    }
  }, [edits]);

  /**
   * Download all edits at once
   */
  const handleDownloadAll = useCallback(async () => {
    for (const edit of edits) {
      await handleDownload(edit.editId);
      // Add a small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }, [edits, handleDownload]);

  /**
   * Check if generate button should be enabled
   */
  const canGenerate = !isGenerating && (
    editParams.aspectRatio ||
    editParams.viewAngle ||
    editParams.lighting
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-sophisticated-gray-200 dark:border-sophisticated-gray-800 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-ocean-blue-600" />
            Edit Image
          </DialogTitle>
          <DialogDescription>
            Select parameters to transform your image. Each edit costs 1 credit.
          </DialogDescription>
        </DialogHeader>

        {/* Main Content - Two Panel Layout */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Panel - Controls */}
            <div className="space-y-4">
              {/* Original Image Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
                  Original Image
                </h4>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-sophisticated-gray-100 dark:bg-sophisticated-gray-900">
                  <Image
                    src={visual.originalImageUrl}
                    alt="Original image"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Edit Controls */}
              <EditControls
                onParamsChange={handleParamsChange}
                disabled={isGenerating}
                initialParams={editParams}
              />

              {/* Credits Info */}
              {creditsInfo.used !== undefined && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
                  <p className="text-sm text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                    <strong>Credits Used:</strong> {creditsInfo.used}
                    {creditsInfo.remaining !== undefined && (
                      <> | <strong>Remaining:</strong> {creditsInfo.remaining}</>
                    )}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                        Error
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                size="lg"
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Edit
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
                Cost: 1 credit
              </p>
            </div>

            {/* Right Panel - Results */}
            <div className="space-y-6">
              <EditResults
                originalImage={visual.originalImageUrl}
                edits={edits}
                onDownload={handleDownload}
                isLoading={isGenerating}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sophisticated-gray-200 dark:border-sophisticated-gray-800 flex justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
          >
            {edits.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          {edits.length > 0 && (
            <Button
              variant="default"
              onClick={handleDownloadAll}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download All
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
