import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { BrandKit } from '@/types/database.types';
import type { DashboardSummaryMetrics } from '@/components/dashboard/summary-cards';
import type { MultiLineSovDataPoint, CompetitorMeta } from '@/components/dashboard/sov-trend-chart';
import type { EngineVisibilityScore } from '@/components/dashboard/engine-comparison-chart';
import type { CitationDomainItem } from '@/components/dashboard/citation-sources-chart';
import type { SentimentSliceData } from '@/components/dashboard/sentiment-donut-chart';
import type { RecentAuditRun } from '@/components/dashboard/recent-activity-table';
import { resolveCompetitorsWithAiResults } from '@/lib/competitors/discovered-competitors';
import { parseActiveProjectCookie, isLegacyMockProject } from '@/lib/project-utils';
import { getDemoPrompts, generateContextualAuditRuns } from '@/lib/demo-prompts';

export interface DashboardData {
  project: {
    id: string;
    name: string;
    domain: string;
    tier: string;
    audit_limit?: number;
    brand_kit: BrandKit;
  };
  summaryMetrics: DashboardSummaryMetrics;
  fullSovTrendData: {
    '7d': MultiLineSovDataPoint[];
    '30d': MultiLineSovDataPoint[];
    '90d': MultiLineSovDataPoint[];
  };
  engineComparisonData: EngineVisibilityScore[];
  citationDomains: CitationDomainItem[];
  sentimentSlices: SentimentSliceData[];
  runs: RecentAuditRun[];
  competitors: CompetitorMeta[];
  brandName: string;
}

