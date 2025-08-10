"use client";

import { CheckCircle, Package, Cog, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

const steps = [
  {
    step: 1,
    title: "Product Block",
    description: "Setup product",
    icon: Package,
  },
  {
    step: 2,
    title: "Product Specs",
    description: "AI analysis",
    icon: Cog,
  },
  {
    step: 3,
    title: "Generation Settings",
    description: "Configure context",
    icon: Settings,
  },
  {
    step: 4,
    title: "Generate",
    description: "Create images",
    icon: Sparkles,
  },
];

export function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const isActive = currentStep === step.step;
          const isCompleted = currentStep > step.step;
          const Icon = step.icon;
          
          return (
            <div key={step.step} className="flex items-center">
              <div className={cn("flex flex-col items-center", index < steps.length - 1 ? "mr-4" : "")}>
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                    isCompleted
                      ? "bg-primary text-primary-foreground border-primary"
                      : isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-muted-foreground/30"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <div className="text-center mt-3">
                  <p className={cn("text-sm font-medium", isActive || isCompleted ? "text-foreground" : "text-muted-foreground")}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    currentStep > step.step ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}