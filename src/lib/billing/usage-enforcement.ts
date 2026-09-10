import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';
import {
  getPlan,
  checkPromptQuota,
  checkAnswersQuota,
  checkBrandQuota,
  checkSeatQuota,
  type BeaconPlanId,
} from './plan-limits';

/**
 * The generated `Database` types are refreshed from a live database and do
 * not yet include `plan_usage_counters` (added by the plan-architecture
 * migration). Until types are regenerated, query that one table through a
 * locally-typed client so quotas still compile and run.
 */
type CountersDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Database['public']['Tables'] & {
      plan_usage_counters: {
        Row: {
          id: string;
          project_id: string;
          period_start: string;
          prompts_used: number;
          answers_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          period_start?: string;
          prompts_used?: number;
          answers_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          period_start?: string;
          prompts_used?: number;
          answers_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
  };
};

/** Untyped-ish client restricted to the counters table's row shape. */
function createCountersClient() {
  return createServiceClient() as unknown as import('@supabase/supabase-js').SupabaseClient<CountersDatabase>;
}

/**
 * SERVER-ONLY USAGE ENFORCEMENT MIDDLEWARE
 * ----------------------------------------
 * Hard-cap gateway for all metered Beacon resources. Every quota-bound
 * server action or API route MUST call one of the `enforce*` helpers before
 * performing work or writing rows. The client-side UI is advisory only —
 * these checks are the source of truth.
 *
 * Pattern for callers:
 *   const verdict = await enforcePromptQuota(projectId);
 *   if (!verdict.allowed) {
 *     return NextResponse.json({ error: verdict.reason, code: verdict.code }, { status: 402 });
 *   }
 */

export type EnforcementVerdict =
  | { allowed: true; planId: BeaconPlanId; remaining: number }
  | {
      allowed: false;
      planId: BeaconPlanId;
      used: number;
      limit: number;
      reason: string;
      /** Machine-readable code for client UX (upgrade modals, meter bars). */
      code: 'quota_exceeded' | 'plan_not_found';
      quota: 'custom_prompts' | 'answers_analyzed' | 'brands' | 'seats';
    };

/** Row shape of the usage counters table (see supabase/migrations/…usage_counters). */
interface UsageCounterRow {
  period_start: string;
  prompts_used: number;
  answers_used: number;
}

function toBeaconPlanId(tier: string | null | undefined): BeaconPlanId | null {
  if (!tier) return null;
  const normalized = tier.toLowerCase().trim();
  if (normalized === 'basic') return 'basic';
  if (normalized === 'starter' || normalized === 'growth') return 'starter';
  if (normalized === 'pro' || normalized === 'enterprise') return 'pro';
  return null;
}

function currentPeriodStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Resolve the plan for a project, falling back to the `beacon_active_project`
 * demo cookie when Supabase is not configured (local dev / preview mode).
 */
async function resolvePlanId(projectId?: string): Promise<BeaconPlanId> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey && !supabaseUrl.includes('placeholder')) {
    try {
      const admin = createServiceClient();
      let query = admin.from('projects').select('id, tier').limit(1);
      if (projectId) {
        query = query.eq('id', projectId).limit(1);
      }
      const { data } = await query.maybeSingle();
      const planId = toBeaconPlanId(data?.tier);
      if (planId) return planId;
    } catch (err) {
      console.warn('usage-enforcement: project lookup failed, using fallback:', err);
    }
  }

  // Demo-mode fallback: tier stored in the active-project cookie.
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('beacon_active_project')?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      const planId = toBeaconPlanId(parsed?.tier);
      if (planId) return planId;
    }
  } catch {
    // cookies() unavailable in background contexts — ignore
  }

  // No free tier exists: default unknown workspaces to the entry plan.
  return 'basic';
}

/**
 * Read (or lazily materialize) the monthly usage counters for a project.
 * Uses the service-role client so it works even when RLS would block the
 * user-scoped anon client.
 */
