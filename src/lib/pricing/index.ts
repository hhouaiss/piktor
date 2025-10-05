/**
 * Piktor Pricing Module
 *
 * Centralized pricing management system with Stripe-ready architecture
 *
 * @module pricing
 */

// Plans configuration
export {
  MVP_PLANS,
  getActivePlans,
  calculateYearlySavings,
  getPlanById,
  canAccessFeature,
  getUpgradePath,
  type Plan,
  type PlanFeature,
  type PlanTier,
  type BillingInterval,
  type SubscriptionStatus,
} from './plans';

// Subscription types
export type {
  Subscription,
  PaymentMethod,
  Invoice,
  InvoiceLineItem,
  UsageRecord,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
  StripeWebhookEvent,
  StripeWebhookPayload,
  BillingPortalSession,
  CheckoutSession,
  SubscriptionResponse,
  UsageCheck,
} from './subscription-types';

// Utility functions
export {
  formatPrice,
  formatPriceFromEuros,
  eurosToCents,
  centsToEuros,
  calculateSavingsPercentage,
  getPriceForInterval,
  getEffectiveMonthlyPrice,
  checkUsageLimits,
  getDaysUntilRenewal,
  isSubscriptionActive,
  isInGracePeriod,
  getSubscriptionStatusText,
  getSubscriptionStatusColor,
  calculateProration,
  isUpgrade,
  getRecommendedPlan,
  formatGenerationLimit,
  calculatePhotographyROI,
  formatDate,
  formatDateTime,
  getBillingIntervalText,
  createMockSubscription,
} from './utils';
