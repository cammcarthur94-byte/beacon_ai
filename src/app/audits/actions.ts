'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { executeMultiEngineAudit } from '@/lib/ai/engine-runner';
import type { AuditFrequency, BrandKit, SearchIntent, BrandAssociation } from '@/types/database.types';
import { extractDomain, categorizeSource } from '@/lib/citations/categorizer';
import { checkTierAccess, isTierEligibleForGoogleAi } from '@/lib/billing/tier-access';

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
    } catch {
      // ignore
    }
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

  // Fallback for local development if cloud credentials aren't set
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const existingPromptsRaw = cookieStore.get('beacon_demo_prompts')?.value;
    const promptsList = existingPromptsRaw ? JSON.parse(existingPromptsRaw) : [];

    const newPrompt = {
      id: 'prompt-' + Date.now(),
      project_id: projectId || 'demo-project',
      query_text: queryText,
      frequency,
      target_engines: finalTargetEngines,
      search_intent: searchIntent,
      brand_association: brandAssociation,
      is_active: true,
      last_run_at: new Date().toISOString(),
      next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      created_at: new Date().toISOString(),
      latest_score: 84,
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
      .select('id, name, domain, brand_kit')
      .eq('user_id', user.id)
      .limit(1);

    if (!projects || projects.length === 0) {
      return { error: 'No active project found. Complete onboarding first.' };
    }
    projectId = projects[0].id;
    brandName = projects[0].name;
    domain = projects[0].domain;
    brandKit = projects[0].brand_kit;
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

    if (evaluations.length > 0) {
      const resultRows = evaluations.map((ev) => ({
        prompt_id: insertedPrompt.id,
        engine: ev.engine,
        visibility_score: ev.visibilityScore,
        brand_mentioned: ev.brandMentioned,
        sentiment: ev.sentiment,
        sentiment_score: ev.sentimentScore,
        raw_text: ev.rawText,
        cited_urls: ev.citedUrls,
        ranking_position: ev.rankingPosition,
      }));

      const { data: insertedResults } = await supabase
        .from('results')
        .insert(resultRows)
        .select('id, engine');

      const resultMap = new Map<string, string>();
      if (insertedResults) {
        for (const res of insertedResults) {
          resultMap.set(res.engine, res.id);
        }
      }

      const allCitationRows = [];
      for (const ev of evaluations) {
        if (ev.citedUrls && ev.citedUrls.length > 0) {
          const runId = resultMap.get(ev.engine) || null;
          for (const rawUrl of ev.citedUrls) {
            const domainName = extractDomain(rawUrl);
            allCitationRows.push({
              project_id: projectId,
              run_id: runId,
              engine: ev.engine,
              url: rawUrl,
              domain: domainName || 'unknown.com',
              source_type: categorizeSource(domainName, rawUrl),
            });
          }
        }
      }

      if (allCitationRows.length > 0) {
        await supabase.from('citations').insert(allCitationRows);
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
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const raw = cookieStore.get('beacon_demo_prompts')?.value;
    if (raw) {
      const list = JSON.parse(raw);
      const updated = list.map((p: any) =>
        p.id === promptId ? { ...p, is_active: !isCurrentlyActive } : p
      );
      cookieStore.set('beacon_demo_prompts', JSON.stringify(updated), { path: '/' });
    }
    revalidatePath('/audits');
    return { success: true };
  }

  const { error } = await supabase
    .from('prompts')
    .update({ is_active: !isCurrentlyActive })
    .eq('id', promptId);

  if (error) return { error: error.message };

  revalidatePath('/audits');
  return { success: true };
}

export async function deletePromptAudit(promptId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const raw = cookieStore.get('beacon_demo_prompts')?.value;
    if (raw) {
      const list = JSON.parse(raw).filter((p: any) => p.id !== promptId);
      cookieStore.set('beacon_demo_prompts', JSON.stringify(list), { path: '/' });
    }
    revalidatePath('/audits');
    return { success: true };
  }

  const { error } = await supabase.from('prompts').delete().eq('id', promptId);
  if (error) return { error: error.message };

  revalidatePath('/audits');
  return { success: true };
}