async function readUsageCounters(projectId: string): Promise<UsageCounterRow> {
  const periodStart = currentPeriodStart();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const emptyRow: UsageCounterRow = {
    period_start: periodStart,
    prompts_used: 0,
    answers_used: 0,
  };

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('placeholder')) {
    // Demo mode: usage mirrored from the active-project cookie if present.
    try {
      const cookieStore = await cookies();
      const raw = cookieStore.get('beacon_usage_counters')?.value;
      if (raw) {
        const parsed = JSON.parse(raw) as UsageCounterRow;
        if (parsed.period_start === periodStart) return parsed;
      }
    } catch {
      // ignore
    }
    return emptyRow;
  }

  const admin = createCountersClient();

  try {
    const { data } = await admin
      .from('plan_usage_counters')
      .select('period_start, prompts_used, answers_used')
      .eq('project_id', projectId)
      .maybeSingle();

    if (data && data.period_start === periodStart) {
      return data as UsageCounterRow;
    }
  } catch {
    // Counters table not migrated yet — fall through to row-count heuristic.
  }

  // New billing period (or counters table missing): derive usage from the
  // actual rows created this month so caps hold even pre-migration.
  try {
    const monthStartIso = periodStart;
    const typedAdmin = createServiceClient();
    // `results` links to projects through `prompts`; embedded-filter queries
    // need generated relationship types, so use a minimal structural type.
    type HeadCountPromise = Promise<{ count: number | null; error: unknown }>;
    const resultsAdmin = createServiceClient() as unknown as {
      from: (
        table: 'results'
      ) => {
        select: (
          columns: string,
          options: { count: 'exact'; head: true }
        ) => {
          eq: (column: 'prompts.project_id', value: string) => {
            gte: (column: 'created_at', value: string) => HeadCountPromise;
          };
        };
      };
    };
    const promptsQuery = typedAdmin
      .from('prompts')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', monthStartIso);
    const answersQuery = resultsAdmin
      .from('results')
      .select('id, prompts!inner(project_id)', { count: 'exact', head: true })
      .eq('prompts.project_id', projectId)
      .gte('created_at', monthStartIso);
    const [{ count: promptsCount }, { count: answersCount }] = await Promise.all([
      promptsQuery,
      answersQuery,
    ]);
    return {
      period_start: periodStart,
      prompts_used: typeof promptsCount === 'number' ? promptsCount : 0,
      answers_used: typeof answersCount === 'number' ? answersCount : 0,
    };
  } catch (err) {
    console.warn('usage-enforcement: usage fallback counting failed:', err);
    return emptyRow;
  }
}

/** Re-exported so callers don't import internals from two modules. */
export { checkPromptQuota, checkAnswersQuota, checkBrandQuota, checkSeatQuota };
export type { BeaconPlanId };

/** HARD CAP: tracked custom prompts (e.g. Basic = 100/mo). Call before prompt inserts. */
export async function enforcePromptQuota(projectId?: string): Promise<EnforcementVerdict> {
  const planId = await resolvePlanId(projectId);
  const plan = getPlan(planId)!;
  if (!projectId) {
    return { allowed: true, planId, remaining: plan.limits.customPrompts };
  }
  const usage = await readUsageCounters(projectId);
  const check = checkPromptQuota(planId, usage.prompts_used);
  if (check.allowed) {
    return { allowed: true, planId, remaining: check.remaining };
  }
  return { allowed: false, planId, used: check.used, limit: check.limit, reason: check.reason, code: 'quota_exceeded', quota: 'custom_prompts' };
}

/** HARD CAP: AI answers analyzed (e.g. Basic = 3,000/mo). Call before analysis writes. */
export async function enforceAnswersQuota(projectId?: string): Promise<EnforcementVerdict> {
  const planId = await resolvePlanId(projectId);
  const plan = getPlan(planId)!;
  if (!projectId) {
    return { allowed: true, planId, remaining: plan.limits.answersAnalyzed };
  }
  const usage = await readUsageCounters(projectId);
  const check = checkAnswersQuota(planId, usage.answers_used);
  if (check.allowed) {
    return { allowed: true, planId, remaining: check.remaining };
  }
  return { allowed: false, planId, used: check.used, limit: check.limit, reason: check.reason, code: 'quota_exceeded', quota: 'answers_analyzed' };
}

