"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface GenerationEvaluationProps {
  imageId: string;
  productType?: string;
  productName?: string;
  imageIndex?: number;
  className?: string;
}

export function GenerationEvaluation({
  imageId,
  productType,
  productName,
  imageIndex = 0,
  className
}: GenerationEvaluationProps) {
  const [evaluation, setEvaluation] = useState<'positive' | 'negative' | null>(null);

  const handleEvaluation = (type: 'positive' | 'negative') => {
    setEvaluation(type);

    // Track the evaluation with Google Analytics
    trackEvent('generation_evaluated', {
      event_category: 'generator',
      event_label: type === 'positive' ? 'thumbs_up' : 'thumbs_down',
      custom_parameters: {
        image_id: imageId,
        product_type: productType || 'unknown',
        product_name: productName || 'unknown',
        image_index: imageIndex,
        evaluation_type: type
      }
    });
  };

  if (evaluation) {
    return (
      <div className={cn("flex items-center justify-center gap-2 text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400", className)}>
        <span>Merci pour votre évaluation!</span>
        {evaluation === 'positive' ? (
          <ThumbsUp className="w-4 h-4 text-success-500 fill-success-500" />
        ) : (
          <ThumbsDown className="w-4 h-4 text-red-500 fill-red-500" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <span className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mr-2">
        Que pensez-vous de ce résultat ?
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEvaluation('positive')}
        className="hover:bg-success-50 hover:text-success-600 dark:hover:bg-success-900/20 dark:hover:text-success-400"
        aria-label="J'aime ce résultat"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEvaluation('negative')}
        className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        aria-label="Je n'aime pas ce résultat"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>
    </div>
  );
}