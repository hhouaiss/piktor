/**
 * Stripe Checkout Service
 * Handles creating checkout sessions and customer portal sessions
 */

import { getStripe, getStripePriceId, APP_CONFIG } from './config';
import type { PlanTier, BillingInterval } from '@/lib/pricing';

export interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  planId: PlanTier;
  billingInterval: BillingInterval;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();

  // Get the price ID for this plan
  const priceId = getStripePriceId(params.planId, params.billingInterval);

  if (!priceId) {
    throw new Error(`No Stripe price ID configured for ${params.planId} ${params.billingInterval}`);
  }

  // Default URLs
  const successUrl = params.successUrl || `${APP_CONFIG.url}/dashboard/checkout-success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = params.cancelUrl || `${APP_CONFIG.url}/dashboard/account?canceled=true`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: params.userEmail,
      client_reference_id: params.userId, // Link session to our user
      subscription_data: {
        metadata: {
          user_id: params.userId,
          plan_id: params.planId,
          billing_interval: params.billingInterval,
        },
      },
      metadata: {
        user_id: params.userId,
        plan_id: params.planId,
        billing_interval: params.billingInterval,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create checkout session'
    );
  }
}

/**
 * Create a Stripe Customer Portal session
 * This allows customers to manage their subscription, payment methods, and invoices
 */
export async function createCustomerPortalSession(
  stripeCustomerId: string,
  returnUrl?: string
): Promise<{ url: string }> {
  const stripe = getStripe();

  const defaultReturnUrl = `${APP_CONFIG.url}/dashboard/account`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || defaultReturnUrl,
    });

    return {
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create customer portal session'
    );
  }
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to retrieve checkout session'
    );
  }
}

/**
 * Get or create a Stripe customer
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  name?: string;
}): Promise<string> {
  const stripe = getStripe();

  try {
    // Search for existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: params.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        user_id: params.userId,
      },
    });

    return customer.id;
  } catch (error) {
    console.error('Error getting or creating Stripe customer:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to get or create customer'
    );
  }
}
