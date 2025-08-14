"use client";

import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressState {
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
  progress?: number; // 0-100
  timeEstimate?: string;
}

interface EnhancedProgressProps {
  title: string;
  description?: string;
  state: ProgressState;
  className?: string;
  showTimeEstimate?: boolean;
}

export function EnhancedProgress({ 
  title, 
  description, 
  state, 
  className = "",
  showTimeEstimate = true 
}: EnhancedProgressProps) {
  const getIcon = () => {
    switch (state.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'in-progress':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted/30 border-muted-foreground/20';
    }
  };

  const getStatusMessage = () => {
    if (state.message) return state.message;
    
    switch (state.status) {
      case 'completed':
        return 'Completed successfully';
      case 'in-progress':
        return 'Processing...';
      case 'error':
        return 'Something went wrong';
      default:
        return 'Waiting to start';
    }
  };

  return (
    <div className={cn("rounded-lg border p-4 transition-all", getStatusColor(), className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-medium">{title}</h3>
            {description && (
              <p className="text-sm opacity-80">{description}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{getStatusMessage()}</span>
              {showTimeEstimate && state.timeEstimate && state.status === 'in-progress' && (
                <span className="text-xs opacity-70">~{state.timeEstimate}</span>
              )}
            </div>
            
            {state.status === 'in-progress' && state.progress !== undefined && (
              <div className="space-y-1">
                <Progress value={state.progress} className="h-2" />
                <div className="text-xs opacity-70 text-right">
                  {Math.round(state.progress)}% complete
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MultiStepProgressProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    state: ProgressState;
  }>;
  className?: string;
}

export function MultiStepProgress({ steps, className = "" }: MultiStepProgressProps) {
  const completedSteps = steps.filter(step => step.state.status === 'completed').length;
  const totalProgress = (completedSteps / steps.length) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Progress */}
      <div className="text-center space-y-2">
        <div className="text-sm text-muted-foreground">
          Overall Progress: {completedSteps} of {steps.length} steps completed
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>
      
      {/* Individual Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            <EnhancedProgress
              title={`${index + 1}. ${step.title}`}
              description={step.description}
              state={step.state}
            />
            
            {/* Connection line to next step */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-full w-0.5 h-3 bg-border" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}