"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { EditResult } from "@/lib/supabase/types";

interface VariationsViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageUrl: string;
  originalImageName: string;
  variations: EditResult[];
}

export function VariationsViewerModal({
  isOpen,
  onClose,
  originalImageUrl,
  originalImageName,
  variations,
}: VariationsViewerModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = async (imageUrl: string, editId: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `variation-${editId}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  const handleDownloadAll = async () => {
    for (const variation of variations) {
      await handleDownload(variation.editedImageUrl, variation.editId);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-sophisticated-gray-200 dark:border-sophisticated-gray-800 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">
              Image Variations ({variations.length})
            </DialogTitle>
            <DialogDescription>
              {originalImageName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Original Image */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
                  Original Image
                </h3>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-sophisticated-gray-100 dark:bg-sophisticated-gray-900 border-2 border-sophisticated-gray-300 dark:border-sophisticated-gray-700">
                  <Image
                    src={originalImageUrl}
                    alt="Original"
                    fill
                    sizes="(max-width: 768px) 100vw, 900px"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Variations Grid */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
                  Variations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {variations.map((variation) => (
                    <div
                      key={variation.editId}
                      className="group relative rounded-lg overflow-hidden bg-sophisticated-gray-100 dark:bg-sophisticated-gray-900 border border-sophisticated-gray-200 dark:border-sophisticated-gray-800 hover:border-ocean-blue-500 transition-all"
                    >
                      {/* Image */}
                      <div className="relative aspect-video">
                        <Image
                          src={variation.editedImageUrl}
                          alt={`Variation ${variation.versionNumber}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedImage(variation.editedImageUrl)}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(variation.editedImageUrl, variation.editId)}
                          className="gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>

                      {/* Info Badge */}
                      <div className="absolute top-2 left-2 bg-sophisticated-gray-900/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
                        v{variation.versionNumber}
                      </div>

                      {/* Parameters */}
                      <div className="p-3 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {variation.editParams.aspectRatio && (
                            <span className="text-xs px-2 py-0.5 bg-ocean-blue-100 dark:bg-ocean-blue-900/30 text-ocean-blue-700 dark:text-ocean-blue-300 rounded">
                              {variation.editParams.aspectRatio}
                            </span>
                          )}
                          {variation.editParams.viewAngle && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                              {variation.editParams.viewAngle}
                            </span>
                          )}
                          {variation.editParams.lighting && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                              {variation.editParams.lighting}
                            </span>
                          )}
                          {variation.editParams.style && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              {variation.editParams.style}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-sophisticated-gray-200 dark:border-sophisticated-gray-800 flex justify-end gap-3 flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {variations.length > 0 && (
              <Button onClick={handleDownloadAll} className="gap-2">
                <Download className="w-4 h-4" />
                Download All ({variations.length})
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Full view"
              fill
              sizes="100vw"
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
