'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { stripe, BILLING_PLANS } from '@/lib/stripe';
import type { BrandKit } from '@/types/database.types';

export async function updateProjectSettings(formData: FormData) {
  const brandName = (formData.get('brandName') as string) || '';
  const domain = (formData.get('domain') as string) || '';
  const industry = (formData.get('industry') as string) || '';
  const targetAudience = (formData.get('targetAudience') as string) || '';
  const coreOfferings = (formData.get('coreOfferings') as string) || '';
  const toneOfVoice = (formData.get('toneOfVoice') as string) || '';
  const competitorsRaw = (formData.get('competitors') as string) || '[]';

  let competitors = [];
  try {
    competitors = JSON.parse(competitorsRaw);
  } catch {
    competitors = [];
  }

  const updatedBrandKit: BrandKit = {
    industry,
    target_audience: targetAudience,
    core_offerings: coreOfferings,
    competitors,
    tone_of_voice: toneOfVoice,
  };

  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Fallback for local development
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const existing = cookieStore.get('beacon_active_project')?.value;
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        const updated = {
          ...parsed,
          name: brandName,
          domain,
          brand_kit: updatedBrandKit,
        };
        cookieStore.set('beacon_active_project', JSON.stringify(updated), { path: '/' });
      } catch {}
    }
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { error } = await supabase
    .from('projects')
    .update({
      name: brandName,
      domain,
      brand_kit: updatedBrandKit,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/audits');
  return { success: true };
}

export async function createCheckoutSessionAction(targetTier: 'growth' | 'enterprise') {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const plan = BILLING_PLANS.find((p) => p.id === targetTier);
  if (!plan) return { error: 'Invalid plan selected' };

  // Fallback simulation for local dev
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    const existing = cookieStore.get('beacon_active_project')?.value;
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        parsed.tier = targetTier;
        parsed.audit_limit = targetTier === 'enterprise' ? 500 : 100;
        cookieStore.set('beacon_active_project', JSON.stringify(parsed), { path: '/' });
      } catch {}
    }
    redirect(`/settings?upgraded=${targetTier}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { data: project } = await supabase
    .from('projects')
    .select('id, stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (!project) return { error: 'Project not found' };

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripePriceId || 'price_test',
          quantity: 1,
        },
      ],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        projectId: project.id,
        targetTier,
      },
      success_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${appUrl}/settings?canceled=true`,
    });

    if (session.url) {
      redirect(session.url);
    }
  } catch (err: any) {
    if (err?.message?.includes('NEXT_REDIRECT')) throw err;
    return { error: err.message || 'Failed to initialize Stripe checkout session' };
  }
}

export async function createPortalSessionAction() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    redirect('/settings?portal=simulated');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { data: project } = await supabase
    .from('projects')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (!project?.stripe_customer_id) {
    return { error: 'No active Stripe billing customer found. Please subscribe to a tier first.' };
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: project.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    });

    if (portalSession.url) {
      redirect(portalSession.url);
    }
  } catch (err: any) {
    if (err?.message?.includes('NEXT_REDIRECT')) throw err;
    return { error: err.message || 'Failed to create customer billing portal' };
  }
}
