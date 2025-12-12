"use client";

import { useState, useCallback } from 'react';
import { PlanTier } from '@/lib/pricing/plans';

export type UpgradeTrigger = 'generation_limit' | 'format_locked' | 'feature_locked';

interface UpgradePromptState {
  isOpen: boolean;
  trigger: UpgradeTrigger;
  currentPlan: PlanTier;
  remainingCredits?: number;
  totalCredits?: number;
}

export function useUpgradePrompt() {
  const [promptState, setPromptState] = useState<UpgradePromptState>({
    isOpen: false,
    trigger: 'generation_limit',
    currentPlan: 'free',
  });

  const showUpgradePrompt = useCallback((
    trigger: UpgradeTrigger,
    currentPlan: PlanTier,
    options?: {
      remainingCredits?: number;
      totalCredits?: number;
    }
  ) => {
    setPromptState({
      isOpen: true,
      trigger,
      currentPlan,
      remainingCredits: options?.remainingCredits,
      totalCredits: options?.totalCredits,
    });
  }, []);

  const hideUpgradePrompt = useCallback(() => {
    setPromptState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    promptState,
    showUpgradePrompt,
    hideUpgradePrompt,
  };
}
