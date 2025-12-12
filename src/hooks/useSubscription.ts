/**
 * Hook to fetch and manage user subscription data
 */

import { useState, useEffect, useRef } from 'react';
import { useSimpleAuth } from '@/components/auth/simple-auth-provider';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

export interface UserSubscription {
  id: string;
  planId: 'free' | 'early_adopter' | 'starter' | 'professional' | 'business' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  generationsLimit: number;
  generationsUsed: number;
  currentPeriodEnd: string;
  billingInterval: 'month' | 'year';
  amount: number;
  currency: string;
}

export function useSubscription() {
  const { user } = useSimpleAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[useSubscription] Fetching subscription for user:', user.id);

        // Fetch active subscription
        const { data, error: fetchError } = await (supabaseClient as any)
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing', 'past_due'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching subscription:', {
            error: fetchError,
            code: fetchError?.code,
            message: fetchError?.message,
            details: fetchError?.details,
            userId: user.id
          });
          throw fetchError;
        }

        console.log('[useSubscription] Subscription fetch result:', data ? 'Found' : 'Not found');

        if (data) {
          // Transform database subscription to app format
          setSubscription({
            id: data.id,
            planId: data.plan_id as UserSubscription['planId'],
            status: data.status as UserSubscription['status'],
            generationsLimit: data.generations_limit,
            generationsUsed: data.generations_used,
            currentPeriodEnd: data.current_period_end,
            billingInterval: data.billing_interval as 'month' | 'year',
            amount: data.amount,
            currency: data.currency,
          });
        } else {
          // No subscription found - user needs to be initialized with free tier
          // Use ref to prevent duplicate creation
          if (!isInitializingRef.current) {
            isInitializingRef.current = true;
            console.log('[useSubscription] No subscription found, initializing free tier');
            await initializeFreeTier();
            isInitializingRef.current = false;
          } else {
            console.log('[useSubscription] Free tier initialization already in progress, skipping');
          }
        }
      } catch (err) {
        console.error('Error in fetchSubscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
        // Fallback to free tier on error
        setSubscription({
          id: 'temp',
          planId: 'free',
          status: 'active',
          generationsLimit: 5, // Fixed: Free plan has 5 generations
          generationsUsed: 0,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          billingInterval: 'month',
          amount: 0,
          currency: 'eur',
        });
      } finally {
        setLoading(false);
      }
    };

    const initializeFreeTier = async () => {
      try {
        // Create free tier subscription
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        console.log('[useSubscription] Creating free tier for user:', user.id);

        const { data, error: insertError } = await (supabaseClient as any)
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: 'free',
            status: 'active',
            billing_interval: 'month',
            amount: 0,
            currency: 'eur',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            generations_limit: 5, // Fixed: Free plan has 5 generations
            generations_used: 0,
            metadata: {},
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating free subscription:', {
            error: insertError,
            code: insertError?.code,
            message: insertError?.message,
            details: insertError?.details,
            hint: insertError?.hint,
            userId: user.id
          });
          throw insertError;
        }

        console.log('[useSubscription] Free tier created successfully:', data);

        if (data) {
          setSubscription({
            id: data.id,
            planId: 'free',
            status: 'active',
            generationsLimit: 5, // Fixed: Free plan has 5 generations
            generationsUsed: 0,
            currentPeriodEnd: periodEnd.toISOString(),
            billingInterval: 'month',
            amount: 0,
            currency: 'eur',
          });
        }
      } catch (err) {
        console.error('Error initializing free tier:', err);
        // Set fallback subscription
        setSubscription({
          id: 'temp',
          planId: 'free',
          status: 'active',
          generationsLimit: 5, // Fixed: Free plan has 5 generations
          generationsUsed: 0,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          billingInterval: 'month',
          amount: 0,
          currency: 'eur',
        });
      }
    };

    fetchSubscription();

    // Set up real-time subscription for subscription changes
    const channel = supabaseClient
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch subscription when it changes
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const refreshSubscription = async () => {
    if (!user?.id) return;
    setLoading(true);
    // Trigger refetch by updating the effect dependency
    const { data } = await (supabaseClient as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setSubscription({
        id: data.id,
        planId: data.plan_id as UserSubscription['planId'],
        status: data.status as UserSubscription['status'],
        generationsLimit: data.generations_limit,
        generationsUsed: data.generations_used,
        currentPeriodEnd: data.current_period_end,
        billingInterval: data.billing_interval as 'month' | 'year',
        amount: data.amount,
        currency: data.currency,
      });
    }
    setLoading(false);
  };

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    remainingGenerations: subscription
      ? Math.max(0, subscription.generationsLimit - subscription.generationsUsed)
      : 0,
  };
}
