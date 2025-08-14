"use client";

import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepData {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'current' | 'pending' | 'error';
  isAccessible: boolean; // Can user navigate to this step
  validation?: {
    isValid: boolean;
    message?: string;
  };
}

interface FlexibleStepperProps {
  steps: StepData[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  allowSkip?: boolean;
  className?: string;
}

export function FlexibleStepper({ 
  steps, 
  currentStep, 
  onStepClick,
  allowSkip = false,
  className = "" 
}: FlexibleStepperProps) {
  const handleStepClick = (step: number) => {
    const targetStep = steps[step - 1];
    
    // Check if step is accessible
    if (!targetStep.isAccessible && !allowSkip) {
      return;
    }
    
    // Don't allow navigation to error states without fixing them
    if (targetStep.status === 'error' && step < currentStep) {
      return;
    }
    
    onStepClick?.(step);
  };

  const getStepIcon = (stepData: StepData, isActive: boolean) => {
    const Icon = stepData.icon;
    
    switch (stepData.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6" />;
      case 'error':
        return <AlertCircle className="h-6 w-6" />;
      case 'pending':
        return isActive ? <Icon className="h-6 w-6" /> : <Clock className="h-6 w-6" />;
      default:
        return <Icon className="h-6 w-6" />;
    }
  };

  const getStepStyles = (stepData: StepData, isActive: boolean) => {
    const baseStyles = "w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all";
    
    if (!stepData.isAccessible && !allowSkip) {
      return cn(baseStyles, "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-60");
    }
    
    switch (stepData.status) {
      case 'completed':
        return cn(baseStyles, "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 cursor-pointer");
      case 'error':
        return cn(baseStyles, "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 cursor-pointer");
      case 'current':
        return cn(baseStyles, "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20");
      default:
        if (isActive) {
          return cn(baseStyles, "bg-primary text-primary-foreground border-primary");
        }
        return cn(baseStyles, "bg-background text-muted-foreground border-muted-foreground/30 hover:border-muted-foreground/50", 
          stepData.isAccessible ? "cursor-pointer" : "cursor-not-allowed");
    }
  };

  const getTextStyles = (stepData: StepData, isActive: boolean) => {
    if (!stepData.isAccessible && !allowSkip) {
      return "text-muted-foreground/60";
    }
    
    switch (stepData.status) {
      case 'completed':
        return "text-green-700";
      case 'error':
        return "text-red-700";
      case 'current':
      default:
        return isActive || stepData.status === 'current' ? "text-foreground" : "text-muted-foreground";
    }
  };

  return (
    <div className={cn("mb-8", className)}>
      {/* Desktop Stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((stepData, index) => {
            const isActive = currentStep === stepData.step;
            const isAccessible = stepData.isAccessible || allowSkip;
            
            return (
              <div key={stepData.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div
                    className={getStepStyles(stepData, isActive)}
                    onClick={() => isAccessible && handleStepClick(stepData.step)}
                    role={isAccessible ? "button" : "presentation"}
                    aria-label={isAccessible ? `Go to ${stepData.title}` : stepData.title}
                  >
                    {getStepIcon(stepData, isActive)}
                  </div>
                  
                  {/* Step Info */}
                  <div className="text-center mt-3 max-w-32">
                    <p className={cn("text-sm font-medium", getTextStyles(stepData, isActive))}>
                      {stepData.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stepData.description}
                    </p>
                    
                    {/* Validation Message */}
                    {stepData.validation && !stepData.validation.isValid && stepData.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        {stepData.validation.message}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4 transition-colors max-w-24",
                      currentStep > stepData.step ? "bg-green-300" : 
                      stepData.status === 'error' ? "bg-red-300" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Step Navigation Buttons */}
        {onStepClick && (
          <div className="flex justify-center mt-6 gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStepClick(currentStep - 1)}
              disabled={currentStep <= 1}
            >
              Previous Step
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStepClick(currentStep + 1)}
              disabled={currentStep >= steps.length || !steps[currentStep]?.isAccessible}
            >
              Next Step
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="bg-muted h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentStep}</span>
            <span>{steps.length} steps total</span>
          </div>
        </div>
        
        {/* Current Step Info */}
        {steps.map((stepData) => {
          if (stepData.step !== currentStep) return null;
          
          return (
            <div key={stepData.step} className="text-center space-y-2">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto", 
                getStepStyles(stepData, true).split(' ').filter(c => c.includes('bg-') || c.includes('text-') || c.includes('border-')).join(' ')
              )}>
                {getStepIcon(stepData, true)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{stepData.title}</h3>
                <p className="text-sm text-muted-foreground">{stepData.description}</p>
                
                {/* Validation Message */}
                {stepData.validation && !stepData.validation.isValid && stepData.status === 'error' && (
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    {stepData.validation.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Mobile Navigation */}
        {onStepClick && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStepClick(currentStep - 1)}
              disabled={currentStep <= 1}
            >
              ← Previous
            </Button>
            
            {/* Step Indicators */}
            <div className="flex gap-1 items-center">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index + 1 === currentStep ? 'bg-primary' :
                    index + 1 < currentStep ? 'bg-green-400' : 'bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStepClick(currentStep + 1)}
              disabled={currentStep >= steps.length || !steps[currentStep]?.isAccessible}
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}