export async function loadDashboardData(): Promise<DashboardData | null> {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: DashboardData['project'] | null = null;

  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (projects && projects.length > 0 && !isLegacyMockProject(projects[0])) {
        project = projects[0] as DashboardData['project'];
      }
    }
  }

  if (!project) {
    const projectCookie = cookieStore.get('beacon_active_project');
    if (projectCookie?.value) project = parseActiveProjectCookie(projectCookie.value) as DashboardData['project'];
  }
  if (!project) return null;

  const brandName = project.name || 'My Brand';
  const brandKit: BrandKit = project.brand_kit || {
    industry: 'Technology & Business',
    industry_taxonomy: { sector: 'Technology', category: 'Software & Cloud Services' },
    target_audience: 'Modern enterprise teams and decision makers',
    core_offerings: 'Autonomous AI Search & Brand Optimization',
    competitors: [],
    target_regions: ['Global / Worldwide'],
    negative_keywords: [],
    messaging_pillars: ['Innovation & Market Leadership', 'Data-Driven Performance', 'Enterprise Quality & Reliability'],
    tone_of_voice: 'Professional, Authoritative, and Direct',
  } as BrandKit;

  const rawIndustry = (brandKit.industry || '').toLowerCase();
  const isConsumer = ['retail', 'commerce', 'apparel', 'footwear', 'fashion', 'sport', 'fitness', 'athleisure']
    .some((term) => rawIndustry.includes(term)) || brandName.toLowerCase().includes('nike');

  const competitors: CompetitorMeta[] = (brandKit.competitors || []).map((c, idx) => ({
    id: `comp${idx + 1}`,
    name: c.name,
    color: ['#e37400', '#12b5cb', '#7c3aed', '#ec4899', '#3b82f6'][idx % 5],
  }));

  let recentRuns: RecentAuditRun[] = [];
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const { data: prompts } = await supabase.from('prompts').select('id, query_text').eq('project_id', project.id);
    if (prompts && prompts.length > 0) {
      const queryMap = new Map(prompts.map((p) => [p.id, p.query_text]));
      const { data: results } = await supabase
        .from('results')
        .select('*')
        .in('prompt_id', prompts.map((p) => p.id))
        .order('created_at', { ascending: false })
        .limit(20);
      if (results) {
        recentRuns = results.map((r) => ({
          id: r.id,
          promptId: r.prompt_id,
          queryText: queryMap.get(r.prompt_id) || 'AI Search Audit',
          engine: r.engine,
          visibilityScore: r.visibility_score || 0,
          brandMentioned: Boolean(r.brand_mentioned),
          sentiment: r.sentiment || 'neutral',
          sentimentScore: r.sentiment_score || 0.8,
          citedUrlsCount: (r.cited_urls || []).length,
          citedUrls: r.cited_urls || [],
          createdAt: r.created_at,
          timeAgo: new Date(r.created_at).toLocaleDateString(),
        })) as RecentAuditRun[];
      }
    }
  }

  if (recentRuns.length === 0) {
    const demoPrompts = getDemoPrompts(cookieStore, project);
    const demoRuns: RecentAuditRun[] = [];
    demoPrompts.forEach((dp) => {
      const promptRuns = dp.runs && dp.runs.length > 0 ? dp.runs : generateContextualAuditRuns(dp, project!);
      promptRuns.forEach((r) => demoRuns.push({
        id: r.id,
        promptId: dp.id,
        queryText: dp.query_text || 'AI Search Audit',
        engine: r.engine,
        visibilityScore: r.visibilityScore || 0,
        brandMentioned: Boolean(r.brandMentioned),
        sentiment: r.sentiment || 'positive',
        sentimentScore: r.sentimentScore || 0.88,
        citedUrlsCount: (r.citedUrls || []).length,
        citedUrls: r.citedUrls || [],
        createdAt: r.createdAt || new Date().toISOString(),
        timeAgo: 'Just now',
      }));
    });
    recentRuns = demoRuns;
  }

  const hasRuns = recentRuns.length > 0;
  const totalSov = hasRuns ? Number((recentRuns.reduce((sum, r) => sum + r.visibilityScore, 0) / recentRuns.length).toFixed(1)) : 0;
  const totalCitations = recentRuns.reduce((sum, r) => sum + r.citedUrlsCount, 0);

  const sentimentSlices: SentimentSliceData[] = hasRuns ? (() => {
    const total = recentRuns.length;
    const positive = recentRuns.filter((r) => r.sentiment === 'positive').length;
    const neutral = recentRuns.filter((r) => r.sentiment === 'neutral').length;
    const negative = recentRuns.filter((r) => r.sentiment === 'negative').length;
    return [
      { name: 'Positive Sentiment', category: 'positive', value: Math.round((positive / total) * 100), color: 'var(--chart-emerald)' },
      { name: 'Neutral Sentiment', category: 'neutral', value: Math.round((neutral / total) * 100), color: '#94a3b8' },
      { name: 'Critical / Negative', category: 'negative', value: Math.round((negative / total) * 100), color: 'var(--chart-rose)' },
    ];
  })() : [];

  const positivePercent = sentimentSlices.find((s) => s.category === 'positive')?.value || 0;
  const negativePercent = sentimentSlices.find((s) => s.category === 'negative')?.value || 0;
  const netSentiment = positivePercent - negativePercent;

  const engineMap = new Map<string, { totalScore: number; count: number }>();
  recentRuns.forEach((r) => {
    const current = engineMap.get(r.engine) || { totalScore: 0, count: 0 };
    current.totalScore += r.visibilityScore;
    current.count += 1;
    engineMap.set(r.engine, current);
  });
  const engineComparisonData: EngineVisibilityScore[] = Array.from(engineMap.entries()).map(([engine, value]) => ({
    engine: engine.charAt(0).toUpperCase() + engine.slice(1),
    engineId: engine.toLowerCase(),
    brandScore: Math.round(value.totalScore / value.count),
    competitorAvg: 50,
  }));

  const domainCounts = new Map<string, number>();
  recentRuns.forEach((r) => (r.citedUrls || []).forEach((url) => {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '');
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
    } catch {}
  }));
  const totalDomainCitations = Array.from(domainCounts.values()).reduce((sum, count) => sum + count, 0);
  const citationDomains: CitationDomainItem[] = Array.from(domainCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, citations]) => ({
      domain,
      citations,
      percentage: totalDomainCitations ? Number(((citations / totalDomainCitations) * 100).toFixed(1)) : 0,
      isBrandDomain: Boolean(project!.domain && domain.toLowerCase().includes(project!.domain.toLowerCase())),
    }));

  const topEngine = engineComparisonData.length > 0
    ? engineComparisonData.reduce((best, current) => current.brandScore > best.brandScore ? current : best, engineComparisonData[0])
    : null;

  const summaryMetrics: DashboardSummaryMetrics = {
    totalSov,
    sovDelta: 0,
    sentimentScore: Math.abs(netSentiment),
    sentimentLabel: netSentiment >= 20 ? 'Positive' : netSentiment <= -20 ? 'Negative' : 'Neutral',
    totalCitations,
    citationsDelta: 0,
    topEngine: { name: topEngine?.engine || 'None', score: topEngine?.brandScore || 0, winRate: topEngine?.brandScore || 0 },
  };

  const fullSovTrendData = hasRuns ? {
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
  } : { '7d': [], '30d': [], '90d': [] };

  const resolved = resolveCompetitorsWithAiResults({
    brandKit,
    runs: recentRuns,
    isConsumer,
    brandName,
    fullSovTrendData,
  });

  return {
    project: { ...project, brand_kit: brandKit },
    summaryMetrics,
    fullSovTrendData: resolved.fullSovTrendData,
    engineComparisonData,
    citationDomains,
    sentimentSlices,
    runs: resolved.runs,
    competitors: resolved.competitors,
    brandName,
  };
}
