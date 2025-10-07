/**
 * Stripe Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Stripe account at https://stripe.com
 * 2. Get your keys from https://dashboard.stripe.com/apikeys
 * 3. Add to .env.local:
 *    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
 *    STRIPE_SECRET_KEY=sk_test_xxx
 *    STRIPE_WEBHOOK_SECRET=whsec_xxx
 * 4. Create products and prices in Stripe Dashboard
 * 5. Update STRIPE_PRICE_IDS below with your price IDs
 */

import Stripe from 'stripe';

// Stripe API version
const STRIPE_API_VERSION = '2025-09-30.clover';

// Initialize Stripe (server-side only)
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY environment variable. Please add it to .env.local'
    );
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });
}

// Get publishable key (client-side safe)
export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable'
    );
  }

  return key;
}

// Get webhook secret
export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      'Missing STRIPE_WEBHOOK_SECRET environment variable. ' +
      'Get it from Stripe Dashboard > Developers > Webhooks'
    );
  }

  return secret;
}

/**
 * Stripe Price IDs
 *
 * TODO: After creating products/prices in Stripe Dashboard, update these IDs
 *
 * To create prices:
 * 1. Go to https://dashboard.stripe.com/products
 * 2. Create products for each plan
 * 3. Add monthly and yearly prices
 * 4. Copy the price IDs (start with price_xxx)
 * 5. Update the object below
 */
export const STRIPE_PRICE_IDS = {
  free: {
    monthly: null, // Free plan has no Stripe price
    yearly: null,
  },
  early_adopter: {
    monthly: process.env.STRIPE_PRICE_EARLY_ADOPTER_MONTHLY || 'price_1SFEp52S50jljHVCPkFEUTU4',
    yearly: process.env.STRIPE_PRICE_EARLY_ADOPTER_YEARLY || 'price_1SFEp82S50jljHVCVqy9soHV',
  },
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_XXXXX',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_XXXXX',
  },
  professional: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_XXXXX',
    yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || 'price_XXXXX',
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_XXXXX',
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_XXXXX',
  },
  enterprise: {
    // Enterprise is custom, handled separately
    monthly: null,
    yearly: null,
  },
} as const;

/**
 * App configuration
 */
export const APP_CONFIG = {
  name: 'Piktor',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supportEmail: 'support@piktor.com',
};

/**
 * Stripe webhook events we listen to
 */
export const STRIPE_WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'checkout.session.completed',
  'customer.created',
  'customer.updated',
] as const;

/**
 * Billing intervals
 */
export type StripeBillingInterval = 'month' | 'year';

/**
 * Get price ID for a plan and interval
 */
export function getStripePriceId(
  planId: keyof typeof STRIPE_PRICE_IDS,
  interval: StripeBillingInterval
): string | null {
  const plan = STRIPE_PRICE_IDS[planId];
  if (interval === 'month') {
    return plan.monthly;
  } else {
    return plan.yearly;
  }
}
