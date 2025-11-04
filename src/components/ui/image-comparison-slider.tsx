"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the BeforeAfterSlider component
 * Used for comparing two images with a draggable slider
 */
interface BeforeAfterSliderProps {
  /** URL of the original/before image */
  beforeImage: string;
  /** URL of the edited/after image */
  afterImage: string;
  /** Label for the before image (default: "Before") */
  beforeLabel?: string;
  /** Label for the after image (default: "After") */
  afterLabel?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BeforeAfterSlider Component
 *
 * A draggable image comparison slider with:
 * - Touch and mouse support
 * - Keyboard navigation (arrow keys)
 * - Smooth animations
 * - Mobile-responsive design
 * - Accessibility features
 *
 * @example
 * <BeforeAfterSlider
 *   beforeImage="/original.jpg"
 *   afterImage="/edited.jpg"
 *   beforeLabel="Original"
 *   afterLabel="Enhanced"
 * />
 */
export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  alt = "Image comparison",
  className
}: BeforeAfterSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion value for slider position (0-100%)
  const position = useMotionValue(50);

  // Transform position to clip-path
  const clipPath = useTransform(
    position,
    (value) => `inset(0 ${100 - value}% 0 0)`
  );

  /**
   * Handle mouse/touch drag
   */
  const handleDrag = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Clamp between 0 and 100
    position.set(Math.max(0, Math.min(100, percentage)));
  }, [position]);

  /**
   * Mouse event handlers
   */
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleDrag(e.clientX);
    }
  }, [isDragging, handleDrag]);

  /**
   * Touch event handlers
   */
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleDrag(e.touches[0].clientX);
    }
  }, [handleDrag]);

  /**
   * Keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const current = position.get();
        position.set(Math.max(0, current - 2));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const current = position.get();
        position.set(Math.min(100, current + 2));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [position]);

  /**
   * Mouse event listeners
   */
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-sophisticated-gray-100 dark:bg-sophisticated-gray-900 select-none",
        className
      )}
      role="img"
      aria-label={alt}
    >
      {/* Before Image (Full width) */}
      <div className="absolute inset-0">
        <Image
          src={beforeImage}
          alt={`${alt} - ${beforeLabel}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 700px, 900px"
          className="object-cover"
          priority
        />

        {/* Before Label */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-sophisticated-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide shadow-md">
            {beforeLabel}
          </div>
        </div>
      </div>

      {/* After Image (Clipped) */}
      <motion.div
        className="absolute inset-0 z-10"
        style={{ clipPath }}
      >
        <Image
          src={afterImage}
          alt={`${alt} - ${afterLabel}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 700px, 900px"
          className="object-cover"
          priority
        />

        {/* After Label */}
        <div className="absolute top-4 right-4">
          <div className="bg-gradient-ocean-deep backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg">
            {afterLabel}
          </div>
        </div>
      </motion.div>

      {/* Divider Line and Handle */}
      <motion.div
        className="absolute top-0 bottom-0 z-20 pointer-events-none"
        style={{
          left: useTransform(position, (p) => `${p}%`),
          transform: "translateX(-50%)"
        }}
      >
        {/* Vertical Divider Line */}
        <div className="h-full w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)]" />

        {/* Draggable Handle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          role="slider"
          aria-valuenow={Math.round(position.get())}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Image comparison slider"
          tabIndex={0}
        >
          <motion.div
            className="w-12 h-12 bg-gradient-ocean-deep rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-0.5">
              <ChevronLeft className="w-4 h-4 text-white" strokeWidth={3} />
              <ChevronRight className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-sophisticated-gray-900/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
          Drag to compare
        </div>
      </div>
    </div>
  );
}
