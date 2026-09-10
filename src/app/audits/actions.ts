'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { BEACON_MODELS } from '@/lib/ai/models';
import { executeMultiEngineAudit } from '@/lib/ai/engine-runner';
import type { AuditFrequency, BrandKit, SearchIntent, BrandAssociation } from '@/types/database.types';
import { extractDomain, categorizeSource } from '@/lib/citations/categorizer';
import { checkTierAccess, isTierEligibleForGoogleAi } from '@/lib/billing/tier-access';
import { getTierAuditLimit, normalizeTier } from '@/lib/billing/tier-utils';
import { enforcePromptQuota, enforceAnswersQuota } from '@/lib/billing/usage-enforcement';
import { getDemoPrompts, generateContextualAuditRuns } from '@/lib/demo-prompts';
import { parseActiveProjectCookie } from '@/lib/project-utils';

function getActiveProjectFromCookie(cookieStore: any) {
  const projectCookie = cookieStore.get('beacon_active_project')?.value;
  if (projectCookie) {
    const project = parseActiveProjectCookie(projectCookie);
    if (!project) {
      cookieStore.delete('beacon_active_project');
    }
    return project;
  }
  return null;
}

const createPromptSchema = z.object({
  queryText: z.string().min(4, 'Audit phrase must be at least 4 characters long.'),
  frequency: z.enum(['daily', 'weekly', 'biweekly']),
  targetEngines: z.array(z.string()).min(1, 'Select at least one target search engine.'),
  searchIntent: z.enum(['informational', 'navigational', 'commercial', 'transactional']).default('informational'),
  brandAssociation: z.enum(['branded', 'unbranded']).default('unbranded'),
});

