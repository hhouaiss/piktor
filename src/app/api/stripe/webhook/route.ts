/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 *
 * IMPORTANT: This endpoint must be configured in Stripe Dashboard:
 * 1. Go to https://dashboard.stripe.com/webhooks
 * 2. Add endpoint: https://your-domain.com/api/stripe/webhook
 * 3. Select events: customer.subscription.*, invoice.*, checkout.session.completed
 * 4. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET env var
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe/config';
import {
  createSubscription,
  updateSubscriptionByStripeId,
  getSubscriptionByStripeCustomerId,
} from '@/lib/supabase/subscriptions';
import { getPlanById } from '@/lib/pricing';

// Disable body parsing, need raw body for webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    const webhookSecret = getStripeWebhookSecret();

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`[Webhook] Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('[Webhook] Handling checkout.session.completed', {
    sessionId: session.id,
    customer: session.customer,
    subscription: session.subscription,
    metadata: session.metadata
  });

  const userId = session.metadata?.user_id || session.client_reference_id;
  const planId = session.metadata?.plan_id as any;
  const billingInterval = session.metadata?.billing_interval as 'month' | 'year';

  console.log('[Webhook] Extracted metadata:', { userId, planId, billingInterval });

  if (!userId || !planId || !billingInterval) {
    console.error('[Webhook] Missing metadata in checkout session', {
      hasUserId: !!userId,
      hasPlanId: !!planId,
      hasBillingInterval: !!billingInterval,
      metadata: session.metadata,
      clientReferenceId: session.client_reference_id
    });
    return;
  }

  // Get plan details
  const plan = getPlanById(planId);
  if (!plan) {
    console.error(`Unknown plan: ${planId}`);
    return;
  }

  // Get subscription from Stripe
  if (!session.subscription) {
    console.error('No subscription in checkout session');
    return;
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Create subscription in our database
  const amount = billingInterval === 'month' ? plan.price.monthly : plan.price.yearly;

  console.log('[Webhook] Creating subscription with params:', {
    userId,
    planId,
    billingInterval,
    amount: amount * 100,
    generationsLimit: plan.limits.generations,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: subscription.id
  });

  try {
    await createSubscription({
      userId,
      planId,
      billingInterval,
      amount: amount * 100, // Convert to cents
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      generationsLimit: plan.limits.generations,
    });

    console.log(`[Webhook] ✅ Successfully created subscription for user ${userId}, plan ${planId}`);
  } catch (error) {
    console.error('[Webhook] ❌ Failed to create subscription:', error);
    throw error;
  }
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('[Webhook] Handling subscription update');

  const userId = subscription.metadata?.user_id;
  const planId = subscription.metadata?.plan_id as any;
  const billingInterval = subscription.metadata?.billing_interval as 'month' | 'year';

  if (!userId || !planId || !billingInterval) {
    console.error('Missing metadata in subscription');
    return;
  }

  // Get plan details
  const plan = getPlanById(planId);
  if (!plan) {
    console.error(`Unknown plan: ${planId}`);
    return;
  }

  // Map Stripe status to our status
  let status: any = 'active';
  if (subscription.status === 'trialing') status = 'trialing';
  else if (subscription.status === 'past_due') status = 'past_due';
  else if (subscription.status === 'canceled') status = 'canceled';
  else if (subscription.status === 'unpaid') status = 'unpaid';
  else if (subscription.status === 'incomplete') status = 'incomplete';

  // Update subscription (use bracket notation to avoid type conflicts)
  const sub = subscription as any;
  await updateSubscriptionByStripeId(sub.id, {
    status,
    stripe_price_id: sub.items?.data?.[0]?.price?.id,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at: sub.cancel_at
      ? new Date(sub.cancel_at * 1000).toISOString()
      : null,
    canceled_at: sub.canceled_at
      ? new Date(sub.canceled_at * 1000).toISOString()
      : null,
    trial_start: sub.trial_start
      ? new Date(sub.trial_start * 1000).toISOString()
      : null,
    trial_end: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
  });

  console.log(`[Webhook] Updated subscription ${subscription.id}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Webhook] Handling subscription deletion');

  await updateSubscriptionByStripeId(subscription.id, {
    status: 'canceled',
    canceled_at: new Date().toISOString(),
  });

  console.log(`[Webhook] Deleted subscription ${subscription.id}`);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('[Webhook] Handling invoice.paid');

  const inv = invoice as any;
  const invoiceSubscriptionId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id;
  if (!inv.customer || !invoiceSubscriptionId) {
    console.log('Invoice not related to subscription');
    return;
  }

  // Get subscription from database
  const subscription = await getSubscriptionByStripeCustomerId(
    inv.customer as string
  );

  if (!subscription) {
    console.error('Subscription not found for customer');
    return;
  }

  // Reset generation counter on successful payment (new billing period)
  await updateSubscriptionByStripeId(subscription.stripeSubscriptionId!, {
    generations_used: 0,
    status: 'active',
  });

  // TODO: Create invoice record in database for billing history
  // await createInvoice({...})

  console.log(`[Webhook] Processed paid invoice ${inv.id}`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Webhook] Handling invoice.payment_failed');

  const inv = invoice as any;
  const invoiceSubscriptionId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id;
  if (!inv.customer || !invoiceSubscriptionId) {
    return;
  }

  // Get subscription from database
  const subscription = await getSubscriptionByStripeCustomerId(
    inv.customer as string
  );

  if (!subscription) {
    console.error('Subscription not found for customer');
    return;
  }

  // Mark subscription as past_due
  await updateSubscriptionByStripeId(subscription.stripeSubscriptionId!, {
    status: 'past_due',
  });

  // TODO: Send payment failed email notification

  console.log(`[Webhook] Processed failed invoice ${inv.id}`);
}
