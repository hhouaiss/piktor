/**
 * Stripe-compatible Subscription Types
 * These types mirror Stripe's data structure for easy integration
 */

import { PlanTier, BillingInterval, SubscriptionStatus } from './plans';

/**
 * Subscription object (matches Stripe Subscription structure)
 */
export interface Subscription {
  id: string; // Stripe subscription ID
  userId: string;
  status: SubscriptionStatus;
  planId: PlanTier;
  billingInterval: BillingInterval;

  // Stripe-specific fields
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;

  // Billing dates
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date | null;
  canceledAt?: Date | null;
  trialStart?: Date | null;
  trialEnd?: Date | null;

  // Pricing
  amount: number; // in cents (e.g., 2900 for €29.00)
  currency: string; // 'eur'

  // Usage tracking
  usage: {
    generationsUsed: number;
    generationsLimit: number;
    periodStart: Date;
    periodEnd: Date;
  };

  // Metadata
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment method (matches Stripe PaymentMethod)
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'sepa_debit' | 'paypal';
  card?: {
    brand: string; // 'visa', 'mastercard', etc.
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: Date;
}

/**
 * Invoice (matches Stripe Invoice)
 */
export interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;

  // Stripe fields
  stripeInvoiceId?: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;

  // Amounts
  amount: number; // in cents
  amountPaid: number;
  amountDue: number;
  currency: string;

  // Status
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  paid: boolean;

  // Dates
  created: Date;
  dueDate?: Date;
  paidAt?: Date;

  // Line items
  lines: InvoiceLineItem[];

  // Metadata
  number?: string; // Invoice number (e.g., "INV-001")
  description?: string;
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  quantity: number;
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Usage record for metered billing
 */
export interface UsageRecord {
  id: string;
  subscriptionId: string;
  userId: string;
  timestamp: Date;
  quantity: number; // Number of generations
  action: string; // e.g., 'image_generation'
  metadata?: Record<string, unknown>;
}

/**
 * Subscription creation params (for Stripe Checkout)
 */
export interface CreateSubscriptionParams {
  userId: string;
  planId: PlanTier;
  billingInterval: BillingInterval;
  paymentMethodId?: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

/**
 * Subscription update params
 */
export interface UpdateSubscriptionParams {
  planId?: PlanTier;
  billingInterval?: BillingInterval;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Webhook event types from Stripe
 */
export type StripeWebhookEvent =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'checkout.session.completed'
  | 'payment_method.attached'
  | 'payment_method.detached';

/**
 * Webhook payload
 */
export interface StripeWebhookPayload {
  type: StripeWebhookEvent;
  data: {
    object: unknown; // Stripe object (Subscription, Invoice, etc.)
  };
  created: number;
  id: string;
}

/**
 * Customer billing portal session
 */
export interface BillingPortalSession {
  url: string; // Stripe-hosted billing portal URL
  returnUrl: string;
}

/**
 * Checkout session (for new subscriptions)
 */
export interface CheckoutSession {
  id: string;
  url: string; // Stripe Checkout URL
  customerId?: string;
  subscriptionId?: string;
  mode: 'payment' | 'subscription' | 'setup';
  status: 'open' | 'complete' | 'expired';
}

/**
 * Helper type for subscription creation response
 */
export interface SubscriptionResponse {
  success: boolean;
  subscription?: Subscription;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Helper type for usage check
 */
export interface UsageCheck {
  canGenerate: boolean;
  generationsRemaining: number;
  generationsUsed: number;
  generationsLimit: number;
  resetDate: Date;
  requiresUpgrade: boolean;
}