/** HARD CAP: brand/project count (Basic = 1, Starter = 5, Pro = unlimited). */
export async function enforceBrandQuota(ownerUserId: string): Promise<EnforcementVerdict> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey && !supabaseUrl.includes('placeholder')) {
    const admin = createServiceClient();

    // Resolve the plan from THIS user's first project (ordered for stability).
    const { data: projects } = await admin
      .from('projects')
      .select('id, tier')
      .eq('user_id', ownerUserId)
      .order('created_at', { ascending: true });

    const planId = toBeaconPlanId(projects?.[0]?.tier) ?? 'basic';
    const plan = getPlan(planId)!;
    if (plan.limits.brands === null) {
      return { allowed: true, planId, remaining: Infinity };
    }

    const used = projects?.length ?? 0;
    const check = checkBrandQuota(planId, used);
    if (check.allowed) {
      return { allowed: true, planId, remaining: check.remaining };
    }
    return { allowed: false, planId, used, limit: plan.limits.brands, reason: check.reason, code: 'quota_exceeded', quota: 'brands' };
  }

  const planId = await resolvePlanId();
  const plan = getPlan(planId)!;
  if (plan.limits.brands === null) {
    return { allowed: true, planId, remaining: Infinity };
  }
  return { allowed: true, planId, remaining: plan.limits.brands };
}

/** HARD CAP: team seats (Basic = 1, Starter = 3, Pro = unlimited). */
export async function enforceSeatQuota(projectId: string): Promise<EnforcementVerdict> {
  const planId = await resolvePlanId(projectId);
  const plan = getPlan(planId)!;
  if (plan.limits.seats === null) {
    return { allowed: true, planId, remaining: Infinity };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey && !supabaseUrl.includes('placeholder')) {
    const admin = createServiceClient();
    const { count } = await admin
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);
    const used = typeof count === 'number' ? count : 1; // owner counts as a seat
    const check = checkSeatQuota(planId, used);
    if (check.allowed) {
      return { allowed: true, planId, remaining: check.remaining === Infinity ? Infinity : check.remaining };
    }
    return { allowed: false, planId, used, limit: plan.limits.seats, reason: check.reason, code: 'quota_exceeded', quota: 'seats' };
  }

  return { allowed: true, planId, remaining: plan.limits.seats };
}

/**
 * Record metered usage after an action completes.
 *
 * Demo mode: mirrors counters into a cookie so local/dev enforcement works.
 * Cloud mode: no-op — the DB triggers in
 * supabase/migrations/*_plan_architecture_usage_caps.sql increment
 * plan_usage_counters on every prompts/results insert, so counting here
 * as well would double every metered action.
 */
export async function recordUsage(
  projectId: string,
  delta: { prompts?: number; answers?: number }
): Promise<void> {
  if (!delta.prompts && !delta.answers) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey && !supabaseUrl.includes('placeholder')) {
    return; // DB triggers own the counters in cloud mode.
  }

  // Demo mode: mirror counters into a cookie.
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('beacon_usage_counters')?.value;
    const periodStart = currentPeriodStart();
    const current: UsageCounterRow = raw
      ? JSON.parse(raw)
      : { period_start: periodStart, prompts_used: 0, answers_used: 0 };
    if (current.period_start !== periodStart) {
      current.period_start = periodStart;
      current.prompts_used = 0;
      current.answers_used = 0;
    }
    current.prompts_used += delta.prompts || 0;
    current.answers_used += delta.answers || 0;
    cookieStore.set('beacon_usage_counters', JSON.stringify(current), {
      path: '/',
      maxAge: 60 * 60 * 24 * 31,
    });
  } catch {
    // cookies() unavailable — enforcement still holds via DB triggers.
  }
}
