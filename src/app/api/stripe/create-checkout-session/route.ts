/**
 * Create Stripe Checkout Session API
 * POST /api/stripe/create-checkout-session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import type { PlanTier, BillingInterval } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Debug logging
    console.log('Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: authError?.message
    });

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({
        error: 'Unauthorized',
        details: authError?.message || 'No user session found'
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { planId, billingInterval } = body as {
      planId: PlanTier;
      billingInterval: BillingInterval;
    };

    // Validate inputs
    if (!planId || !billingInterval) {
      return NextResponse.json(
        { error: 'Missing planId or billingInterval' },
        { status: 400 }
      );
    }

    // Don't allow checkout for free plan
    if (planId === 'free') {
      return NextResponse.json(
        { error: 'Cannot create checkout session for free plan' },
        { status: 400 }
      );
    }

    // Use the user's email from auth (no need to query users table)
    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      planId,
      billingInterval,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
