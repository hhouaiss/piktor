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
 * MVP STAGE PRICING (Phase 1: Months 1-6)
 * Focus on user acquisition and product validation
 */
export const MVP_PLANS: Record<PlanTier, Plan> = {
  free: {
    id: 'free',
    name: 'Gratuit (Beta)',
    description: 'Testez Piktor gratuitement pendant la phase beta',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      { text: '25 générations par mois', included: true },
      { text: 'Tous les formats de sortie', included: true },
      { text: '5 environnements prédéfinis', included: true },
      { text: 'Support email', included: true },
      { text: 'Accès API', included: false },
      { text: 'Personnalisation avancée', included: false },
    ],
    limits: {
      generations: 25,
      formats: ['square', 'story', 'horizontal'],
      environments: 5,
      apiAccess: false,
      support: 'email',
      customBranding: false,
      advancedCustomization: false,
    },
    badge: 'BETA',
    ctaText: 'Commencer gratuitement',
  },

  early_adopter: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Tarif fondateur - Prix bloqué à vie',
    price: {
      monthly: 29,
      yearly: 290, // ~17% discount
    },
    stripePriceIds: {
      // To be filled: monthly: 'price_xxx',
      // To be filled: yearly: 'price_xxx',
    },
    features: [
      { text: '100 générations par mois', included: true },
      { text: 'Tous les formats de sortie', included: true },
      { text: 'Tous les environnements', included: true },
      { text: 'Instructions personnalisées', included: true },
      { text: 'Badge "Founder" à vie', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Accès API (bientôt)', included: true },
      { text: 'Personnalisation avancée (bientôt)', included: false },
    ],
    limits: {
      generations: 100,
      formats: ['square', 'story', 'horizontal'],
      environments: -1, // unlimited
      apiAccess: false, // Coming soon
      support: 'priority',
      customBranding: false,
      advancedCustomization: false,
    },
    badge: 'EARLY ACCESS',
    highlighted: true,
    ctaText: 'Obtenir le tarif fondateur',
    savings: '50% de réduction - Tarif à vie',
  },

  // Future plans (to be activated after MVP validation)
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Pour les petites boutiques en ligne',
    price: {
      monthly: 49,
      yearly: 470, // 20% discount
    },
    features: [
      { text: '50 générations par mois', included: true },
      { text: 'Tous les formats de sortie', included: true },
      { text: 'Environnements standard', included: true },
      { text: 'Support email', included: true },
      { text: 'Accès API', included: false },
    ],
    limits: {
      generations: 50,
      formats: ['square', 'story', 'horizontal'],
      environments: 5,
      apiAccess: false,
      support: 'email',
      customBranding: false,
      advancedCustomization: false,
    },
    ctaText: 'Commencer',
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
    highlighted: true,
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
    description: 'Solution sur mesure pour grandes organisations',
    price: {
      monthly: 999, // Starting price
      yearly: 9990,
    },
    features: [
      { text: 'Générations illimitées', included: true },
      { text: 'Tous les formats de sortie', included: true },
      { text: 'Environnements 100% personnalisés', included: true },
      { text: 'Formation de modèle IA personnalisé', included: true },
      { text: 'Support dédié & SLA 99.9%', included: true },
      { text: 'Accès API Enterprise', included: true },
      { text: 'Intégrations personnalisées', included: true },
      { text: 'Déploiement on-premise (option)', included: true },
      { text: 'Infrastructure dédiée', included: true },
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
    ctaText: 'Nous contacter',
    badge: 'SUR MESURE',
  },
};

/**
 * Get active plans based on MVP stage
 * During MVP, only show Free and Early Adopter
 */
export function getActivePlans(isMVPStage = true): Plan[] {
  if (isMVPStage) {
    return [MVP_PLANS.free, MVP_PLANS.early_adopter];
  }

  // Post-MVP: Show all plans except early_adopter
  return [
    MVP_PLANS.starter,
    MVP_PLANS.professional,
    MVP_PLANS.business,
    MVP_PLANS.enterprise,
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