export async function triggerInstantRun(promptId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    revalidatePath('/audits');
    revalidatePath('/dashboard');
    return { success: true, message: 'Instant audit completed successfully.' };
  }

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

  const evaluations = await executeMultiEngineAudit({
    queryText: prompt.query_text,
    brandName: project.name,
    domain: project.domain,
    competitors: project.brand_kit?.competitors || [],
    targetEngines: enginesToRun,
  });

  if (evaluations.length > 0) {
    const resultRows = evaluations.map((ev) => ({
      prompt_id: prompt.id,
      engine: ev.engine,
      visibility_score: ev.visibilityScore,
      brand_mentioned: ev.brandMentioned,
      sentiment: ev.sentiment,
      sentiment_score: ev.sentimentScore,
      raw_text: ev.rawText,
      cited_urls: ev.citedUrls,
      ranking_position: ev.rankingPosition,
    }));

    const { data: insertedResults } = await supabase
      .from('results')
      .insert(resultRows)
      .select('id, engine');

    const resultMap = new Map<string, string>();
    if (insertedResults) {
      for (const res of insertedResults) {
        resultMap.set(res.engine, res.id);
      }
    }

    const allCitationRows = [];
    for (const ev of evaluations) {
      if (ev.citedUrls && ev.citedUrls.length > 0) {
        const runId = resultMap.get(ev.engine) || null;
        for (const rawUrl of ev.citedUrls) {
          const domainName = extractDomain(rawUrl);
          allCitationRows.push({
            project_id: project.id,
            run_id: runId,
            engine: ev.engine,
            url: rawUrl,
            domain: domainName || 'unknown.com',
            source_type: categorizeSource(domainName, rawUrl),
          });
        }
      }
    }

    if (allCitationRows.length > 0) {
      await supabase.from('citations').insert(allCitationRows);
    }
  }

  await supabase
    .from('prompts')
    .update({ last_run_at: new Date().toISOString() })
    .eq('id', prompt.id);

  revalidatePath('/audits');
  revalidatePath('/dashboard');
  return { success: true };
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

