import { NextResponse, type NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured.');
    return NextResponse.json(
      { error: 'Webhook secret is not configured' },
      { status: 500 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Stripe webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({ received: true, simulated: true });
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const projectId = session.metadata?.projectId;
      const targetTier = (session.metadata?.targetTier as 'growth' | 'enterprise') || 'growth';
      const auditLimit = targetTier === 'enterprise' ? 500 : 100;

      if (projectId) {
        await supabase
          .from('projects')
          .update({
            tier: targetTier,
            audit_limit: auditLimit,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

      // Revert project to starter tier
      await supabase
        .from('projects')
        .update({
          tier: 'starter',
          audit_limit: 20,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

      if (subscription.status === 'active') {
        console.log(`Subscription active for customer ${customerId}`);
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
