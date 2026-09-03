import { cookies } from 'next/headers';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import type { BillingTier, Database } from '@/types/database.types';

export interface TierAccessResult {
  allowed: boolean;
  tier: BillingTier;
  requiresUpgrade: boolean;
  message?: string;
}

/**
 * Check whether a project's subscription tier has access to Google AI Mode & AI Overviews.
 * Google AI Mode & AI Overviews are locked to Tier-2 ('pro' or 'growth') and 'enterprise'.
 * Starter tier is blocked.
 */
export async function checkTierAccess(projectId?: string): Promise<TierAccessResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let currentTier: BillingTier = 'starter';

  // 1. Attempt admin/service lookup if projectId is provided and Supabase credentials exist
  if (projectId && supabaseUrl && serviceKey && !supabaseUrl.includes('placeholder')) {
    try {
      const adminClient = createSupabaseAdminClient<Database>(supabaseUrl, serviceKey);
      const { data, error } = await adminClient
        .from('projects')
        .select('tier')
        .eq('id', projectId)
        .single();

      if (!error && data?.tier) {
        currentTier = data.tier as BillingTier;
      }
    } catch (err) {
      console.warn('Failed to query project tier via admin client, falling back:', err);
    }
  }

  // 2. Attempt cookies-based lookup (for server components/actions and local demo mode)
  try {
    const cookieStore = await cookies();
    const activeProjectCookie = cookieStore.get('beacon_active_project');
    if (activeProjectCookie?.value) {
      const parsed = JSON.parse(activeProjectCookie.value);
      if (parsed.tier && (!projectId || parsed.id === projectId)) {
        currentTier = parsed.tier as BillingTier;
      }
    }
  } catch {
    // cookies() might not be available in standard cron background context if not request-bound
  }

  const isEligible = isTierEligibleForGoogleAi(currentTier);

  return {
    allowed: isEligible,
    tier: currentTier,
    requiresUpgrade: !isEligible,
    message: isEligible
      ? 'Feature enabled for your subscription tier.'
      : 'Pro Feature - Upgrade to Unlock Google AI Tracking',
  };
}

import { isTierEligibleForGoogleAi } from './tier-utils';
export { isTierEligibleForGoogleAi };

