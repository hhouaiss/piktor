/**
 * Subscription Management Service
 * Handles all subscription-related database operations with Supabase
 */

import { supabase, supabaseAdmin } from '@/lib/supabase/config';
import type { PlanTier, BillingInterval } from '@/lib/pricing';
import type { Subscription } from '@/lib/pricing/subscription-types';

// Database subscription type
export interface DbSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_id: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  billing_interval: BillingInterval;
  amount: number; // in cents
  currency: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  generations_limit: number;
  generations_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's active subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await (supabaseAdmin as any)
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No subscription found - return null
      return null;
    }
    console.error('Error fetching subscription:', error);
    throw error;
  }

  if (!data) return null;

  return transformDbSubscription(data);
}

/**
 * Create a new subscription (called when user signs up or upgrades)
 */
export async function createSubscription(params: {
  userId: string;
  planId: PlanTier;
  billingInterval: BillingInterval;
  amount: number; // in cents
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  generationsLimit: number;
  trialEnd?: Date;
}): Promise<Subscription> {
  const now = new Date();
  const periodEnd = new Date(now);

  if (params.trialEnd) {
    // If trial, period end is trial end
    periodEnd.setTime(params.trialEnd.getTime());
  } else if (params.billingInterval === 'month') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Cancel all previous active subscriptions for this user before creating a new one
  console.log('[createSubscription] Canceling previous active subscriptions for user:', params.userId);
  const { error: cancelError } = await (supabaseAdmin as any)
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: now.toISOString() })
    .eq('user_id', params.userId)
    .in('status', ['active', 'trialing', 'past_due']);

  if (cancelError) {
    console.error('[createSubscription] Error canceling previous subscriptions:', cancelError);
    // Don't throw - continue with creating new subscription
  } else {
    console.log('[createSubscription] Previous subscriptions canceled successfully');
  }

  const { data, error } = await (supabaseAdmin as any)
    .from('subscriptions')
    .insert({
      user_id: params.userId,
      plan_id: params.planId,
      billing_interval: params.billingInterval,
      amount: params.amount,
      currency: 'eur',
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      stripe_price_id: params.stripePriceId,
      generations_limit: params.generationsLimit,
      generations_used: 0,
      status: params.trialEnd ? 'trialing' : 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_start: params.trialEnd ? now.toISOString() : null,
      trial_end: params.trialEnd ? params.trialEnd.toISOString() : null,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }

  return transformDbSubscription(data);
}

/**
 * Update subscription (for plan changes, cancellations, etc.)
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<DbSubscription>
): Promise<Subscription> {
  const { data, error } = await (supabaseAdmin as any)
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  return transformDbSubscription(data);
}

/**
 * Update subscription by Stripe subscription ID (used in webhooks)
 */
export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  updates: Partial<DbSubscription>
): Promise<Subscription | null> {
  const { data, error } = await (supabaseAdmin as any)
    .from('subscriptions')
    .update(updates)
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No subscription found
      return null;
    }
    console.error('Error updating subscription by Stripe ID:', error);
    throw error;
  }

  return transformDbSubscription(data);
}

/**
 * Cancel subscription (mark for cancellation at period end)
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Subscription> {
  const updates: Partial<DbSubscription> = {
    canceled_at: new Date().toISOString(),
  };

  if (cancelAtPeriodEnd) {
    // Get current subscription to set cancel_at
    const { data: current } = await (supabaseAdmin as any)
      .from('subscriptions')
      .select('current_period_end')
      .eq('id', subscriptionId)
      .single();

    if (current) {
      updates.cancel_at = current.current_period_end;
    }
  } else {
    updates.status = 'canceled';
  }

  return updateSubscription(subscriptionId, updates);
}

/**
 * Record a generation (decrement available credits)
 */