export async function createPromptAudit(formData: FormData) {
  const queryText = (formData.get('queryText') as string) || '';
  const frequency = (formData.get('frequency') as AuditFrequency) || 'daily';
  const enginesRaw = formData.getAll('targetEngines') as string[];
  const targetEngines = enginesRaw.length > 0 ? enginesRaw : ['chatgpt', 'gemini', 'claude', 'perplexity'];
  const searchIntent = (formData.get('searchIntent') as SearchIntent) || 'informational';
  const brandAssociation = (formData.get('brandAssociation') as BrandAssociation) || 'unbranded';

  const validation = createPromptSchema.safeParse({
    queryText,
    frequency,
    targetEngines,
    searchIntent,
    brandAssociation,
  });

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors.queryText?.[0] || 'Invalid inputs' };
  }

  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let projectId = '';
  let brandName = 'Brand';
  let domain = 'brand.com';
  let projectTier = 'starter';
  let auditLimit = 20;
  let brandKit: BrandKit = {
    industry: 'Technology',
    target_audience: 'B2B Buyers',
    core_offerings: 'SaaS Platform',
    competitors: [],
    tone_of_voice: 'Direct',
  };

  // Get active project
  const projectCookie = cookieStore.get('beacon_active_project');
  if (projectCookie?.value) {
    try {
      const parsed = JSON.parse(projectCookie.value);
      projectId = parsed.id;
      brandName = parsed.name || brandName;
      domain = parsed.domain || domain;
      brandKit = parsed.brand_kit || brandKit;
      if (parsed.tier) projectTier = parsed.tier;
      auditLimit = parsed.audit_limit || getTierAuditLimit(projectTier);
    } catch {
      // ignore
    }
  } else {
    auditLimit = getTierAuditLimit(projectTier);
  }

  // Tier-2 Access Control: Check permissions for Google AI engines
  const containsGoogleAi = targetEngines.some(
    (e) => e === 'google_ai_overview' || e === 'google_ai_mode'
  );

  let finalTargetEngines = [...targetEngines];
  if (containsGoogleAi) {
    const tierAccess = await checkTierAccess(projectId);
    if (!tierAccess.allowed) {
      finalTargetEngines = finalTargetEngines.filter(
        (e) => e !== 'google_ai_overview' && e !== 'google_ai_mode'
      );
      if (finalTargetEngines.length === 0) {
        return {
          error: 'Tracking Google AI Mode & AI Overviews requires the Pro Tier. Please upgrade in Billing settings.',
        };
      }
    }
  }

  // ── STRICT PLAN HARD-CAP (plan architecture: Basic 100 / Starter 450 / Pro 1,050) ──
  // Resolves the workspace plan and this month's usage counters. The DB
  // triggers in supabase/migrations/*_plan_architecture_usage_caps.sql are the
  // authoritative backstop; this check gives a clean 402-style verdict first.
  const promptQuota = await enforcePromptQuota(projectId || undefined);
  if (!promptQuota.allowed) {
    return {
      error: promptQuota.reason,
      code: promptQuota.code,
      quota: promptQuota.quota,
      used: promptQuota.used,
      limit: promptQuota.limit,
    };
  }

  // Fallback for local development if cloud credentials aren't set
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const project = getActiveProjectFromCookie(cookieStore);
    const promptsList = [...getDemoPrompts(cookieStore, project)];

    if (promptsList.length >= auditLimit) {
      return {
        error: `Audit quota reached (${promptsList.length}/${auditLimit} active prompts on ${projectTier.toUpperCase()} tier). Upgrade your plan in Settings & Billing to track more queries.`,
      };
    }

    const newPrompt = {
      id: 'prompt-' + Date.now(),
      project_id: projectId || 'demo-project',
      query_text: queryText,
      frequency,
      target_engines: finalTargetEngines,
      search_intent: searchIntent,
      brand_association: brandAssociation,
      is_active: true,
      last_run_at: null,
      next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      created_at: new Date().toISOString(),
      latest_score: null,
    };

    promptsList.unshift(newPrompt);
    cookieStore.set('beacon_demo_prompts', JSON.stringify(promptsList), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath('/audits');
    revalidatePath('/dashboard');
    return { success: true };
  }

  // Supabase Cloud Insert
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required.' };
  }

  // Ensure we have a valid project ID
  if (!projectId) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, domain, brand_kit, tier, audit_limit')
      .eq('user_id', user.id)
      .limit(1);

    if (!projects || projects.length === 0) {
      return { error: 'No active project found. Complete onboarding first.' };
    }
    projectId = projects[0].id;
    brandName = projects[0].name;
    domain = projects[0].domain;
    brandKit = projects[0].brand_kit;
    if (projects[0].tier) projectTier = projects[0].tier;
    auditLimit = projects[0].audit_limit || getTierAuditLimit(projectTier);
  }

  // Check audit quota in database
  const { count: existingDbCount } = await supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (typeof existingDbCount === 'number' && existingDbCount >= auditLimit) {
    return {
      error: `Audit quota reached (${existingDbCount}/${auditLimit} active prompts on ${projectTier.toUpperCase()} tier). Upgrade your plan in Settings & Billing to track more queries.`,
    };
  }

  // Insert prompt record
  const { data: insertedPrompt, error: insertError } = await supabase
    .from('prompts')
    .insert({
      project_id: projectId,
      query_text: queryText,
      frequency,
      target_engines: finalTargetEngines,
      search_intent: searchIntent,
      brand_association: brandAssociation,
      is_active: true,
      next_run_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !insertedPrompt) {
    return { error: `Failed to create prompt tracker: ${insertError?.message}` };
  }

  // Trigger immediate initial audit evaluation
  try {
    const evaluations = await executeMultiEngineAudit({
      queryText,
      brandName,
      domain,
      competitors: brandKit.competitors || [],
      targetEngines: finalTargetEngines,
    });

    for (const ev of evaluations) {
      const { data: insertedRes } = await supabase.from('results').insert({
        prompt_id: insertedPrompt.id,
        engine: ev.engine,
        visibility_score: ev.visibilityScore,
        brand_mentioned: ev.brandMentioned,
        sentiment: ev.sentiment,
        sentiment_score: ev.sentimentScore,
        raw_text: ev.rawText,
        cited_urls: ev.citedUrls,
        ranking_position: ev.rankingPosition,
      }).select('id').single();

      if (ev.citedUrls && ev.citedUrls.length > 0) {
        const citationRows = ev.citedUrls.map((rawUrl) => {
          const domain = extractDomain(rawUrl);
          return {
            project_id: projectId,
            run_id: insertedRes?.id || null,
            engine: ev.engine,
            url: rawUrl,
            domain: domain || 'unknown.com',
            source_type: categorizeSource(domain, rawUrl),
          };
        });
        await supabase.from('citations').insert(citationRows);
      }
    }

    const now = new Date();
    const nextRun = new Date(now);
    if (frequency === 'daily') nextRun.setDate(now.getDate() + 1);
    else if (frequency === 'biweekly') nextRun.setDate(now.getDate() + 14);
    else nextRun.setDate(now.getDate() + 7);

    await supabase
      .from('prompts')
      .update({
        last_run_at: now.toISOString(),
        next_run_at: nextRun.toISOString(),
      })
      .eq('id', insertedPrompt.id);
  } catch (err) {
    console.error('Initial audit run completed with warning:', err);
  }

  revalidatePath('/audits');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function togglePromptStatus(promptId: string, isCurrentlyActive: boolean) {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      const project = getActiveProjectFromCookie(cookieStore);
      const list = getDemoPrompts(cookieStore, project);
      const updated = list.map((p: any) =>
        p.id === promptId ? { ...p, is_active: !isCurrentlyActive } : p
      );
      cookieStore.set('beacon_demo_prompts', JSON.stringify(updated), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      revalidatePath('/audits');
      revalidatePath(`/audits/${promptId}`);
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('prompts')
      .update({ is_active: !isCurrentlyActive })
      .eq('id', promptId);

    if (error) return { error: error.message };

    revalidatePath('/audits');
    return { success: true };
  } catch (err: any) {
    console.error('Error toggling prompt status:', err);
    return { error: err?.message || 'Failed to toggle prompt status.' };
  }
}

export async function togglePromptEngine(promptId: string, engineId: string) {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Local demo fallback
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      const project = getActiveProjectFromCookie(cookieStore);
      const list = getDemoPrompts(cookieStore, project);
      const updated = list.map((p: any) => {
        if (p.id !== promptId) return p;

        const currentActive: string[] = Array.isArray(p.target_engines) ? [...p.target_engines] : [];
        const currentDisabled: string[] = Array.isArray(p.disabled_engines) ? [...p.disabled_engines] : [];

        let newActive: string[];
        let newDisabled: string[];

        if (currentActive.includes(engineId)) {
          newActive = currentActive.filter((e) => e !== engineId);
          newDisabled = Array.from(new Set([...currentDisabled, engineId]));
        } else {
          newActive = Array.from(new Set([...currentActive, engineId]));
          newDisabled = currentDisabled.filter((e) => e !== engineId);
        }

        const newIsActive = newActive.length === 0 ? false : p.is_active;

        return {
          ...p,
          target_engines: newActive,
          disabled_engines: newDisabled,
          is_active: newIsActive,
        };
      });

      cookieStore.set('beacon_demo_prompts', JSON.stringify(updated), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      revalidatePath('/audits');
      revalidatePath(`/audits/${promptId}`);
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createClient();
    // Supabase Cloud path
    const { data: prompt, error: fetchErr } = await supabase
      .from('prompts')
      .select('target_engines, is_active')
      .eq('id', promptId)
      .single();

    if (fetchErr || !prompt) {
      return { error: fetchErr?.message || 'Prompt not found' };
    }

    const currentActive: string[] = Array.isArray(prompt.target_engines) ? [...prompt.target_engines] : [];
    let newActive: string[];

    if (currentActive.includes(engineId)) {
      newActive = currentActive.filter((e) => e !== engineId);
    } else {
      newActive = Array.from(new Set([...currentActive, engineId]));
    }

    const newIsActive = newActive.length === 0 ? false : prompt.is_active;

    const { error: updateErr } = await supabase
      .from('prompts')
      .update({
        target_engines: newActive,
        is_active: newIsActive,
      })
      .eq('id', promptId);

    if (updateErr) return { error: updateErr.message };

    revalidatePath('/audits');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('Error toggling prompt engine:', err);
    return { error: err?.message || 'Failed to toggle prompt engine.' };
  }
}

export async function deletePromptAudit(promptId: string) {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      const project = getActiveProjectFromCookie(cookieStore);
      const list = getDemoPrompts(cookieStore, project);
      const updated = list.filter((p: any) => p.id !== promptId);
      cookieStore.set('beacon_demo_prompts', JSON.stringify(updated), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      revalidatePath('/audits');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('prompts').delete().eq('id', promptId);
    if (error) return { error: error.message };

    revalidatePath('/audits');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting prompt audit:', err);
    return { error: err?.message || 'Failed to delete prompt audit tracker.' };
  }
}

export async function triggerInstantRun(promptId: string) {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      const project = getActiveProjectFromCookie(cookieStore);
      const list = getDemoPrompts(cookieStore, project);
      const targetPrompt = list.find((p: any) => p.id === promptId);

      let runs: any[] = [];
      let finalScore = 85;

      if (targetPrompt) {
        const rawEngines = (targetPrompt.target_engines || ['gemini', 'claude']) as string[];
        const enginesToRun = rawEngines.filter((e) => e === 'gemini' || e === 'claude');
        const finalEngines = enginesToRun.length > 0 ? enginesToRun : ['gemini', 'claude'];

        try {
          const evaluations = await executeMultiEngineAudit({
            queryText: targetPrompt.query_text,
            brandName: project?.name || 'My Brand',
            domain: project?.domain || 'brand.com',
            competitors: project?.brand_kit?.competitors || [],
            targetEngines: finalEngines,
          });

          runs = evaluations.map((ev, idx) => ({
            id: `run-${Date.now()}-${idx}`,
            engine: ev.engine,
            visibilityScore: ev.visibilityScore,
            brandMentioned: ev.brandMentioned,
            rankingPosition: ev.rankingPosition,
            sentiment: ev.sentiment,
            sentimentScore: ev.sentimentScore,
            rawText: ev.rawText,
            citedUrls: ev.citedUrls || [],
            createdAt: new Date().toISOString(),
          }));

          if (evaluations.length > 0) {
            finalScore = Math.round(
              evaluations.reduce((acc, e) => acc + e.visibilityScore, 0) / evaluations.length
            );
          }
        } catch (auditErr) {
          console.error('Error executing demo multi-engine audit:', auditErr);
        }

        if (runs.length === 0) {
          runs = generateContextualAuditRuns(targetPrompt, project);
          if (runs.length > 0) {
            finalScore = Math.round(
              runs.reduce((acc, e) => acc + e.visibilityScore, 0) / runs.length
            );
          }
        }
      }

      const updated = list.map((p: any) =>
        p.id === promptId
          ? {
              ...p,
              last_run_at: new Date().toISOString(),
              latest_score: runs.length > 0 ? finalScore : (p.latest_score || 85),
              runs: runs.length > 0 ? runs : (p.runs?.length ? p.runs : generateContextualAuditRuns(p, project)),
            }
          : p
      );
      cookieStore.set('beacon_demo_prompts', JSON.stringify(updated), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      revalidatePath('/audits');
      revalidatePath(`/audits/${promptId}`);
      revalidatePath('/dashboard');
      return { success: true, message: 'Instant audit completed successfully.' };
    }

    const supabase = await createClient();
    // Fetch prompt details
    const { data: prompt } = await supabase
      .from('prompts')
      .select(`
        id,
        query_text,
        target_engines,
        projects (
          id,
          name,
          domain,
          tier,
          brand_kit
        )
      `)
      .eq('id', promptId)
      .single();

    if (!prompt || !prompt.projects) {
      return { error: 'Prompt not found' };
    }

    const project: any = prompt.projects;
    const hasGoogleAiAccess = isTierEligibleForGoogleAi(project.tier);
    let enginesToRun = (prompt.target_engines || ['chatgpt', 'gemini', 'claude', 'perplexity']) as string[];

    if (!hasGoogleAiAccess) {
      enginesToRun = enginesToRun.filter(
        (e) => e !== 'google_ai_overview' && e !== 'google_ai_mode'
      );
      if (enginesToRun.length === 0) {
        enginesToRun = ['chatgpt', 'gemini', 'claude', 'perplexity'];
      }
    }

    // ── STRICT PLAN HARD-CAP: answers analyzed (Basic 3,000 / Starter 13,500 / Pro 31,500) ──
    const answerQuota = await enforceAnswersQuota(project.id);
    if (!answerQuota.allowed) {
      return {
        error: answerQuota.reason,
        code: answerQuota.code,
        quota: answerQuota.quota,
        used: answerQuota.used,
        limit: answerQuota.limit,
      };
    }

    const evaluations = await executeMultiEngineAudit({
      queryText: prompt.query_text,
      brandName: project.name,
      domain: project.domain,
      competitors: project.brand_kit?.competitors || [],
      targetEngines: enginesToRun,
    });

    for (const ev of evaluations) {
      const { data: insertedRes } = await supabase.from('results').insert({
        prompt_id: prompt.id,
        engine: ev.engine,
        visibility_score: ev.visibilityScore,
        brand_mentioned: ev.brandMentioned,
        sentiment: ev.sentiment,
        sentiment_score: ev.sentimentScore,
        raw_text: ev.rawText,
        cited_urls: ev.citedUrls,
        ranking_position: ev.rankingPosition,
      }).select('id').single();

      if (ev.citedUrls && ev.citedUrls.length > 0) {
        const citationRows = ev.citedUrls.map((rawUrl) => {
          const domain = extractDomain(rawUrl);
          return {
            project_id: project.id,
            run_id: insertedRes?.id || null,
            engine: ev.engine,
            url: rawUrl,
            domain: domain || 'unknown.com',
            source_type: categorizeSource(domain, rawUrl),
          };
        });
        await supabase.from('citations').insert(citationRows);
      }
    }

    await supabase
      .from('prompts')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', prompt.id);

    revalidatePath('/audits');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('Error triggering instant run:', err);
    return { error: err?.message || 'Failed to trigger instant audit run.' };
  }
}

