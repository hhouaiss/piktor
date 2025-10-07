/**
 * Create Stripe Customer Portal Session API
 * POST /api/stripe/create-portal-session
 *
 * Allows customers to manage their subscription, payment methods, and view invoices
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSubscription } from '@/lib/supabase/subscriptions';
import { createCustomerPortalSession } from '@/lib/stripe/checkout';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const subscription = await getUserSubscription(user.id);

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Create customer portal session
    const session = await createCustomerPortalSession(
      subscription.stripeCustomerId
    );

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create customer portal session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
