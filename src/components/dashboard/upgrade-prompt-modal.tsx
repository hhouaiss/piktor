"use client";

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Zap, Check, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Plan, PlanTier, getUpgradePath, getPlanById } from '@/lib/pricing/plans';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanTier;
  trigger: 'generation_limit' | 'format_locked' | 'feature_locked';
  remainingCredits?: number;
  totalCredits?: number;
}

export function UpgradePromptModal({
  isOpen,
  onClose,
  currentPlan,
  trigger,
  remainingCredits = 0,
  totalCredits = 5
}: UpgradePromptModalProps) {
  const router = useRouter();
  const suggestedPlan = getUpgradePath(currentPlan);
  const currentPlanDetails = getPlanById(currentPlan);

  const handleUpgrade = () => {
    // Track upgrade click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'upgrade_prompt_clicked', {
        event_category: 'Conversion',
        event_label: trigger,
        current_plan: currentPlan,
        suggested_plan: suggestedPlan?.id
      });
    }

    router.push('/dashboard/account?tab=plans');
    onClose();
  };

  const handleDismiss = () => {
    // Track dismissal
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'upgrade_prompt_dismissed', {
        event_category: 'Engagement',
        event_label: trigger,
        current_plan: currentPlan
      });
    }

    onClose();
  };

  if (!suggestedPlan) {
    return null; // No upgrade available
  }

  // Customized messaging based on trigger
  const getHeaderContent = () => {
    switch (trigger) {
      case 'generation_limit':
        return {
          icon: <Zap className="w-8 h-8 text-amber-500" />,
          title: '🎉 Limite de crédits atteinte !',
          description: `Vous avez utilisé ${totalCredits - remainingCredits}/${totalCredits} crédits. Pour continuer à créer des visuels magnifiques, passez au plan ${suggestedPlan.name}.`
        };
      case 'format_locked':
        return {
          icon: <Crown className="w-8 h-8 text-purple-500" />,
          title: 'Format Premium',
          description: `Les formats Story (9:16) et Paysage (3:2) sont disponibles avec le plan ${suggestedPlan.name} et supérieur.`
        };
      case 'feature_locked':
        return {
          icon: <Sparkles className="w-8 h-8 text-blue-500" />,
          title: 'Fonctionnalité Premium',
          description: `Cette fonctionnalité est disponible avec le plan ${suggestedPlan.name}.`
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 p-8 pb-6 border-b">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
              {headerContent.icon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-2">
                {headerContent.title}
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600 dark:text-gray-300">
                {headerContent.description}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Plan comparison */}
        <div className="p-6 space-y-6">
          {/* Current vs Suggested Plan Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Plan */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Plan Actuel
              </div>
              <div className="font-semibold text-lg">{currentPlanDetails?.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {currentPlanDetails?.limits.generations === -1
                  ? 'Illimité'
                  : `${currentPlanDetails?.limits.generations} crédits/mois`}
              </div>
            </div>

            {/* Suggested Plan */}
            <div className="p-4 rounded-lg border-2 border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-500 text-white text-xs font-semibold rounded-bl-lg">
                Recommandé
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1 font-semibold">
                Plan Suggéré
              </div>
              <div className="font-bold text-xl text-purple-700 dark:text-purple-300">
                {suggestedPlan.name}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">
                {suggestedPlan.limits.generations === -1
                  ? 'Crédits Illimités'
                  : `${suggestedPlan.limits.generations} crédits/mois`}
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-2">
                {suggestedPlan.price.monthly}€
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/mois</span>
              </div>
            </div>
          </div>

          {/* Key benefits */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Avec {suggestedPlan.name}, débloquez :
            </div>
            <div className="space-y-2">
              {suggestedPlan.features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <Crown className="w-5 h-5 mr-2" />
              Passer à {suggestedPlan.name}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="px-6 py-6 text-sm"
            >
              Plus tard
            </Button>
          </div>

          {/* Trust indicator */}
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ✨ Changement de plan immédiat • Annulation à tout moment
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
