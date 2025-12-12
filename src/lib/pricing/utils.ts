/**
 * Pricing utility functions
 */

import { Plan, PlanTier, BillingInterval } from './plans';
import { Subscription, UsageCheck } from './subscription-types';

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency = 'EUR'): string {
  const euros = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Format price from euros (used in Plan config)
 */
export function formatPriceFromEuros(euros: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Convert euros to cents for Stripe
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convert cents to euros from Stripe
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Calculate yearly savings percentage
 */
export function calculateSavingsPercentage(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - yearlyPrice;
  return Math.round((savings / monthlyTotal) * 100);
}

/**
 * Get price for interval
 */
export function getPriceForInterval(plan: Plan, interval: BillingInterval): number {
  return interval === 'month' ? plan.price.monthly : plan.price.yearly;
}

/**
 * Calculate effective monthly price for yearly plans
 */
export function getEffectiveMonthlyPrice(plan: Plan, interval: BillingInterval): number {
  if (interval === 'month') {
    return plan.price.monthly;
  }
  return Math.round(plan.price.yearly / 12);
}

/**
 * Check if user has exceeded usage limits
 */
export function checkUsageLimits(subscription: Subscription): UsageCheck {
  const { generationsUsed, generationsLimit } = subscription.usage;
  const remaining = Math.max(0, generationsLimit - generationsUsed);
  const canGenerate = generationsLimit === -1 || remaining > 0;

  return {
    canGenerate,
    generationsRemaining: generationsLimit === -1 ? Infinity : remaining,
    generationsUsed,
    generationsLimit,
    resetDate: subscription.currentPeriodEnd,
    requiresUpgrade: !canGenerate,
  };
}

/**
 * Get days until billing period ends
 */
export function getDaysUntilRenewal(subscription: Subscription): number {
  const now = new Date();
  const end = new Date(subscription.currentPeriodEnd);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: Subscription): boolean {
  return ['active', 'trialing'].includes(subscription.status);
}

/**
 * Check if subscription is in grace period (past_due but still active)
 */
export function isInGracePeriod(subscription: Subscription): boolean {
  return subscription.status === 'past_due';
}

/**
 * Get subscription status display text
 */
export function getSubscriptionStatusText(status: Subscription['status']): string {
  const statusMap: Record<Subscription['status'], string> = {
    active: 'Actif',
    trialing: 'Période d\'essai',
    past_due: 'Paiement en retard',
    canceled: 'Annulé',
    unpaid: 'Impayé',
    incomplete: 'Incomplet',
  };
  return statusMap[status] || status;
}

/**
 * Get subscription status color
 */
export function getSubscriptionStatusColor(status: Subscription['status']): string {
  const colorMap: Record<Subscription['status'], string> = {
    active: 'success',
    trialing: 'info',
    past_due: 'warning',
    canceled: 'error',
    unpaid: 'error',
    incomplete: 'warning',
  };
  return colorMap[status] || 'default';
}

/**
 * Calculate pro-rated amount for plan change
 */
export function calculateProration(
  currentPlan: Plan,
  newPlan: Plan,
  daysRemaining: number,
  interval: BillingInterval
): number {
  const currentPrice = getPriceForInterval(currentPlan, interval);
  const newPrice = getPriceForInterval(newPlan, interval);

  const daysInPeriod = interval === 'month' ? 30 : 365;
  const unusedAmount = (currentPrice / daysInPeriod) * daysRemaining;
  const newAmount = (newPrice / daysInPeriod) * daysRemaining;

  return Math.max(0, newAmount - unusedAmount);
}

/**
 * Determine if upgrade or downgrade
 */
export function isUpgrade(currentPlan: PlanTier, newPlan: PlanTier): boolean {
  const planOrder: PlanTier[] = ['free', 'early_adopter', 'starter', 'professional', 'business', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const newIndex = planOrder.indexOf(newPlan);
  return newIndex > currentIndex;
}

/**
 * Get recommended plan based on usage
 */
export function getRecommendedPlan(
  averageMonthlyGenerations: number,
  plans: Plan[]
): Plan | null {
  // Find the cheapest plan that can accommodate the usage
  const sortedPlans = plans
    .filter(plan => {
      const limit = plan.limits.generations;
      return limit === -1 || limit >= averageMonthlyGenerations;
    })
    .sort((a, b) => a.price.monthly - b.price.monthly);

  return sortedPlans[0] || null;
}

/**
 * Format generation limit for display
 */
export function formatGenerationLimit(limit: number): string {
  if (limit === -1) return 'Illimité';
  return limit.toLocaleString('fr-FR');
}

/**
 * Calculate ROI for furniture photography
 * Traditional photography cost vs Piktor subscription
 */
export function calculatePhotographyROI(
  subscriptionPrice: number,
  generationsPerMonth: number,
  traditionalCostPerProduct: number = 500
): {
  monthlySavings: number;
  yearlySavings: number;
  breakEvenProducts: number;
  roi: number;
} {
  const traditionalCost = generationsPerMonth * traditionalCostPerProduct;
  const monthlySavings = traditionalCost - subscriptionPrice;
  const yearlySavings = monthlySavings * 12;
  const breakEvenProducts = Math.ceil(subscriptionPrice / traditionalCostPerProduct);
  const roi = traditionalCost > 0 ? ((monthlySavings / subscriptionPrice) * 100) : 0;

  return {
    monthlySavings,
    yearlySavings,
    breakEvenProducts,
    roi,
  };
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Get billing interval display text
 */
export function getBillingIntervalText(interval: BillingInterval): string {
  return interval === 'month' ? 'Mensuel' : 'Annuel';
}

/**
 * Create mock subscription for development/testing
 */
export function createMockSubscription(
  userId: string,
  planId: PlanTier,
  interval: BillingInterval = 'month'
): Subscription {
  const now = new Date();
  const periodEnd = new Date(now);

  if (interval === 'month') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  return {
    id: `sub_mock_${Date.now()}`,
    userId,
    status: 'active',
    planId,
    billingInterval: interval,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    amount: planId === 'free' ? 0 : (interval === 'month' ? 2900 : 29000), // Example
    currency: 'eur',
    usage: {
      generationsUsed: 0,
      generationsLimit: planId === 'free' ? 5 : 100, // Fixed: Free plan has 5 generations
      periodStart: now,
      periodEnd: periodEnd,
    },
    createdAt: now,
    updatedAt: now,
  };
}
