"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullscreenImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt?: string;
  className?: string;
}

export function FullscreenImageViewer({
  isOpen,
  onClose,
  imageUrl,
  imageAlt = "Full screen image",
  className
}: FullscreenImageViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Effect to handle modal opening and reset state
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens, regardless of URL
      setImageLoaded(false);
      setImageDimensions(null);
      setCurrentImageUrl(imageUrl);
    }
  }, [isOpen, imageUrl]);

  // Effect for keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle image load and get natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setImageLoaded(true);
  };

  // Check if image is already loaded when component mounts/opens
  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        setImageLoaded(true);
      };
      img.onerror = () => {
        setImageLoaded(true); // Show error state
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  // Calculate image display size while maintaining aspect ratio and fitting screen
  const getImageDisplaySize = () => {
    if (!imageDimensions) return {};

    const { width: naturalWidth, height: naturalHeight } = imageDimensions;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Reserve space for close button and padding
    const maxWidth = viewportWidth - 80; // 40px padding on each side
    const maxHeight = viewportHeight - 80; // 40px padding top/bottom

    const aspectRatio = naturalWidth / naturalHeight;

    let displayWidth = naturalWidth;
    let displayHeight = naturalHeight;

    // Scale down if image is larger than viewport
    if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
      if (aspectRatio > 1) {
        // Landscape image
        displayWidth = Math.min(maxWidth, naturalWidth);
        displayHeight = displayWidth / aspectRatio;

        if (displayHeight > maxHeight) {
          displayHeight = maxHeight;
          displayWidth = displayHeight * aspectRatio;
        }
      } else {
        // Portrait image
        displayHeight = Math.min(maxHeight, naturalHeight);
        displayWidth = displayHeight * aspectRatio;

        if (displayWidth > maxWidth) {
          displayWidth = maxWidth;
          displayHeight = displayWidth / aspectRatio;
        }
      }
    }

    return {
      width: Math.round(displayWidth),
      height: Math.round(displayHeight)
    };
  };

  if (!isOpen) return null;

  const displaySize = getImageDisplaySize();

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/95 backdrop-blur-sm",
        "flex items-center justify-center",
        "transition-opacity duration-300 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0",
        className
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={imageAlt}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          "absolute top-4 right-4 z-10",
          "p-3 rounded-full",
          "bg-white/10 hover:bg-white/20 backdrop-blur-sm",
          "text-white hover:text-white",
          "transition-all duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-white/50",
          "touch-manipulation", // Better touch targets on mobile
          "md:top-6 md:right-6 md:p-4" // Larger on desktop
        )}
        aria-label="Close full screen view"
        type="button"
      >
        <X className="w-6 h-6 md:w-7 md:h-7" />
      </button>

      {/* Loading indicator */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Loading image...</p>
          </div>
        </div>
      )}

      {/* Image container */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          "max-w-full max-h-full",
          "transition-opacity duration-500 ease-in-out",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{
          ...(displaySize.width && displaySize.height ? {
            width: displaySize.width,
            height: displaySize.height
          } : {})
        }}
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          width={imageDimensions?.width || 1200}
          height={imageDimensions?.height || 800}
          className={cn(
            "w-full h-full object-contain",
            "select-none", // Prevent text selection
            "transition-transform duration-300 ease-in-out",
            "hover:scale-[1.02] md:hover:scale-105" // Subtle zoom on hover
          )}
          onLoad={handleImageLoad}
          onError={() => {
            setImageLoaded(true); // Show error state
          }}
          unoptimized
          priority
          quality={100}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Tap to close hint for mobile */}
      <div className={cn(
        "absolute bottom-4 left-1/2 transform -translate-x-1/2",
        "text-white/60 text-sm font-medium",
        "px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm",
        "transition-opacity duration-300",
        "block md:hidden", // Only show on mobile
        imageLoaded ? "opacity-100" : "opacity-0"
      )}>
        Tap outside to close
      </div>

      {/* ESC key hint for desktop */}
      <div className={cn(
        "absolute bottom-4 left-1/2 transform -translate-x-1/2",
        "text-white/60 text-sm font-medium",
        "px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm",
        "transition-opacity duration-300",
        "hidden md:block", // Only show on desktop
        imageLoaded ? "opacity-100" : "opacity-0"
      )}>
        Press ESC to close
      </div>
    </div>
  );
}