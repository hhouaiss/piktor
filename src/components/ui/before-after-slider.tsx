"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePair {
  before: string;
  after: string;
  alt: string;
  title: string;
}

interface BeforeAfterSliderProps {
  imagePairs: ImagePair[];
  autoAnimationDelay?: number;
  className?: string;
}

export function BeforeAfterSlider({
  imagePairs,
  autoAnimationDelay = 500,
  className
}: BeforeAfterSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const position = useMotionValue(50);
  const clipPath = useTransform(
    position,
    (value) => `inset(0 ${100 - value}% 0 0)`
  );

  // Intersection Observer for auto-animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasAnimated]);

  // Auto-animation sequence
  useEffect(() => {
    if (!isInView || hasAnimated) return;

    const timeout = setTimeout(() => {
      // Start at 0%
      position.set(0);

      // Animate to 100% over 2 seconds with easing
      setTimeout(() => {
        const animation = {
          to: 100,
          duration: 2000,
          ease: "easeInOut"
        };

        // Smoothly animate to 100%
        const startTime = Date.now();
        const startValue = 0;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / animation.duration, 1);

          // Ease in-out function
          const eased = progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

          position.set(startValue + (animation.to - startValue) * eased);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Pause for 0.5s then return to 50%
            setTimeout(() => {
              const returnStartTime = Date.now();
              const returnStartValue = 100;
              const returnDuration = 800;

              const animateReturn = () => {
                const returnElapsed = Date.now() - returnStartTime;
                const returnProgress = Math.min(returnElapsed / returnDuration, 1);

                // Ease in-out for return
                const returnEased = returnProgress < 0.5
                  ? 2 * returnProgress * returnProgress
                  : -1 + (4 - 2 * returnProgress) * returnProgress;

                position.set(returnStartValue + (50 - returnStartValue) * returnEased);

                if (returnProgress < 1) {
                  requestAnimationFrame(animateReturn);
                } else {
                  setHasAnimated(true);
                }
              };

              animateReturn();
            }, 500); // 500ms pause
          }
        };

        animate();
      }, 100);
    }, autoAnimationDelay);

    return () => clearTimeout(timeout);
  }, [isInView, hasAnimated, position, autoAnimationDelay]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        const current = position.get();
        position.set(Math.max(0, current - 5));
      } else if (e.key === "ArrowRight") {
        const current = position.get();
        position.set(Math.min(100, current + 5));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [position]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % imagePairs.length);
    setHasAnimated(false);
    setIsInView(false);
    position.set(50);
  }, [imagePairs.length, position]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + imagePairs.length) % imagePairs.length);
    setHasAnimated(false);
    setIsInView(false);
    position.set(50);
  }, [imagePairs.length, position]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setHasAnimated(false);
    setIsInView(false);
    position.set(50);
  }, [position]);

  const currentPair = imagePairs[currentSlide];

  return (
    <div ref={containerRef} className={cn("w-full max-w-[900px] mx-auto px-4", className)}>
      {/* Main Slider Container */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-premium bg-sophisticated-gray-100 dark:bg-sophisticated-gray-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
            {/* Before Image (Full width) */}
            <div className="absolute inset-0">
              <Image
                src={currentPair.before}
                alt={`${currentPair.alt} - Avant`}
                fill
                priority={currentSlide === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 700px, 900px"
                className="object-cover"
              />

              {/* AVANT Badge */}
              <div className="absolute top-4 left-4 z-20">
                <div className="bg-sophisticated-gray-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide shadow-md">
                  AVANT
                </div>
              </div>
            </div>

            {/* After Image (Clipped) */}
            <motion.div
              className="absolute inset-0"
              style={{ clipPath }}
            >
              <Image
                src={currentPair.after}
                alt={`${currentPair.alt} - Après`}
                fill
                priority={currentSlide === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 700px, 900px"
                className="object-cover"
              />

              {/* APRÈS Badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-gradient-ocean-deep backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg">
                  APRÈS
                </div>
              </div>
            </motion.div>

            {/* Divider Line and Handle */}
            <motion.div
              className="absolute top-0 bottom-0 z-30 pointer-events-none"
              style={{
                left: useTransform(position, (p) => `${p}%`),
                transform: "translateX(-50%)"
              }}
            >
              {/* Vertical Line */}
              <div className="h-full w-[3px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

              {/* Draggable Handle */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                dragMomentum={false}
                onDrag={(_, info) => {
                  if (!containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  const newPosition = ((info.point.x - rect.left) / rect.width) * 100;
                  position.set(Math.max(0, Math.min(100, newPosition)));
                }}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  cursor: isDragging ? "grabbing" : "grab"
                }}
              >
                <div className="w-14 h-14 md:w-[56px] md:h-[56px] bg-gradient-ocean-deep rounded-full border-3 border-white shadow-[0_4px_12px_rgba(2,132,199,0.4)] flex items-center justify-center transition-transform">
                  <div className="flex items-center gap-0.5">
                    <ChevronLeft className="w-5 h-5 text-white" strokeWidth={3} />
                    <ChevronRight className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Navigation Arrows */}
            {imagePairs.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-white/90 dark:bg-sophisticated-gray-800/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-sophisticated-gray-700 dark:text-sophisticated-gray-300 hover:bg-white dark:hover:bg-sophisticated-gray-700 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ocean-blue-500"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-white/90 dark:bg-sophisticated-gray-800/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-sophisticated-gray-700 dark:text-sophisticated-gray-300 hover:bg-white dark:hover:bg-sophisticated-gray-700 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ocean-blue-500"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot Indicators */}
      {imagePairs.length > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {imagePairs.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ocean-blue-500 focus:ring-offset-2",
                index === currentSlide
                  ? "bg-gradient-ocean-deep scale-125 shadow-md"
                  : "bg-sophisticated-gray-300 dark:bg-sophisticated-gray-600 hover:bg-ocean-blue-400 dark:hover:bg-ocean-blue-500 hover:scale-110"
              )}
              aria-label={`Aller à l'image ${index + 1}`}
              aria-current={index === currentSlide ? "true" : "false"}
            />
          ))}
        </div>
      )}

      {/* Current Image Title */}
      <div className="text-center mt-4">
        <h3 className="text-lg font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
          {currentPair.title}
        </h3>
      </div>
    </div>
  );
}