export interface GeneratedPromptSuggestion {
  id: string;
  query_text: string;
  category: string;
  search_intent: SearchIntent;
  brand_association: BrandAssociation;
  recommended_frequency: AuditFrequency;
  rationale: string;
}

const TIER_PROMPT_LIMITS: Record<string, number> = {
  starter: 20,
  growth: 100,
  pro: 100,
  enterprise: 500,
};

export async function generateAiPrompts(params: {
  category?: string;
  categories?: string[];
  searchIntent?: SearchIntent | 'all';
  brandAssociation?: BrandAssociation | 'both';
  count?: number;
}): Promise<{ prompts: GeneratedPromptSuggestion[]; error?: string }> {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let projectId = '';
  let brandName = 'My Brand';
  let domain = 'example.com';
  let projectTier = 'starter';
  let auditLimit = 20;
  let brandKit: BrandKit = {
    industry: 'Technology & Services',
    target_audience: 'Modern enterprise teams and decision makers',
    core_offerings: 'Software, products, and services',
    competitors: [],
    tone_of_voice: 'Professional, Authoritative, and Direct',
  };

  const projectCookie = cookieStore.get('beacon_active_project');
  if (projectCookie?.value) {
    try {
      const parsed = JSON.parse(projectCookie.value);
      projectId = parsed.id || '';
      brandName = parsed.name || brandName;
      domain = parsed.domain || domain;
      if (parsed.brand_kit) brandKit = parsed.brand_kit;
      if (parsed.tier) projectTier = parsed.tier;
      auditLimit = parsed.audit_limit || getTierAuditLimit(projectTier);
    } catch {
      // ignore
    }
  }

  // Determine existing prompt count to respect tier limits
  let existingPromptCount = 0;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const demoPromptsRaw = cookieStore.get('beacon_demo_prompts')?.value;
    if (demoPromptsRaw) {
      try {
        const list = JSON.parse(demoPromptsRaw);
        if (Array.isArray(list)) existingPromptCount = list.length;
      } catch {
        // ignore
      }
    }
  } else if (projectId) {
    try {
      const { count: dbCount } = await supabase
        .from('prompts')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);
      if (typeof dbCount === 'number') existingPromptCount = dbCount;
    } catch {
      // ignore
    }
  }

  const remainingSlots = Math.max(0, auditLimit - existingPromptCount);
  if (remainingSlots <= 0) {
    return {
      prompts: [],
      error: `Prompt tracking limit reached (${existingPromptCount}/${auditLimit} active prompts on ${projectTier.toUpperCase()} tier). Upgrade your plan in Settings & Billing to create more prompts.`,
    };
  }

  // Requested prompt count clamped by available capacity
  const requestedCount = params.count && params.count > 0 ? params.count : 5;
  const count = Math.min(requestedCount, remainingSlots);

  // Support both single category and multi-category arrays
  const rawCategories =
    params.categories && params.categories.length > 0
      ? params.categories
      : [params.category || 'comparisons'];
  const categories = rawCategories.filter(Boolean);
  if (categories.length === 0) categories.push('comparisons');
  const categoryLabel = categories.join(', ');
  const schemaCategory = categories.length > 1 ? categories.join('" | "') : categories[0];
  const intent = params.searchIntent || 'all';
  const association = params.brandAssociation || 'both';

  // 1. Primary AI Prompt Generation (Gemini 3.8 Flash with Preview fallback)
  const hasGoogleKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY);

  if (hasGoogleKey) {
    const candidates = ['gemini-3.8-flash', 'gemini-3-flash-preview'];
    for (const candidate of candidates) {
      try {
        const model = google(candidate);
        const systemPrompt = `You are Beacon's Generative Engine Optimization (GEO) strategist.
Generate ${count} high-impact, realistic search query prompts that prospective buyers ask conversational search engines (ChatGPT, Perplexity, Gemini, Claude).
${categories.length > 1 ? `IMPORTANT: Distribute the queries across these chosen categories: ${categoryLabel}.` : ''}
Respond strictly with a valid JSON array of objects with the following schema:
[
  {
    "query_text": "Exact buyer search prompt in conversational natural language",
    "category": "${schemaCategory}",
    "search_intent": "commercial" | "transactional" | "informational" | "navigational",
    "brand_association": "branded" | "unbranded",
    "recommended_frequency": "daily" | "weekly",
    "rationale": "1-sentence explaining how this search query helps evaluate brand visibility"
  }
]`;

        const userPrompt = `Workspace Context:
Brand: ${brandName} (${domain})
Industry: ${brandKit.industry || 'Consumer Retail'}
Core Offerings: ${brandKit.core_offerings || 'Key products'}
Target Audience: ${brandKit.target_audience || 'Prospective customers'}
Competitors: ${brandKit.competitors?.map((c) => c.name).join(', ') || 'Key market rivals'}

Parameters:
- Categories Focus: ${categoryLabel} (distribute the ${count} prompts across these chosen categories)
- Search Intent Preference: ${intent === 'all' ? 'Diverse mix of commercial, transactional, informational' : intent}
- Brand Association Preference: ${association === 'both' ? 'Mix of branded and unbranded queries' : association}

Generate exactly ${count} realistic buyer queries. Output strictly a JSON array without markdown formatting or code fences.`;

        const result = await generateText({
          model,
          system: systemPrompt,
          prompt: userPrompt,
          maxRetries: 0,
        });

        const jsonMatch = result.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        const cleanJson = jsonMatch ? jsonMatch[0] : result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated: GeneratedPromptSuggestion[] = parsed.slice(0, count).map((item, idx) => ({
            id: `gen-${Date.now()}-${idx}`,
            query_text: item.query_text,
            category: item.category && categories.includes(item.category) ? item.category : categories[idx % categories.length],
            search_intent: (['commercial', 'transactional', 'informational', 'navigational'].includes(item.search_intent)
              ? item.search_intent
              : 'commercial') as SearchIntent,
            brand_association: (item.brand_association === 'branded' ? 'branded' : 'unbranded') as BrandAssociation,
            recommended_frequency: (item.recommended_frequency === 'weekly' ? 'weekly' : 'daily') as AuditFrequency,
            rationale: item.rationale || 'High-value customer consideration search query.',
          }));
          return { prompts: validated };
        }
      } catch (err) {
        console.warn(`Gemini generation (${candidate}) encountered temporary issue, checking next candidate:`, err);
      }
    }
  }

  // 2. Dynamic Domain Intelligence Synthesis (graceful zero-downtime fallback tailored to brand & count)
  const compList = (brandKit.competitors || []).map((c) => c.name);
  const comp1 = compList[0] || 'market alternatives';
  const comp2 = compList[1] || 'alternative solutions';
  const comp3 = compList[2] || 'competing brands';

  const rawOfferings = (brandKit.core_offerings || (brandKit.industry ? `${brandKit.industry} solutions` : 'products and services'))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const item1 = rawOfferings[0] || 'solutions';
  const item2 = rawOfferings[1] || 'offerings';
  const item3 = rawOfferings[2] || 'products';

  const categoryTemplates: Record<string, Array<(b: string, i1: string, i2: string, c1: string, c2: string) => { text: string; intent: SearchIntent; assoc: BrandAssociation; freq: AuditFrequency; rationale: string }>> = {
    comparisons: [
      (b, i1, _, c1) => ({
        text: `${b} ${i1} vs ${c1}: which has better quality, reliability, and value in 2026?`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'daily',
        rationale: `Captures high-intent consideration searches evaluating ${b} directly against primary competitor ${c1}.`,
      }),
      (b, _, i2, __, c2) => ({
        text: `Is ${b} or ${c2} better for everyday use and high-performance requirements?`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'daily',
        rationale: `Monitors brand preference and side-by-side performance sentiment against ${c2}.`,
      }),
      (b, i1, ___, c1, c2) => ({
        text: `${b} vs ${c1} vs ${c2}: comprehensive side-by-side evaluation for ${i1}`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Tracks multi-brand roundup recommendations where buyers decide between leading market options.`,
      }),
      (b, _, i2, c1) => ({
        text: `${c1} alternative with comparable quality: how does ${b} ${i2} rank?`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Conquesting query capturing buyers looking to migrate away from ${c1}.`,
      }),
    ],
    discovery: [
      (_, i1, i2) => ({
        text: `Best ${i1} and ${i2} recommended by industry specialists in 2026`,
        intent: 'informational',
        assoc: 'unbranded',
        freq: 'daily',
        rationale: `Measures organic discovery presence when consumers ask conversational AI for top category recommendations without brand prompts.`,
      }),
      (_, i1) => ({
        text: `What are the highest-rated ${i1} options that deliver long-term durability and satisfaction?`,
        intent: 'commercial',
        assoc: 'unbranded',
        freq: 'daily',
        rationale: `Identifies whether AI engines cite your brand when durability and quality are key search factors.`,
      }),
      (b, _, i2) => ({
        text: `Emerging industry trends: where does ${b} rank among modern ${i2}?`,
        intent: 'informational',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Tracks brand thought leadership and category dominance in generative trend overviews.`,
      }),
      (_, i1) => ({
        text: `Top considerations when choosing premium ${i1} for demanding requirements`,
        intent: 'informational',
        assoc: 'unbranded',
        freq: 'daily',
        rationale: `Evaluates unbranded topical authority for performance-specific search intent.`,
      }),
    ],
    buying_guides: [
      (b, _, i2) => ({
        text: `Where to purchase ${b} ${i2} online with the best support, warranty, and return policy`,
        intent: 'transactional',
        assoc: 'branded',
        freq: 'daily',
        rationale: `Monitors direct purchase intent and verifies that AI engines cite verified authorized retail channels.`,
      }),
      (b, i1) => ({
        text: `Is ${b} ${i1} worth the price tag in 2026? Customer reviews and cost-to-value breakdown`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Assesses buyer conversion stage questions where price sensitivity and value justification dominate.`,
      }),
      (b, i1) => ({
        text: `Current discounts, packages, and pricing options for ${b} ${i1}`,
        intent: 'transactional',
        assoc: 'branded',
        freq: 'daily',
        rationale: `Ensures AI answer engines don't hallucinate invalid pricing or discount codes that hurt margin or trust.`,
      }),
      (_, i1) => ({
        text: `Complete buying guide for ${i1}: key specifications and criteria to verify before purchasing`,
        intent: 'informational',
        assoc: 'unbranded',
        freq: 'weekly',
        rationale: `Captures early-stage research queries before buyers narrow their final shortlist.`,
      }),
    ],
    features: [
      (b, i1, _, c1) => ({
        text: `${b} ${i1} specifications and feature review: how does it compare to ${c1}?`,
        intent: 'informational',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `High-frequency pre-checkout query where product specifications determine decision making.`,
      }),
      (b, _, i2) => ({
        text: `How does the proprietary technology of ${b} ${i2} perform under real-world conditions?`,
        intent: 'informational',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Evaluates whether AI engines correctly recite your technical product specifications and IP.`,
      }),
      (b, i1) => ({
        text: `${b} ${i1} long-term durability and reliability test: customer reviews and feedback`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Gauges long-term product perception and post-purchase customer satisfaction sentiment.`,
      }),
      (b, _, i2, __, c2) => ({
        text: `Usability, build quality, and comfort review: ${b} ${i2} vs ${c2}`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Granular feature-by-feature evaluation that frequently drives the final purchasing decision.`,
      }),
    ],
    alternatives: [
      (b, i1) => ({
        text: `Top alternatives to ${b} for high-performance ${i1}`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Alerts immediately when competitors displace ${b} in conquesting lists.`,
      }),
      (b, _, i2, c1) => ({
        text: `Options similar to ${b} with accessible pricing or specialized features like ${c1}`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'daily',
        rationale: `Monitors price-conquesting vulnerability where competitors bid against your brand recognition.`,
      }),
      (b, i1, __, ___, c2) => ({
        text: `If I currently use ${b} ${i1}, should I consider ${c2}? Feature and pricing comparison`,
        intent: 'commercial',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Tracks competitor brand crossover and customer deflection trends.`,
      }),
      (b, i1) => ({
        text: `Innovative brands competing with ${b} in ${i1} in 2026`,
        intent: 'informational',
        assoc: 'branded',
        freq: 'weekly',
        rationale: `Early warning telemetry on emerging niche entrants gaining AI search citations.`,
      }),
    ],
  };



  // Gather templates from all selected categories
  const selectedCategoryTemplates = categories.flatMap(
    (cat) => categoryTemplates[cat] || []
  );
  const pool = selectedCategoryTemplates.length > 0
    ? selectedCategoryTemplates
    : Object.values(categoryTemplates).flat();
  const generatedList: GeneratedPromptSuggestion[] = [];

  for (let idx = 0; idx < count; idx++) {
    const generator = pool[idx % pool.length];
    const currentOffering = idx % 2 === 0 ? item1 : item2;
    const currentSecondOffering = idx % 2 === 0 ? item2 : item3;
    const currentComp = idx % 3 === 0 ? comp1 : idx % 3 === 1 ? comp2 : comp3;
    const currentOtherComp = idx % 3 === 0 ? comp2 : comp1;

    const data = generator(brandName, currentOffering, currentSecondOffering, currentComp, currentOtherComp);

    // Apply preference overrides if specified
    const finalIntent = intent !== 'all' ? intent : data.intent;
    const finalAssoc = association !== 'both' ? association : data.assoc;
    const assignedCategory = categories[idx % categories.length];

    generatedList.push({
      id: `synth-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      query_text: data.text,
      category: assignedCategory,
      search_intent: finalIntent,
      brand_association: finalAssoc,
      recommended_frequency: data.freq,
      rationale: data.rationale,
    });
  }

  return { prompts: generatedList };
}

