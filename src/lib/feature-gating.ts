/**
 * Feature Gating Utility
 * Controls access to premium features based on subscription plan
 */

import { PlanTier } from '@/lib/pricing/plans';

export interface FeatureAccess {
  hasAccess: boolean;
  requiredPlan: PlanTier;
  requiredPlanName: string;
  upgradeMessage: string;
}

/**
 * Check if a user's plan allows access to all formats
 */
export function canAccessAllFormats(userPlan: PlanTier): FeatureAccess {
  const hasAccess = userPlan !== 'free';

  return {
    hasAccess,
    requiredPlan: 'early_adopter',
    requiredPlanName: 'Creator',
    upgradeMessage: 'Passez au plan Creator pour débloquer tous les formats (Story & Paysage)'
  };
}

/**
 * Check if a user's plan allows custom instructions/prompts
 */
export function canAccessCustomInstructions(userPlan: PlanTier): FeatureAccess {
  const hasAccess = userPlan !== 'free';

  return {
    hasAccess,
    requiredPlan: 'early_adopter',
    requiredPlanName: 'Creator',
    upgradeMessage: 'Les instructions personnalisées sont disponibles dans les plans Creator & Studio'
  };
}

/**
 * Check if a user's plan allows high-definition export
 */
export function canAccessHighDefinition(userPlan: PlanTier): FeatureAccess {
  const hasAccess = userPlan === 'starter' || userPlan === 'professional' ||
                    userPlan === 'business' || userPlan === 'enterprise';

  return {
    hasAccess,
    requiredPlan: 'starter',
    requiredPlanName: 'Studio',
    upgradeMessage: 'L\'export Haute Définition est disponible dans le plan Studio'
  };
}

/**
 * Check if a user's plan allows priority processing
 */
export function canAccessPriorityProcessing(userPlan: PlanTier): FeatureAccess {
  const hasAccess = userPlan === 'starter' || userPlan === 'professional' ||
                    userPlan === 'business' || userPlan === 'enterprise';

  return {
    hasAccess,
    requiredPlan: 'starter',
    requiredPlanName: 'Studio',
    upgradeMessage: 'Le traitement prioritaire est disponible dans le plan Studio'
  };
}

/**
 * Check if a specific format is available for the user's plan
 */
export function isFormatAvailable(format: string, userPlan: PlanTier): boolean {
  // Free plan only has access to square format
  if (userPlan === 'free') {
    return format === 'square-format';
  }

  // All other plans have access to all formats
  return true;
}

/**
 * Get locked formats for a user's plan
 */
export function getLockedFormats(userPlan: PlanTier): string[] {
  if (userPlan === 'free') {
    return ['instagram-story', 'lifestyle-horizontal'];
  }

  return [];
}

/**
 * Check if a user's plan allows image editing
 */
export function canAccessImageEditing(userPlan: PlanTier): FeatureAccess {
  const hasAccess = userPlan !== 'free';

  return {
    hasAccess,
    requiredPlan: 'early_adopter',
    requiredPlanName: 'Creator',
    upgradeMessage: 'L\'édition d\'images est disponible à partir du plan Creator'
  };
}

/**
 * Check if a user's plan allows generating variations
 */
export function canAccessVariations(userPlan: PlanTier): FeatureAccess {
  const hasAccess = userPlan !== 'free';

  return {
    hasAccess,
    requiredPlan: 'early_adopter',
    requiredPlanName: 'Creator',
    upgradeMessage: 'La génération de variations est disponible à partir du plan Creator'
  };
}

/**
 * Get feature comparison for upgrade prompts
 */
export function getFeatureComparison(currentPlan: PlanTier) {
  const features = {
    free: {
      formats: ['Carré (1:1) uniquement'],
      customInstructions: false,
      highDefinition: false,
      priorityProcessing: false,
      imageEditing: false,
      variations: false
    },
    early_adopter: {
      formats: ['Tous les formats'],
      customInstructions: true,
      highDefinition: false,
      priorityProcessing: false,
      imageEditing: true,
      variations: true
    },
    starter: {
      formats: ['Tous les formats'],
      customInstructions: true,
      highDefinition: true,
      priorityProcessing: true,
      imageEditing: true,
      variations: true
    }
  };

  return features[currentPlan as keyof typeof features] || features.free;
}
