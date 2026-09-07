import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { AuditResultsClient } from '@/components/audits/audit-results-client';
import type { BrandKit, SearchIntent, BrandAssociation } from '@/types/database.types';
import type { AuditRunDetail } from '@/components/audits/raw-output-viewer';
import { getPromptById, generateContextualAuditRuns, type DemoPromptItem } from '@/lib/demo-prompts';
import { parseActiveProjectCookie, isLegacyMockProject } from '@/lib/project-utils';

interface PromptResultsPageProps {
  params: Promise<{ promptId: string }>;
}

export default async function PromptResultsPage({ params }: PromptResultsPageProps) {
  const { promptId } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: { id: string; name: string; domain: string; tier: string; brand_kit?: BrandKit } | null = null;
  let prompt: DemoPromptItem | null = null;
  let runs: AuditRunDetail[] = [];

  // 1. Fetch from Supabase cloud if configured
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: promptData } = await supabase
        .from('prompts')
        .select(`
          id,
          query_text,
          frequency,
          target_engines,
          search_intent,
          brand_association,
          is_active,
          last_run_at,
          next_run_at,
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

      if (promptData) {
        prompt = promptData as any;
        if (promptData.projects && !isLegacyMockProject(promptData.projects)) {
          project = promptData.projects as any;
        }

        const { data: results } = await supabase
          .from('results')
          .select('*')
          .eq('prompt_id', promptId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (results && results.length > 0) {
          runs = results.map((r) => ({
            id: r.id,
            engine: r.engine,
            visibilityScore: r.visibility_score,
            brandMentioned: r.brand_mentioned,
            rankingPosition: r.ranking_position,
            sentiment: r.sentiment as any,
            sentimentScore: Number(r.sentiment_score),
            rawText: r.raw_text,
            citedUrls: r.cited_urls || [],
            createdAt: r.created_at,
          }));
        }
      }
    }
  }

  // 2. Fallback to active project cookie / demo state
  if (!project) {
    const projectCookie = cookieStore.get('beacon_active_project');
    if (projectCookie?.value) {
      project = parseActiveProjectCookie(projectCookie.value);
    }
  }

  if (!project) {
    redirect('/onboarding');
  }

  const rawIndustry = (project.brand_kit?.industry || '').toLowerCase();
  const brandName = project.name || 'My Brand';
  const isConsumer =
    rawIndustry.includes('retail') ||
    rawIndustry.includes('commerce') ||
    rawIndustry.includes('apparel') ||
    rawIndustry.includes('footwear') ||
    rawIndustry.includes('fashion') ||
    rawIndustry.includes('sport') ||
    rawIndustry.includes('fitness') ||
    rawIndustry.includes('athleisure') ||
    brandName.toLowerCase().includes('nike');

  if (!prompt) {
    prompt = getPromptById(promptId, cookieStore, project);
  }

  if (!prompt) {
    notFound();
  }

  if (runs.length === 0) {
    if ((prompt as any)?.runs?.length > 0) {
      runs = (prompt as any).runs;
    } else {
      runs = generateContextualAuditRuns(prompt, project);
    }
  }

  // Detect competitors: profile competitors + any competitor appearing in real AI results
  const competitorsSet = new Set<string>();
  (project.brand_kit?.competitors || []).forEach((c) => {
    if (c.name && c.name.trim()) competitorsSet.add(c.name.trim());
  });

  const competitors = Array.from(competitorsSet);

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto font-sans">
        <AuditResultsClient
          prompt={prompt}
          project={{
            id: project.id,
            name: brandName,
            domain: project.domain,
            tier: project.tier,
            competitors,
          }}
          initialRuns={runs}
        />
      </div>
    </AppSidebarLayout>
  );
}