export async function generateAiPrompts(params: {
  category?: string;
  searchIntent?: SearchIntent | 'all';
  brandAssociation?: BrandAssociation | 'both';
  count?: number;
}): Promise<{ prompts: GeneratedPromptSuggestion[]; error?: string }> {
  const cookieStore = await cookies();
  const count = params.count || 5;

  let brandName = 'Lululemon';
  let domain = 'lululemon.com';
  let brandKit: BrandKit = {
    industry: 'Premium Athleisure & Athletic Apparel',
    target_audience: 'Mindful movement practitioners, yoga & Pilates enthusiasts, runners, gym-goers, and fitness lifestyle consumers',
    core_offerings: 'Align Pant (Nulu fabric), Define Jacket, Wunder Train tights, ABC Joggers, Everywhere Belt Bag & technical athleisure',
    competitors: [
      { name: 'Alo Yoga', domain: 'aloyoga.com' },
      { name: 'Vuori', domain: 'vuoriclothing.com' },
      { name: 'Athleta', domain: 'athleta.gap.com' },
    ],
    tone_of_voice: 'Empowering, Mindful, Elevated, Performance-Driven',
  };

  const projectCookie = cookieStore.get('beacon_active_project');
  if (projectCookie?.value) {
    try {
      const parsed = JSON.parse(projectCookie.value);
      brandName = parsed.name || brandName;
      domain = parsed.domain || domain;
      if (parsed.brand_kit) brandKit = parsed.brand_kit;
    } catch {
      // ignore
    }
  }

  const category = params.category || 'comparisons';
  const intent = params.searchIntent || 'all';
  const association = params.brandAssociation || 'both';

  // 1. Try real LLM generation if keys available
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const hasGoogleKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

  if (hasOpenAiKey || hasGoogleKey) {
    try {
      const model = hasOpenAiKey ? openai('gpt-4o-mini') : google('gemini-1.5-flash');
      const systemPrompt = `You are Beacon's Generative Engine Optimization (GEO) strategist.
Generate ${count} high-impact, realistic search query prompts that prospective buyers ask conversational search engines (ChatGPT, Perplexity, Gemini, Claude).
Respond strictly with a valid JSON array of objects with the following schema:
[
  {
    "query_text": "Exact buyer search prompt in conversational natural language",
    "category": "${category}",
    "search_intent": "commercial" | "transactional" | "informational" | "navigational",
    "brand_association": "branded" | "unbranded",
    "recommended_frequency": "daily" | "weekly",
    "rationale": "1-sentence why tracking this query yields high business intelligence"
  }
]`;

      const userPrompt = `Workspace Context:
Brand: ${brandName} (${domain})
Industry: ${brandKit.industry || 'Consumer Retail'}
Core Offerings: ${brandKit.core_offerings || 'Key products'}
Target Audience: ${brandKit.target_audience || 'Prospective customers'}
Competitors: ${brandKit.competitors?.map((c) => c.name).join(', ') || 'Key market rivals'}

Parameters:
- Category Focus: ${category}
- Search Intent Preference: ${intent === 'all' ? 'Diverse mix of commercial, transactional, informational' : intent}
- Brand Association Preference: ${association === 'both' ? 'Mix of branded and unbranded queries' : association}

Generate ${count} realistic queries. Output JSON only without markdown fences.`;

      const result = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
      });

      const cleanJson = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validated: GeneratedPromptSuggestion[] = parsed.map((item, idx) => ({
          id: `gen-${Date.now()}-${idx}`,
          query_text: item.query_text,
          category: item.category || category,
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
      console.warn('AI generation fell back to domain templates:', err);
    }
  }

  // 2. High-quality domain synthesis fallback
  const competitor1 = brandKit.competitors?.[0]?.name || 'Alo Yoga';
  const competitor2 = brandKit.competitors?.[1]?.name || 'Vuori';
  const firstOffering = brandKit.core_offerings?.split(',')[0]?.trim() || 'athletic wear';
  const secondOffering = brandKit.core_offerings?.split(',')[1]?.trim() || 'leggings';

  const templatePool: Array<{
    query_text: string;
    category: string;
    search_intent: SearchIntent;
    brand_association: BrandAssociation;
    recommended_frequency: AuditFrequency;
    rationale: string;
  }> = [
    {
      query_text: `${brandName} ${firstOffering} vs ${competitor1}: which has better durability and fit in 2026?`,
      category: 'comparisons',
      search_intent: 'commercial',
      brand_association: 'branded',
      recommended_frequency: 'daily',
      rationale: `Captures high-intent buyers comparing ${brandName} against rival ${competitor1}.`,
    },
    {
      query_text: `Best buttery-soft leggings for hot yoga and Pilates: top recommended brands`,
      category: 'discovery',
      search_intent: 'informational',
      brand_association: 'unbranded',
      recommended_frequency: 'daily',
      rationale: `Monitors whether AI engines cite ${brandName} without explicit brand prompting.`,
    },
    {
      query_text: `Is ${brandName} ${firstOffering} worth the investment compared to ${competitor2}?`,
      category: 'features',
      search_intent: 'commercial',
      brand_association: 'branded',
      recommended_frequency: 'weekly',
      rationale: `Evaluates price-to-value citations and customer sentiment against ${competitor2}.`,
    },
    {
      query_text: `Where to buy authentic ${brandName} ${secondOffering} with the best return policy online`,
      category: 'buying_guides',
      search_intent: 'transactional',
      brand_association: 'branded',
      recommended_frequency: 'daily',
      rationale: `Monitors transactional citation placement and partner link accuracy.`,
    },
    {
      query_text: `Top premium athleisure alternatives to ${brandName} with moisture-wicking fabric`,
      category: 'alternatives',
      search_intent: 'commercial',
      brand_association: 'branded',
      recommended_frequency: 'weekly',
      rationale: `Alerts when competitors appear in conquesting lists when buyers search for alternatives.`,
    },
    {
      query_text: `Most flattering gym workout sets and studio joggers for women in 2026`,
      category: 'discovery',
      search_intent: 'informational',
      brand_association: 'unbranded',
      recommended_frequency: 'daily',
      rationale: `Tracks organic discovery share of voice for top-of-funnel workout searches.`,
    },
    {
      query_text: `${brandName} vs ${competitor1} sizing guide: do they run true to size or small?`,
      category: 'features',
      search_intent: 'informational',
      brand_association: 'branded',
      recommended_frequency: 'weekly',
      rationale: `Ensures AI search answers provide accurate fit recommendations without dissuading buyers.`,
    },
  ];

  // Filter templates based on requested criteria
  let filtered = templatePool;
  if (intent !== 'all') {
    filtered = filtered.filter((t) => t.search_intent === intent);
    if (filtered.length === 0) filtered = templatePool;
  }
  if (association !== 'both') {
    filtered = filtered.filter((t) => t.brand_association === association);
    if (filtered.length === 0) filtered = templatePool;
  }

  const results: GeneratedPromptSuggestion[] = filtered.slice(0, count).map((item, idx) => ({
    ...item,
    id: `synth-${Date.now()}-${idx}`,
  }));

  return { prompts: results };
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
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let projectId = '';
  const projectCookie = cookieStore.get('beacon_active_project');
  if (projectCookie?.value) {
    try {
      const parsed = JSON.parse(projectCookie.value);
      projectId = parsed.id;
    } catch {
      // ignore
    }
  }

  // Fallback for local demo mode without Supabase cloud
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const existingPromptsRaw = cookieStore.get('beacon_demo_prompts')?.value;
    let promptsList = existingPromptsRaw ? JSON.parse(existingPromptsRaw) : [];

    const newItems = prompts.map((item, idx) => ({
      id: `prompt-ai-${Date.now()}-${idx}`,
      project_id: projectId || 'demo-project',
      query_text: item.queryText,
      frequency: item.frequency,
      target_engines: item.targetEngines,
      search_intent: item.searchIntent,
      brand_association: item.brandAssociation,
      is_active: true,
      last_run_at: new Date().toISOString(),
      next_run_at: new Date(
        Date.now() + (item.frequency === 'daily' ? 1000 * 60 * 60 * 24 : 1000 * 60 * 60 * 168)
      ).toISOString(),
      created_at: new Date().toISOString(),
      latest_score: Math.floor(Math.random() * 14) + 82,
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

  const rows = prompts.map((item) => ({
    project_id: projectId,
    query_text: item.queryText,
    frequency: item.frequency,
    target_engines: item.targetEngines,
    search_intent: item.searchIntent,
    brand_association: item.brandAssociation,
    is_active: true,
    last_run_at: new Date().toISOString(),
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
