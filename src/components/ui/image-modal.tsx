"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Edit3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt?: string;
  onDownload?: () => void;
  onEdit?: () => void;
  isDownloading?: boolean;
  className?: string;
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  imageAlt = "Full size image",
  onDownload,
  onEdit,
  isDownloading = false,
  className
}: ImageModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
    }
  }, [isOpen, imageUrl]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-4xl max-h-[90vh] w-[90vw] p-0 overflow-hidden",
          className
        )}
      >
        {/* Visually hidden title for screen readers */}
        <DialogTitle className="sr-only">
          {imageAlt || "Full size image view"}
        </DialogTitle>
        
        <div className="relative w-full h-full">
          {/* Close button */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Image container */}
          <div className="relative w-full" style={{ minHeight: '300px' }}>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={1000}
              height={1000}
              className={cn(
                "w-full h-auto max-h-[70vh] object-contain transition-opacity",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              unoptimized
            />
          </div>

          {/* Action buttons */}
          {(onDownload || onEdit) && (
            <div className="flex items-center justify-center gap-2 p-4 bg-white border-t">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  disabled={!imageLoaded}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDownload && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading || !imageLoaded}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}