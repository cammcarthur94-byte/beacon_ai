'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { stripe, BILLING_PLANS } from '@/lib/stripe';
import type { BrandKit } from '@/types/database.types';

import { compileToneOfVoice, normalizeNegativeKeywords } from '@/lib/brand-kit/taxonomy';

export async function updateProjectSettings(formData: FormData) {
  const brandName = (formData.get('brandName') as string) || '';
  const domain = (formData.get('domain') as string) || '';
  const industry = (formData.get('industry') as string) || '';
  const targetAudience = (formData.get('targetAudience') as string) || '';
  const coreOfferings = (formData.get('coreOfferings') as string) || '';
  const competitorsRaw = (formData.get('competitors') as string) || '[]';
  const targetRegionsRaw = (formData.get('targetRegions') as string) || '[]';
  const negativeKeywordsRaw = (formData.get('negativeKeywords') as string) || '[]';
  const messagingPillarsRaw = (formData.get('messagingPillars') as string) || '[]';
  const toneDimensionsRaw = (formData.get('toneDimensions') as string) || '';
  const toneTagsRaw = (formData.get('toneTags') as string) || '[]';
  const industryTaxonomyRaw = (formData.get('industryTaxonomy') as string) || '';

  const hasBrandKitPayload =
    formData.has('industryTaxonomy') ||
    formData.has('competitors') ||
    formData.has('messagingPillars') ||
    formData.has('toneDimensions') ||
    formData.has('targetRegions');

  let updatedBrandKit: BrandKit | undefined = undefined;

  if (hasBrandKitPayload) {
    let competitors = [];
    try {
      competitors = JSON.parse(competitorsRaw);
    } catch {
      competitors = [];
    }

    let targetRegions: string[] = [];
    try {
      targetRegions = JSON.parse(targetRegionsRaw);
    } catch {
      targetRegions = [];
    }

    let negativeKeywords: any[] = [];
    try {
      const parsed = JSON.parse(negativeKeywordsRaw);
      negativeKeywords = normalizeNegativeKeywords(parsed);
    } catch {
      negativeKeywords = [];
    }

    let messagingPillars: string[] = [];
    try {
      messagingPillars = JSON.parse(messagingPillarsRaw);
    } catch {
      messagingPillars = [];
    }

    let toneDimensions = undefined;
    try {
      if (toneDimensionsRaw) toneDimensions = JSON.parse(toneDimensionsRaw);
    } catch {}

    let toneTags: string[] = [];
    try {
      toneTags = JSON.parse(toneTagsRaw);
    } catch {
      toneTags = [];
    }

    let industryTaxonomy = undefined;
    try {
      if (industryTaxonomyRaw) industryTaxonomy = JSON.parse(industryTaxonomyRaw);
    } catch {}

    let toneOfVoice = (formData.get('toneOfVoice') as string) || '';
    if (toneDimensions) {
      toneOfVoice = compileToneOfVoice(toneDimensions, toneTags);
    }

    updatedBrandKit = {
      industry: industryTaxonomy ? `${industryTaxonomy.sector} > ${industryTaxonomy.category}` : industry,
      industry_taxonomy: industryTaxonomy,
      target_audience: targetAudience,
      core_offerings: coreOfferings,
      competitors,
      target_regions: targetRegions,
      negative_keywords: negativeKeywords,
      messaging_pillars: messagingPillars,
      tone_of_voice: toneOfVoice,
      tone_dimensions: toneDimensions,
      tone_tags: toneTags,
    };
  }

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
          ...(brandName ? { name: brandName } : {}),
          ...(domain ? { domain } : {}),
          ...(hasBrandKitPayload && updatedBrandKit ? { brand_kit: updatedBrandKit } : {}),
        };
        cookieStore.set('beacon_active_project', JSON.stringify(updated), { path: '/' });
      } catch {}
    }
    revalidatePath('/settings');
    revalidatePath('/brand-kit');
    revalidatePath('/dashboard');
    revalidatePath('/audits');
    revalidatePath('/consultant');
    return { success: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const updatePayload: {
    name?: string;
    domain?: string;
    brand_kit?: BrandKit;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (brandName) updatePayload.name = brandName;
  if (domain) updatePayload.domain = domain;
  if (hasBrandKitPayload && updatedBrandKit) updatePayload.brand_kit = updatedBrandKit;

  const { error } = await supabase
    .from('projects')
    .update(updatePayload as any)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  revalidatePath('/brand-kit');
  revalidatePath('/dashboard');
  revalidatePath('/audits');
  revalidatePath('/consultant');
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

export async function updateWorkspaceBrandingAndLocalizationAction(formData: FormData) {
  const cookieStore = await cookies();
  const logoUrl = (formData.get('logoUrl') as string) || '';
  const faviconUrl = (formData.get('faviconUrl') as string) || '';
  const timezone = (formData.get('timezone') as string) || 'America/New_York';
  const language = (formData.get('language') as string) || 'en-US';
  const dateFormat = (formData.get('dateFormat') as string) || 'MM/DD/YYYY';
  const ssoEnabled = formData.get('ssoEnabled') === 'true';

  const existingCookie = cookieStore.get('beacon_active_project')?.value;
  if (existingCookie) {
    try {
      const parsed = JSON.parse(existingCookie);
      parsed.workspace_settings = {
        ...(parsed.workspace_settings || {}),
        logoUrl,
        faviconUrl,
        timezone,
        language,
        dateFormat,
        ssoEnabled,
      };
      cookieStore.set('beacon_active_project', JSON.stringify(parsed), { path: '/' });
    } catch {}
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function deleteWorkspaceAction(domainConfirmation: string) {
  const cookieStore = await cookies();
  const existingCookie = cookieStore.get('beacon_active_project')?.value;
  if (existingCookie) {
    try {
      const parsed = JSON.parse(existingCookie);
      if (parsed.domain && parsed.domain.toLowerCase().trim() !== domainConfirmation.toLowerCase().trim()) {
        return { error: `Domain confirmation does not match '${parsed.domain}'` };
      }
    } catch {}
  }

  cookieStore.delete('beacon_active_project');
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { success: true };
}
