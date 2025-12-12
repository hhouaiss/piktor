/**
 * Pricing Plans Configuration
 * Stripe-ready structure for subscription management
 */

export type BillingInterval = 'month' | 'year';
export type PlanTier = 'free' | 'early_adopter' | 'starter' | 'professional' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';

export interface PlanFeature {
  text: string;
  included: boolean;
  limit?: number | string;
}

export interface Plan {
  id: PlanTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  // Stripe Price IDs (to be filled when Stripe is integrated)
  stripePriceIds?: {
    monthly?: string;
    yearly?: string;
  };
  features: PlanFeature[];
  limits: {
    generations: number; // -1 for unlimited
    formats: string[];
    environments: number;
    apiAccess: boolean;
    support: 'email' | 'priority' | 'dedicated';
    customBranding: boolean;
    advancedCustomization: boolean;
  };
  // Marketing
  badge?: string;
  highlighted?: boolean;
  ctaText: string;
  savings?: string; // For yearly plans
}

/**
 * NEW PRICING STRUCTURE
 * Updated with new plans: Découverte, Creator, Studio, Enterprise
 */
export const MVP_PLANS: Record<PlanTier, Plan> = {
  free: {
    id: 'free',
    name: 'Découverte',
    description: 'Pour les curieux qui veulent tester la technologie',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      { text: '5 Crédits (Offerts à l\'inscription)', included: true },
      { text: 'Format Carré (1:1) uniquement', included: true },
      { text: 'Accès aux 5 Environnements (Salon, Bureau...)', included: true },
      { text: 'Pas d\'instructions textuelles', included: false },
      { text: 'Filigrane Piktor sur les images', included: true },
    ],
    limits: {
      generations: 5,
      formats: ['square'], // Only square format
      environments: 5,
      apiAccess: false,
      support: 'email',
      customBranding: false,
      advancedCustomization: false,
    },
    ctaText: 'Tester gratuitement',
  },

  early_adopter: {
    id: 'early_adopter',
    name: 'Creator',
    description: 'Pour les artisans, makers et petits e-commerçants',
    price: {
      monthly: 39,
      yearly: 390, // ~17% discount
    },
    stripePriceIds: {
      // To be filled: monthly: 'price_xxx',
      // To be filled: yearly: 'price_xxx',
    },
    features: [
      { text: '300 Crédits / mois', included: true },
      { text: 'Tous les formats (Story 9:16 & Paysage 3:2)', included: true },
      { text: 'Mode "Instructions Spéciales" (Prompt libre)', included: true },
      { text: 'Licence Commerciale (Usage web & réseaux)', included: true },
      { text: 'Sans filigrane', included: true },
    ],
    limits: {
      generations: 300,
      formats: ['square', 'story', 'horizontal'],
      environments: -1, // unlimited
      apiAccess: false,
      support: 'email',
      customBranding: false,
      advancedCustomization: true, // Has custom instructions mode
    },
    ctaText: 'Démarrer',
  },

  // Future plans (to be activated after MVP validation)
  starter: {
    id: 'starter',
    name: 'Studio',
    description: 'Pour les marques DNVB et PME qui exigent une qualité catalogue',
    price: {
      monthly: 149,
      yearly: 1490, // ~17% discount
    },
    features: [
      { text: '1 500 Crédits / mois', included: true },
      { text: 'Export Haute Définition (Priorité Qualité)', included: true },
      { text: 'Mode Confidentialité (Images privées)', included: true },
      { text: 'Traitement Prioritaire (Files d\'attente réduites)', included: true },
      { text: 'Support Chat Direct', included: true },
      { text: 'Accès aux nouveaux styles en Beta', included: true },
    ],
    limits: {
      generations: 1500,
      formats: ['square', 'story', 'horizontal'],
      environments: -1,
      apiAccess: false,
      support: 'priority',
      customBranding: false,
      advancedCustomization: true,
    },
    badge: 'Recommandé pour les Pros',
    highlighted: true,
    ctaText: 'Choisir Studio',
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Pour les e-commerces en croissance',
    price: {
      monthly: 149,
      yearly: 1430, // 20% discount
    },
    features: [
      { text: '250 générations par mois', included: true },
      { text: 'Tous les formats de sortie', included: true },
      { text: 'Tous les environnements', included: true },
      { text: 'Personnalisation avancée', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Accès API', included: true },
      { text: 'Traitement par lot (10 produits)', included: true },
    ],
    limits: {
      generations: 250,
      formats: ['square', 'story', 'horizontal'],
      environments: -1,
      apiAccess: true,
      support: 'priority',
      customBranding: false,
      advancedCustomization: true,
    },
    ctaText: 'Essayer Professional',
    savings: 'Plan le plus populaire',
  },

  business: {
    id: 'business',
    name: 'Business',
    description: 'Pour les marques établies',
    price: {
      monthly: 399,
      yearly: 3830, // 20% discount
    },
    features: [
      { text: '1000 générations par mois', included: true },
      { text: 'Tous les formats de sortie', included: true },
      { text: 'Environnements personnalisés', included: true },
      { text: 'Personnalisation avancée', included: true },
      { text: 'Support dédié', included: true },
      { text: 'Accès API avancé', included: true },
      { text: 'Traitement par lot illimité', included: true },
      { text: 'White-label', included: true },
      { text: 'Tableau de bord analytics', included: true },
    ],
    limits: {
      generations: 1000,
      formats: ['square', 'story', 'horizontal'],
      environments: -1,
      apiAccess: true,
      support: 'dedicated',
      customBranding: true,
      advancedCustomization: true,
    },
    ctaText: 'Passer au Business',
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Pour les industriels et grands catalogues nécessitant du sur-mesure',
    price: {
      monthly: 499, // Starting price
      yearly: 4990,
    },
    features: [
      { text: 'Crédits Illimités (Fair use)', included: true },
      { text: 'API Access (Connectez votre PIM/ERP)', included: true },
      { text: 'Matériauthèque Custom (Uploadez vos propres textures)', included: true },
      { text: 'Modèle IA Dédié (Entraîné sur vos produits spécifiques)', included: true },
      { text: 'Onboarding & Setup réalisé par notre équipe', included: true },
      { text: 'Paiement sur facture annuelle', included: true },
    ],
    limits: {
      generations: -1, // unlimited (fair use)
      formats: ['square', 'story', 'horizontal'],
      environments: -1,
      apiAccess: true,
      support: 'dedicated',
      customBranding: true,
      advancedCustomization: true,
    },
    ctaText: 'Contacter l\'équipe',
    badge: 'Sur Devis',
  },
};

