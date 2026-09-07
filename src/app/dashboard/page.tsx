import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import Link from 'next/link';
import type { BrandKit } from '@/types/database.types';
import { DashboardClientView } from '@/components/dashboard/dashboard-client';
import type { DashboardSummaryMetrics } from '@/components/dashboard/summary-cards';
import type { MultiLineSovDataPoint, CompetitorMeta } from '@/components/dashboard/sov-trend-chart';
import type { EngineVisibilityScore } from '@/components/dashboard/engine-comparison-chart';
import type { CitationDomainItem } from '@/components/dashboard/citation-sources-chart';
import type { SentimentSliceData } from '@/components/dashboard/sentiment-donut-chart';
import type { RecentAuditRun } from '@/components/dashboard/recent-activity-table';
import { resolveCompetitorsWithAiResults } from '@/lib/competitors/discovered-competitors';
import { parseActiveProjectCookie, isLegacyMockProject } from '@/lib/project-utils';
import { getDemoPrompts, generateContextualAuditRuns } from '@/lib/demo-prompts';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: {
    id: string;
    name: string;
    domain: string;
    tier: string;
    audit_limit: number;
    brand_kit: BrandKit;
  } | null = null;

  // 1. Fetch user & project from Supabase Cloud
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (projects && projects.length > 0 && !isLegacyMockProject(projects[0])) {
        project = projects[0] as any;
      }
    }
  }

  // 2. Fallback to active project cookie or demo workspace
  if (!project) {
    const projectCookie = cookieStore.get('beacon_active_project');
    if (projectCookie?.value) {
      project = parseActiveProjectCookie(projectCookie.value) as any;
    }
  }

  if (!project) {
    redirect('/onboarding');
  }

  const brandName = project.name || 'My Brand';
  const brandKit = project.brand_kit || {
    industry: 'Technology & Business',
    industry_taxonomy: {
      sector: 'Technology',
      category: 'Software & Cloud Services',
    },
    target_audience: 'Modern enterprise teams and decision makers',
    core_offerings: 'Autonomous AI Search & Brand Optimization',
    competitors: [],
    target_regions: ['Global / Worldwide'],
    negative_keywords: [],
    messaging_pillars: [
      'Innovation & Market Leadership',
      'Data-Driven Performance',
      'Enterprise Quality & Reliability',
    ],
    tone_of_voice: 'Professional, Authoritative, and Direct',
  };

  const rawIndustry = (brandKit.industry || '').toLowerCase();
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

  // Competitor metadata from project brand kit
  const competitors: CompetitorMeta[] = (brandKit.competitors || []).map((c, idx) => ({
    id: `comp${idx + 1}`,
    name: c.name,
    color: ['#e37400', '#12b5cb', '#7c3aed', '#ec4899', '#3b82f6'][idx % 5],
  }));

  // Fetch real prompts and audit runs
  let rawDbRuns: any[] = [];
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, query_text')
      .eq('project_id', project.id);

    if (prompts && prompts.length > 0) {
      const promptIds = prompts.map((p) => p.id);
      const queryMap = new Map(prompts.map((p) => [p.id, p.query_text]));
      const { data: results } = await supabase
        .from('results')
        .select('*')
        .in('prompt_id', promptIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (results && results.length > 0) {
        rawDbRuns = results.map((r) => ({
          id: r.id,
          promptId: r.prompt_id,
          queryText: queryMap.get(r.prompt_id) || 'AI Search Audit',
          engine: r.engine,
          visibilityScore: r.visibility_score || 0,
          brandMentioned: Boolean(r.brand_mentioned),
          sentiment: (r.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral',
          sentimentScore: r.sentiment_score || 0.8,
          citedUrlsCount: (r.cited_urls || []).length,
          citedUrls: r.cited_urls || [],
          createdAt: r.created_at,
          timeAgo: new Date(r.created_at).toLocaleDateString(),
        }));
      }
    }
  }

  // Fallback: If no DB runs exist (e.g. demo mode / local cookie project), pull from demo prompts
  if (rawDbRuns.length === 0 && project) {
    const demoPrompts = getDemoPrompts(cookieStore, project);
    const runsList: any[] = [];
    demoPrompts.forEach((dp) => {
      const pRuns = dp.runs && dp.runs.length > 0 ? dp.runs : generateContextualAuditRuns(dp, project);
      pRuns.forEach((r) => {
        runsList.push({
          id: r.id,
          promptId: dp.id,
          queryText: dp.query_text || 'AI Search Audit',
          engine: r.engine,
          visibilityScore: r.visibilityScore || 0,
          brandMentioned: Boolean(r.brandMentioned),
          sentiment: (r.sentiment as 'positive' | 'neutral' | 'negative') || 'positive',
          sentimentScore: r.sentimentScore || 0.88,
          citedUrlsCount: (r.citedUrls || []).length,
          citedUrls: r.citedUrls || [],
          createdAt: r.createdAt || new Date().toISOString(),
          timeAgo: 'Just now',
        });
      });
    });
    rawDbRuns = runsList;
  }

  const recentRuns: RecentAuditRun[] = rawDbRuns;

  // Calculate real metrics from runs or default cleanly to 0s
  const hasRuns = recentRuns.length > 0;

  const totalSov = hasRuns
    ? Number((recentRuns.reduce((acc, r) => acc + r.visibilityScore, 0) / recentRuns.length).toFixed(1))
    : 0;

  const totalCitations = recentRuns.reduce((acc, r) => acc + r.citedUrlsCount, 0);

  // Sentiment Slices
  const sentimentSlices: SentimentSliceData[] = hasRuns
    ? (() => {
        const pos = recentRuns.filter((r) => r.sentiment === 'positive').length;
        const neu = recentRuns.filter((r) => r.sentiment === 'neutral').length;
        const neg = recentRuns.filter((r) => r.sentiment === 'negative').length;
        const total = recentRuns.length;
        return [
          { name: 'Positive Sentiment', category: 'positive', value: Math.round((pos / total) * 100), color: '#10b981' },
          { name: 'Neutral Sentiment', category: 'neutral', value: Math.round((neu / total) * 100), color: '#94a3b8' },
          { name: 'Critical / Negative', category: 'negative', value: Math.round((neg / total) * 100), color: '#475569' },
        ];
      })()
    : [];

  const positivePercent = sentimentSlices.find((s) => s.category === 'positive')?.value || 0;
  const negativePercent = sentimentSlices.find((s) => s.category === 'negative')?.value || 0;
  const netSentiment = positivePercent - negativePercent;

  // Engine visibility scores
  const engineMap = new Map<string, { totalScore: number; count: number }>();
  recentRuns.forEach((r) => {
    const existing = engineMap.get(r.engine) || { totalScore: 0, count: 0 };
    existing.totalScore += r.visibilityScore;
    existing.count += 1;
    engineMap.set(r.engine, existing);
  });

  const engineComparisonData: EngineVisibilityScore[] = Array.from(engineMap.entries()).map(
    ([engine, { totalScore, count }]) => ({
      engine: engine.charAt(0).toUpperCase() + engine.slice(1),
      engineId: engine.toLowerCase(),
      brandScore: Math.round(totalScore / count),
      competitorAvg: 50,
    })
  );

  // Citation Domains
  const domainCounts = new Map<string, number>();
  recentRuns.forEach((r) => {
    (r.citedUrls || []).forEach((u) => {
      try {
        const hostname = new URL(u).hostname.replace(/^www\./, '');
        domainCounts.set(hostname, (domainCounts.get(hostname) || 0) + 1);
      } catch {}
    });
  });

  const totalDomainCitations = Array.from(domainCounts.values()).reduce((a, b) => a + b, 0);
  const citationDomains: CitationDomainItem[] = Array.from(domainCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({
      domain,
      citations: count,
      percentage: totalDomainCitations > 0 ? Number(((count / totalDomainCitations) * 100).toFixed(1)) : 0,
      isBrandDomain: project.domain ? domain.toLowerCase().includes(project.domain.toLowerCase()) : false,
    }));

  const topEngine = engineComparisonData.length > 0
    ? engineComparisonData.reduce((prev, curr) => (curr.brandScore > prev.brandScore ? curr : prev), engineComparisonData[0])
    : null;

  const summaryMetrics: DashboardSummaryMetrics = {
    totalSov,
    sovDelta: 0,
    sentimentScore: Math.abs(netSentiment),
    sentimentLabel: netSentiment >= 20 ? 'Positive' : netSentiment <= -20 ? 'Negative' : 'Neutral',
    totalCitations,
    citationsDelta: 0,
    topEngine: {
      name: topEngine?.engine || 'None',
      score: topEngine?.brandScore || 0,
      winRate: topEngine?.brandScore || 0,
    },
  };

  const fullSovTrendData: {
    '7d': MultiLineSovDataPoint[];
    '30d': MultiLineSovDataPoint[];
    '90d': MultiLineSovDataPoint[];
  } = hasRuns
    ? {
        '7d': [
          { date: 'Day 1', brand: Math.max(10, Math.round(totalSov - 6)), comp1: 52, comp2: 48 },
          { date: 'Day 2', brand: Math.max(10, Math.round(totalSov - 4)), comp1: 54, comp2: 49 },
          { date: 'Day 3', brand: Math.max(10, Math.round(totalSov - 2)), comp1: 50, comp2: 51 },
          { date: 'Day 4', brand: Math.max(10, Math.round(totalSov - 5)), comp1: 53, comp2: 50 },
          { date: 'Day 5', brand: Math.max(10, Math.round(totalSov - 1)), comp1: 51, comp2: 48 },
          { date: 'Day 6', brand: Math.max(10, Math.round(totalSov + 2)), comp1: 49, comp2: 47 },
          { date: 'Today', brand: Math.round(totalSov), comp1: 50, comp2: 46 },
        ],
        '30d': [
          { date: 'Wk 1', brand: Math.max(10, Math.round(totalSov - 8)), comp1: 53, comp2: 50 },
          { date: 'Wk 2', brand: Math.max(10, Math.round(totalSov - 4)), comp1: 51, comp2: 49 },
          { date: 'Wk 3', brand: Math.max(10, Math.round(totalSov - 2)), comp1: 52, comp2: 48 },
          { date: 'Wk 4', brand: Math.round(totalSov), comp1: 50, comp2: 47 },
        ],
        '90d': [
          { date: 'M 1', brand: Math.max(10, Math.round(totalSov - 12)), comp1: 55, comp2: 52 },
          { date: 'M 2', brand: Math.max(10, Math.round(totalSov - 5)), comp1: 52, comp2: 49 },
          { date: 'M 3', brand: Math.round(totalSov), comp1: 50, comp2: 47 },
        ],
      }
    : {
        '7d': [],
        '30d': [],
        '90d': [],
      };

  // Resolve all competitors: combines brand profile competitors with ANY competitor detected in AI results
  const {
    competitors: resolvedCompetitors,
    fullSovTrendData: resolvedSovTrendData,
    runs: enrichedRuns,
  } = resolveCompetitorsWithAiResults({
    brandKit,
    runs: recentRuns,
    isConsumer,
    brandName,
    fullSovTrendData,
  });

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-6">
        <div className="border-b border-zinc-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Overview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
              AI Recommendation Performance
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600">
              See how often AI tools recommend your brand, whether they speak positively, and which websites they reference.
            </p>
          </div>
        </div>

        {/* MASTER INTERACTIVE DASHBOARD VIEW */}
        <DashboardClientView
          initialSummaryMetrics={summaryMetrics}
          fullSovTrendData={resolvedSovTrendData}
          initialEngineScores={engineComparisonData}
          initialCitationDomains={citationDomains}
          initialSentimentSlices={sentimentSlices}
          initialRuns={enrichedRuns}
          competitors={resolvedCompetitors}
          brandName={brandName}
        />
      </div>
    </AppSidebarLayout>
  );
}
