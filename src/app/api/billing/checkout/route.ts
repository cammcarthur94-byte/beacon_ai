import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { PRICING_TIERS, PLAN_TO_TIER, getPlan, type BeaconPlanId, type PricingTier } from '@/lib/billing/plan-limits';

/**
 * POST /api/billing/checkout
 * --------------------------
 * Called by the pricing table CTA buttons with { planId, billingCycle? }.
 * 1. Validates planId against the Beacon plan catalog (no free tier exists).
 * 2. Authenticates the user via Supabase session cookies.
 * 3. Creates a Stripe Checkout subscription session and returns { url }.
 *
 * Local dev (no STRIPE_SECRET_KEY / no Supabase): returns a simulated
 * success payload so the flow can be demoed end-to-end without Stripe.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const planId = body?.planId;
    const billingCycle: 'monthly' | 'annual' =
      body?.billingCycle === 'annual' ? 'annual' : 'monthly';

    if (!planId || !PRICING_TIERS.some((t) => t.id === planId)) {
      return NextResponse.json(
        { error: 'Invalid or missing planId. Must be one of: basic, starter, pro.' },
        { status: 400 }
      );
    }
    const plan = getPlan(planId as BeaconPlanId)!;

    // 1. Auth check — the pricing table is public, checkout is not.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const hasStripe = Boolean(stripeKey && !stripeKey.includes('placeholder'));
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabase = Boolean(supabaseUrl && !supabaseUrl.includes('placeholder'));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const unitAmount = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

    if (!hasStripe || !hasSupabase || !user) {
      // Simulated checkout for local/dev/demo mode.
      return NextResponse.json({
        simulated: true,
        url: null,
        planId: plan.id,
        tier: PLAN_TO_TIER[plan.id],
        billingCycle,
        amountCharged: unitAmount,
        message: !user
          ? 'Sign in required — connect Supabase auth to complete checkout.'
          : 'Stripe is not configured. Connect STRIPE_SECRET_KEY to enable real checkout.',
      });
    }

    // 2. Resolve the user's project for subscription metadata.
    const { data: project } = await supabase
      .from('projects')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    // 3. Resolve the Stripe Price ID from env (annual = 20% off catalog price).
    // Prefer an annual-specific price when present, else fall back to monthly.
    const priceId =
      plan.id === 'basic'
        ? (billingCycle === 'annual' && process.env.NEXT_PUBLIC_STRIPE_ANNUAL_BASIC_PRICE_ID) ||
          process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
        : plan.id === 'starter'
          ? (billingCycle === 'annual' && process.env.NEXT_PUBLIC_STRIPE_ANNUAL_STARTER_PRICE_ID) ||
            process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID
          : (billingCycle === 'annual' && process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRO_PRICE_ID) ||
            process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe price ID for the ${plan.name} plan (${billingCycle}) is not configured. Set NEXT_PUBLIC_STRIPE_${plan.id.toUpperCase()}_PRICE_ID.`,
        },
        { status: 500 }
      );
    }

    return createCheckoutSession(priceId, {
      plan,
      billingCycle,
      user,
      project,
      appUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    console.error('Checkout session creation failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function createCheckoutSession(
  priceId: string,
  ctx: {
    plan: PricingTier;
    billingCycle: 'monthly' | 'annual';
    user: { id: string; email?: string };
    project: { id: string; stripe_customer_id: string | null } | null;
    appUrl: string;
  }
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    ...(ctx.project?.stripe_customer_id
      ? { customer: ctx.project.stripe_customer_id }
      : { customer_email: ctx.user.email }),
    client_reference_id: ctx.user.id,
    subscription_data: {
      metadata: {
        projectId: ctx.project?.id ?? '',
        targetTier: PLAN_TO_TIER[ctx.plan.id],
        planId: ctx.plan.id,
        billingCycle: ctx.billingCycle,
      },
    },
    success_url: `${ctx.appUrl}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
    cancel_url: `${ctx.appUrl}/settings?canceled=true`,
  });

  return NextResponse.json({ url: session.url, simulated: false });
}