export async function recordGeneration(userId: string): Promise<boolean> {
  // Get current subscription
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  // Check if user has credits available
  if (subscription.usage.generationsUsed >= subscription.usage.generationsLimit) {
    throw new Error('Generation limit reached');
  }

  // Increment generations_used
  const { error } = await (supabaseAdmin as any)
    .from('subscriptions')
    .update({
      generations_used: subscription.usage.generationsUsed + 1,
    })
    .eq('id', subscription.id);

  if (error) {
    console.error('Error recording generation:', error);
    throw error;
  }

  // Also create usage record for analytics
  await (supabaseAdmin as any).from('usage_records').insert({
    user_id: userId,
    type: 'generation',
    credits_used: 1,
    metadata: {
      subscription_id: subscription.id,
      plan_id: subscription.planId,
    },
  });

  return true;
}

/**
 * Check if user can generate (has credits available)
 */
export async function canUserGenerate(userId: string): Promise<{
  canGenerate: boolean;
  remainingGenerations: number;
  requiresUpgrade: boolean;
}> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    // No subscription - create free tier subscription (Découverte plan)
    const freeSub = await createSubscription({
      userId,
      planId: 'free',
      billingInterval: 'month',
      amount: 0,
      generationsLimit: 5, // Updated to match new Découverte plan
    });

    return {
      canGenerate: true,
      remainingGenerations: freeSub.usage.generationsLimit,
      requiresUpgrade: false,
    };
  }

  const remaining = subscription.usage.generationsLimit - subscription.usage.generationsUsed;
  const canGenerate = remaining > 0;

  return {
    canGenerate,
    remainingGenerations: Math.max(0, remaining),
    requiresUpgrade: !canGenerate,
  };
}

/**
 * Get subscription by Stripe customer ID
 */
export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching subscription by Stripe customer ID:', error);
    throw error;
  }

  if (!data) return null;

  return transformDbSubscription(data);
}

/**
 * Reset monthly usage for all subscriptions (to be called by cron job)
 */
export async function resetMonthlyUsage(): Promise<void> {
  const { error } = await supabase.rpc('reset_monthly_usage');

  if (error) {
    console.error('Error resetting monthly usage:', error);
    throw error;
  }
}

/**
 * Transform database subscription to application subscription type
 */
function transformDbSubscription(dbSub: DbSubscription): Subscription {
  return {
    id: dbSub.id,
    userId: dbSub.user_id,
    status: dbSub.status,
    planId: dbSub.plan_id,
    billingInterval: dbSub.billing_interval,
    stripeCustomerId: dbSub.stripe_customer_id || undefined,
    stripeSubscriptionId: dbSub.stripe_subscription_id || undefined,
    stripePriceId: dbSub.stripe_price_id || undefined,
    currentPeriodStart: new Date(dbSub.current_period_start),
    currentPeriodEnd: new Date(dbSub.current_period_end),
    cancelAt: dbSub.cancel_at ? new Date(dbSub.cancel_at) : null,
    canceledAt: dbSub.canceled_at ? new Date(dbSub.canceled_at) : null,
    trialStart: dbSub.trial_start ? new Date(dbSub.trial_start) : null,
    trialEnd: dbSub.trial_end ? new Date(dbSub.trial_end) : null,
    amount: dbSub.amount,
    currency: dbSub.currency,
    usage: {
      generationsUsed: dbSub.generations_used,
      generationsLimit: dbSub.generations_limit,
      periodStart: new Date(dbSub.current_period_start),
      periodEnd: new Date(dbSub.current_period_end),
    },
    metadata: dbSub.metadata as Record<string, string>,
    createdAt: new Date(dbSub.created_at),
    updatedAt: new Date(dbSub.updated_at),
  };
}

/**
 * Initialize free subscription for new users
 */
export async function initializeFreeSubscription(userId: string): Promise<Subscription> {
  // Check if user already has a subscription
  const existing = await getUserSubscription(userId);
  if (existing) {
    return existing;
  }

  // Create free tier subscription (Découverte plan with 5 credits)
  return createSubscription({
    userId,
    planId: 'free',
    billingInterval: 'month',
    amount: 0,
    generationsLimit: 5, // Updated to match new Découverte plan
  });
}
