"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position: "top" | "bottom" | "left" | "right" | "center";
  image?: string;
}

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Piktor! 🎉",
    description: "Transform your furniture photos into professional marketing images in just 4 simple steps. Let's take a quick tour!",
    position: "center",
    image: "/tour/welcome.png"
  },
  {
    id: "upload",
    title: "Step 1: Upload Your Product Photos",
    description: "Start by uploading basic product photos. Even phone photos work perfectly! Our AI will analyze multiple angles to understand your furniture.",
    position: "center",
    target: ".step-upload",
    image: "/tour/upload.png"
  },
  {
    id: "analysis", 
    title: "Step 2: AI Analysis Magic",
    description: "Our AI examines your furniture's style, materials, dimensions, and details. This takes just seconds and ensures perfect context for your images.",
    position: "center",
    target: ".step-analysis",
    image: "/tour/analysis.png"
  },
  {
    id: "settings",
    title: "Step 3: Choose Your Style",
    description: "Select from lifestyle scenes, social media styles, or catalog layouts. Customize the mood, lighting, and context to match your brand.",
    position: "center", 
    target: ".step-settings",
    image: "/tour/settings.png"
  },
  {
    id: "generate",
    title: "Step 4: Generate & Download",
    description: "Watch as AI creates multiple high-resolution variations. Download immediately or regenerate until you get the perfect shot.",
    position: "center",
    target: ".step-generate", 
    image: "/tour/generate.png"
  },
  {
    id: "complete",
    title: "Ready to Transform Your Images?",
    description: "You're all set! Start with your first product photo and see the magic happen. Remember, your first 3 images are completely free.",
    position: "center",
    image: "/tour/complete.png"
  }
];

export function ProductTour({ isOpen, onClose, onComplete }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentTourStep = tourSteps[currentStep];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < tourSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete();
        onClose();
      }
      setIsAnimating(false);
    }, 150);
  };

  const prevStep = () => {
    if (isAnimating || currentStep === 0) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(currentStep - 1);
      setIsAnimating(false);
    }, 150);
  };

  const skipTour = () => {
    onClose();
  };

  const startGenerating = () => {
    onComplete();
    onClose();
    // Navigate to generation page
    window.location.href = "/upload";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-2xl transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Product Tour</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {tourSteps.length}
              </span>
              <Button variant="ghost" size="sm" onClick={skipTour}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-muted">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Image placeholder */}
            {currentTourStep.image && (
              <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-6 flex items-center justify-center border border-blue-100">
                <div className="text-center text-muted-foreground">
                  <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tour Image: {currentTourStep.title}</p>
                </div>
              </div>
            )}

            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">{currentTourStep.title}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
                {currentTourStep.description}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/30">
            <Button 
              variant="ghost" 
              onClick={prevStep} 
              disabled={currentStep === 0 || isAnimating}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-600' : 
                    index < currentStep ? 'bg-blue-300' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            {currentStep === tourSteps.length - 1 ? (
              <Button 
                onClick={startGenerating}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Start Creating
                <Sparkles className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={nextStep} 
                disabled={isAnimating}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}