export interface BatchPromptInput {
  queryText: string;
  frequency: AuditFrequency;
  targetEngines: string[];
  searchIntent: SearchIntent;
  brandAssociation: BrandAssociation;
}

export async function batchCreatePromptAudits(prompts: BatchPromptInput[]) {
  if (!prompts || prompts.length === 0) {
    return { error: 'No prompts provided to add.' };
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let projectId = '';
  let projectTier = 'starter';
  let auditLimit = 20;
  const projectCookie = cookieStore.get('beacon_active_project');
  if (projectCookie?.value) {
    try {
      const parsed = JSON.parse(projectCookie.value);
      projectId = parsed.id || '';
      if (parsed.tier) projectTier = parsed.tier;
      auditLimit = parsed.audit_limit || getTierAuditLimit(projectTier);
    } catch {
      // ignore
    }
  }

  // Fallback for local demo mode without Supabase cloud
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const project = getActiveProjectFromCookie(cookieStore);
    let promptsList = [...getDemoPrompts(cookieStore, project)];

    if (promptsList.length + prompts.length > auditLimit) {
      const remaining = Math.max(0, auditLimit - promptsList.length);
      return {
        error: `Cannot add ${prompts.length} prompt(s). Your ${projectTier.toUpperCase()} plan has ${remaining} slot(s) remaining (limit: ${auditLimit}). Upgrade in Settings & Billing to expand your quota.`,
      };
    }

    const newItems = prompts.map((item, idx) => ({
      id: `prompt-ai-${Date.now()}-${idx}`,
      project_id: projectId || 'demo-project',
      query_text: item.queryText,
      frequency: item.frequency,
      target_engines: item.targetEngines,
      search_intent: item.searchIntent,
      brand_association: item.brandAssociation,
      is_active: true,
      last_run_at: null,
      next_run_at: new Date(
        Date.now() + (item.frequency === 'daily' ? 1000 * 60 * 60 * 24 : 1000 * 60 * 60 * 168)
      ).toISOString(),
      created_at: new Date().toISOString(),
      latest_score: null,
    }));

    promptsList = [...newItems, ...promptsList];
    cookieStore.set('beacon_demo_prompts', JSON.stringify(promptsList), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath('/audits');
    revalidatePath('/dashboard');
    return { success: true, createdCount: newItems.length, newItems };
  }

  // Supabase Cloud Insert
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required.' };
  }

  if (!projectId) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (projects && projects.length > 0) {
      projectId = projects[0].id;
    } else {
      return { error: 'No active project found.' };
    }
  }

  // Check quota against existing db prompts
  const { count: existingDbCount } = await supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (typeof existingDbCount === 'number' && existingDbCount + prompts.length > auditLimit) {
    const remaining = Math.max(0, auditLimit - existingDbCount);
    return {
      error: `Cannot add ${prompts.length} prompt(s). Your ${projectTier.toUpperCase()} plan has ${remaining} slot(s) remaining (limit: ${auditLimit}). Upgrade in Settings & Billing to expand your quota.`,
    };
  }

  const rows = prompts.map((item) => ({
    project_id: projectId,
    query_text: item.queryText,
    frequency: item.frequency,
    target_engines: item.targetEngines,
    search_intent: item.searchIntent,
    brand_association: item.brandAssociation,
    is_active: true,
    last_run_at: null,
    next_run_at: new Date(
      Date.now() + (item.frequency === 'daily' ? 1000 * 60 * 60 * 24 : 1000 * 60 * 60 * 168)
    ).toISOString(),
  }));

  const { data: inserted, error } = await supabase
    .from('prompts')
    .insert(rows)
    .select('id, query_text, frequency, target_engines, search_intent, brand_association, is_active, last_run_at, next_run_at');

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/audits');
  revalidatePath('/dashboard');
  return { success: true, createdCount: inserted?.length || rows.length, newItems: inserted };
}