/**
 * Get active plans
 * Show: Découverte (free), Creator (early_adopter), Studio (starter), Enterprise
 */
export function getActivePlans(): Plan[] {
  // Show the new pricing structure: Découverte, Creator, Studio, Enterprise
  return [
    MVP_PLANS.free,         // Découverte
    MVP_PLANS.early_adopter, // Creator
    MVP_PLANS.starter,      // Studio
    MVP_PLANS.enterprise,   // Enterprise
  ];
}

/**
 * Calculate savings for yearly billing
 */
export function calculateYearlySavings(plan: Plan): number {
  const monthlyTotal = plan.price.monthly * 12;
  const yearlyPrice = plan.price.yearly;
  return monthlyTotal - yearlyPrice;
}

/**
 * Get plan by ID
 */
export function getPlanById(planId: PlanTier): Plan | undefined {
  return MVP_PLANS[planId];
}

/**
 * Check if user can access feature based on plan
 */
export function canAccessFeature(
  userPlan: PlanTier,
  feature: keyof Plan['limits']
): boolean {
  const plan = getPlanById(userPlan);
  if (!plan) return false;

  const featureValue = plan.limits[feature];
  if (typeof featureValue === 'boolean') return featureValue;
  if (typeof featureValue === 'number') return featureValue !== 0;
  return true;
}

/**
 * Get upgrade suggestions
 */
export function getUpgradePath(currentPlan: PlanTier): Plan | null {
  const planOrder: PlanTier[] = ['free', 'early_adopter', 'starter', 'professional', 'business', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);

  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null; // No upgrade available
  }

  return MVP_PLANS[planOrder[currentIndex + 1]];
}
