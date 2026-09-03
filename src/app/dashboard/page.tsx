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

      if (projects && projects.length > 0) {
        project = projects[0] as any;
      }
    }
  }

  // 2. Fallback to active project cookie or demo workspace
  if (!project) {
    const projectCookie = cookieStore.get('beacon_active_project');
    if (projectCookie?.value) {
      try {
        project = JSON.parse(projectCookie.value);
      } catch {
        project = null;
      }
    }
  }

  if (!project) {
    project = {
      id: 'demo-project-lululemon',
      name: 'Lululemon',
      domain: 'lululemon.com',
      tier: 'enterprise',
      audit_limit: 100,
      brand_kit: {
        industry: 'Premium Athleisure & Athletic Apparel',
        target_audience: 'Mindful movement practitioners, yoga & Pilates enthusiasts, runners, gym-goers, and fitness lifestyle consumers',
        core_offerings: 'Align Pant (Nulu fabric), Define Jacket, Wunder Train tights, ABC Joggers, Everywhere Belt Bag & technical athleisure',
        competitors: [
          { name: 'Alo Yoga', domain: 'aloyoga.com' },
          { name: 'Vuori', domain: 'vuoriclothing.com' },
          { name: 'Athleta', domain: 'athleta.gap.com' },
        ],
        tone_of_voice: 'Empowering, Mindful, Elevated, Performance-Driven',
      },
    };
  }

  const brandName = project.name || 'Lululemon';
  const brandKit = project.brand_kit || {
    industry: 'Premium Athleisure & Athletic Apparel',
    target_audience: 'Yoga & Pilates enthusiasts, runners, and athleisure consumers',
    core_offerings: 'Align Leggings, Define Jackets, ABC Pants & technical activewear',
    competitors: [
      { name: 'Alo Yoga', domain: 'aloyoga.com' },
      { name: 'Vuori', domain: 'vuoriclothing.com' },
      { name: 'Athleta', domain: 'athleta.gap.com' },
    ],
    tone_of_voice: 'Empowering & Performance-Driven',
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
    brandName.toLowerCase().includes('nike') ||
    brandName.toLowerCase().includes('lululemon');

  // Competitor metadata
  const competitors: CompetitorMeta[] = isConsumer
    ? [
        { id: 'comp1', name: brandKit.competitors?.[0]?.name || 'Alo Yoga', color: '#e37400' },
        { id: 'comp2', name: brandKit.competitors?.[1]?.name || 'Vuori', color: '#12b5cb' },
        { id: 'comp3', name: brandKit.competitors?.[2]?.name || 'Athleta', color: '#7c3aed' },
      ]
    : [
        { id: 'comp1', name: brandKit.competitors?.[0]?.name || 'Legacy Incumbent', color: '#e37400' },
        { id: 'comp2', name: brandKit.competitors?.[1]?.name || 'Alternative Leader', color: '#12b5cb' },
        { id: 'comp3', name: 'Market Challenger', color: '#7c3aed' },
      ];

  // Multi-line SOV trend datasets for 7d, 30d, 90d with daily shift drivers
  const fullSovTrendData: {
    '7d': MultiLineSovDataPoint[];
    '30d': MultiLineSovDataPoint[];
    '90d': MultiLineSovDataPoint[];
  } = {
    '7d': [
      { date: '6d ago', brand: 74.3, comp1: 54.2, comp2: 48.0, comp3: 39.0, shiftDriver: 'Reddit r/lululemon discussion thread on Align Nulu durability & fit' },
      { date: '5d ago', brand: 73.0, comp1: 53.8, comp2: 49.5, comp3: 40.2, shiftDriver: 'Alo Yoga spring drop campaign noted across lifestyle publications' },
      { date: '4d ago', brand: 75.1, comp1: 53.0, comp2: 50.1, comp3: 41.0, shiftDriver: 'Product wear-test breakdown published on YouTube fitness gear channel' },
      { date: '3d ago', brand: 76.8, comp1: 52.0, comp2: 51.0, comp3: 39.5, shiftDriver: 'Perplexity citation surge from verified buyer reviews on squat-proof leggings' },
      { date: '2d ago', brand: 78.2, comp1: 52.5, comp2: 49.0, comp3: 38.0, shiftDriver: 'Claude featured recommendation in premium yoga activewear comparison' },
      { date: 'Yesterday', brand: 80.5, comp1: 51.5, comp2: 48.5, comp3: 37.2, shiftDriver: 'Gemini synthesis updated with ABC Pant commuter comfort highlights' },
      { date: 'Today', brand: 82.6, comp1: 50.8, comp2: 47.9, comp3: 36.8, shiftDriver: 'Top recommendation on ChatGPT for high-waisted Pilates & workout leggings' },
    ],
    '30d': [
      { date: 'Day 1', brand: 64.2, comp1: 58.0, comp2: 46.0, comp3: 42.0, shiftDriver: 'Initial monthly activewear audit baseline' },
      { date: 'Day 4', brand: 66.8, comp1: 57.5, comp2: 47.2, comp3: 41.5, shiftDriver: 'Brand mentioned in Women\'s Health best leggings roundup' },
      { date: 'Day 7', brand: 65.4, comp1: 59.0, comp2: 48.0, comp3: 43.0, shiftDriver: 'Alo Yoga seasonal studio campaign push' },
      { date: 'Day 10', brand: 69.1, comp1: 58.2, comp2: 47.5, comp3: 41.0, shiftDriver: 'Verified buyer feedback surge on r/lululemon and r/xxfitness' },
      { date: 'Day 13', brand: 72.5, comp1: 56.4, comp2: 48.2, comp3: 40.5, shiftDriver: 'Athletic authority domain citations refreshed by LLMs' },
      { date: 'Day 16', brand: 70.8, comp1: 55.0, comp2: 49.0, comp3: 41.2, shiftDriver: 'Vuori launches new DreamKnit colorways' },
      { date: 'Day 19', brand: 74.3, comp1: 54.2, comp2: 48.0, comp3: 39.0, shiftDriver: 'Reddit community thread discussion on Align pilling prevention' },
      { date: 'Day 22', brand: 73.0, comp1: 53.8, comp2: 49.5, comp3: 40.2, shiftDriver: 'Competitor sale noted across third-party style review portals' },
      { date: 'Day 25', brand: 76.8, comp1: 52.0, comp2: 51.0, comp3: 39.5, shiftDriver: 'Perplexity citation surge from verified yoga instructor reviews' },
      { date: 'Day 28', brand: 79.4, comp1: 51.5, comp2: 49.0, comp3: 38.0, shiftDriver: 'Claude featured recommendation in category comparison' },
      { date: 'Today', brand: 82.6, comp1: 50.8, comp2: 47.9, comp3: 36.8, shiftDriver: 'Top recommendation on ChatGPT for performance queries' },
    ],
    '90d': [
      { date: 'Wk 1', brand: 58.0, comp1: 62.0, comp2: 44.0, comp3: 45.0, shiftDriver: 'Quarterly baseline telemetry established' },
      { date: 'Wk 3', brand: 61.2, comp1: 60.5, comp2: 45.1, comp3: 44.0, shiftDriver: 'Initial citation footprint indexing across engines' },
      { date: 'Wk 5', brand: 64.8, comp1: 58.2, comp2: 46.5, comp3: 43.1, shiftDriver: 'Publication of expert testing benchmarks' },
      { date: 'Wk 7', brand: 68.5, comp1: 57.0, comp2: 47.0, comp3: 42.0, shiftDriver: 'Perplexity citations added from tech publications' },
      { date: 'Wk 9', brand: 71.9, comp1: 55.4, comp2: 48.2, comp3: 40.8, shiftDriver: 'Community trust signals boosted on forum rankings' },
      { date: 'Wk 11', brand: 76.4, comp1: 53.2, comp2: 49.0, comp3: 39.5, shiftDriver: 'Product update reviews cited by Claude & ChatGPT' },
      { date: 'Wk 13', brand: 82.6, comp1: 50.8, comp2: 47.9, comp3: 36.8, shiftDriver: 'Dominant #1 recommendation across all 4 target engines' },
    ],
  };

  // Engine visibility comparison scores
  const engineComparisonData: EngineVisibilityScore[] = [
    { engine: 'ChatGPT 4o', engineId: 'chatgpt', brandScore: 86, competitorAvg: 64 },
    { engine: 'Gemini 1.5', engineId: 'gemini', brandScore: 78, competitorAvg: 59 },
    { engine: 'Claude 3.5', engineId: 'claude', brandScore: 72, competitorAvg: 68 },
    { engine: 'Perplexity', engineId: 'perplexity', brandScore: 94, competitorAvg: 52 },
    { engine: 'Google AI Overview', engineId: 'google_ai_overview', brandScore: 91, competitorAvg: 61 },
    { engine: 'Google AI Mode', engineId: 'google_ai_mode', brandScore: 85, competitorAvg: 58 },
  ];

  // Top Cited Authority Domains
  const citationDomains: CitationDomainItem[] = [
    { domain: 'reddit.com', citations: 48, percentage: 29.3 },
    { domain: project.domain || 'lululemon.com', citations: 42, percentage: 25.6, isBrandDomain: true },
    { domain: isConsumer ? 'womenshealthmag.com' : 'techcrunch.com', citations: 31, percentage: 18.9 },
    { domain: 'youtube.com', citations: 24, percentage: 14.6 },
    { domain: isConsumer ? 'thestrategist.com' : 'gartner.com', citations: 19, percentage: 11.6 },
  ];

  // Sentiment Donut Data Slices
  const sentimentSlices: SentimentSliceData[] = [
    { name: 'Positive Sentiment', category: 'positive', value: 68, color: '#10b981' },
    { name: 'Neutral Sentiment', category: 'neutral', value: 24, color: '#94a3b8' },
    { name: 'Critical / Negative', category: 'negative', value: 8, color: '#475569' },
  ];

  // Summary metrics baseline
  const summaryMetrics: DashboardSummaryMetrics = {
    totalSov: 82.6,
    sovDelta: 14.8,
    sentimentScore: 87,
    sentimentLabel: 'Positive',
    totalCitations: 164,
    citationsDelta: 28,
    topEngine: {
      name: 'Perplexity Sonar',
      score: 94,
      winRate: 89,
    },
  };

  // Recent automated prompt audits telemetry with cited URLs
  const recentRuns: RecentAuditRun[] = [
    {
      id: 'run-1',
      promptId: 'prompt-seed-1',
      queryText: isConsumer
        ? 'Best buttery-soft yoga leggings with high waistband support in 2026'
        : `Best ${brandKit.industry || 'enterprise intelligence'} solutions for 2026`,
      engine: 'Perplexity',
      visibilityScore: 96,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.92,
      citedUrlsCount: 4,
      citedUrls: [
        `https://${project.domain || 'lululemon.com'}/align-pant-nulu`,
        'https://reddit.com/r/lululemon/comments/align_durability_2026',
        'https://womenshealthmag.com/fitness/best-yoga-leggings',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      timeAgo: '14m ago',
    },
    {
      id: 'run-2',
      promptId: 'prompt-seed-2',
      queryText: isConsumer
        ? `${brandName} Align vs Alo Yoga Airbrush: comfort and squat test review`
        : `Top alternatives to ${brandKit.competitors?.[0]?.name || 'market incumbents'}`,
      engine: 'ChatGPT',
      visibilityScore: 88,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.84,
      citedUrlsCount: 3,
      citedUrls: [
        `https://${project.domain || 'lululemon.com'}/align-vs-competitors`,
        'https://youtube.com/watch?v=leggings_squat_test_2026',
        'https://thestrategist.com/best-workout-leggings',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
      timeAgo: '1h ago',
    },
    {
      id: 'run-3',
      promptId: 'prompt-seed-3',
      queryText: isConsumer
        ? `Where to buy authentic ${brandName} activewear and Everywhere Belt Bags online`
        : `How to implement generative engine optimization workflows`,
      engine: 'Claude',
      visibilityScore: 74,
      brandMentioned: true,
      sentiment: 'neutral',
      sentimentScore: 0.65,
      citedUrlsCount: 2,
      citedUrls: [
        `https://${project.domain || 'lululemon.com'}/store-locator`,
        'https://reddit.com/r/athleisure/comments/authentic_lululemon_deals',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      timeAgo: '3h ago',
    },
    {
      id: 'run-4',
      promptId: 'prompt-seed-4',
      queryText: isConsumer
        ? `Best men's athletic commuter pants: ${brandName} ABC vs Vuori Meta Jogger`
        : `Comparison of ${brandName} vs ${brandKit.competitors?.[0]?.name || 'competitor'}`,
      engine: 'Gemini',
      visibilityScore: 84,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.79,
      citedUrlsCount: 3,
      citedUrls: [
        `https://${project.domain || 'lululemon.com'}/men/abc-pants`,
        'https://gq.com/story/best-mens-commuter-pants',
        'https://runnersworld.com/gear/mens-running-joggers',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      timeAgo: '6h ago',
    },
    {
      id: 'run-5',
      promptId: 'prompt-seed-5',
      queryText: isConsumer
        ? `Budget alternatives to premium $100+ athleisure leggings`
        : `Enterprise spend and observability architecture review`,
      engine: 'ChatGPT',
      visibilityScore: 0,
      brandMentioned: false,
      sentiment: 'neutral',
      sentimentScore: 0.0,
      citedUrlsCount: 0,
      citedUrls: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      timeAgo: '12h ago',
    },
    {
      id: 'run-6',
      promptId: 'prompt-seed-6',
      queryText: isConsumer
        ? `Pilling prevention and fabric care guide for ${brandName} Align Nulu tights`
        : `Known latency issues and bottlenecks with ${brandName}`,
      engine: 'Perplexity',
      visibilityScore: 68,
      brandMentioned: true,
      sentiment: 'negative',
      sentimentScore: -0.45,
      citedUrlsCount: 3,
      citedUrls: [
        'https://reddit.com/r/lululemon/comments/pilling_prevention_guide',
        'https://youtube.com/watch?v=align_wash_and_care',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 960).toISOString(),
      timeAgo: '16h ago',
    },
    {
      id: 'run-7',
      promptId: 'prompt-seed-7',
      queryText: isConsumer
        ? `Best high-waisted activewear leggings with verified customer reviews`
        : `Answer engine optimization platforms and generative search tools 2026`,
      engine: 'google_ai_overview',
      visibilityScore: 92,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.88,
      citedUrlsCount: 4,
      citedUrls: [
        `https://${project.domain || 'lululemon.com'}/align`,
        'https://womenshealthmag.com/fitness/best-yoga-leggings',
        'https://thestrategist.com/best-workout-leggings',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      timeAgo: '45m ago',
    },
  ];

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-6">
        <div className="border-b border-zinc-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                GEO Dashboard
              </span>
              <span className="text-zinc-300">&bull;</span>
              <span className="text-xs font-mono text-emerald-600 font-medium">All 6 Engines Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
              {brandName} &bull; AI Share of Voice
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600">
              Aggregated generative visibility across ChatGPT, Google Gemini, Anthropic Claude, Perplexity Sonar, and Google AI Overviews & AI Mode.
            </p>
          </div>
        </div>

        {/* MASTER INTERACTIVE DASHBOARD VIEW */}
        <DashboardClientView
          initialSummaryMetrics={summaryMetrics}
          fullSovTrendData={fullSovTrendData}
          initialEngineScores={engineComparisonData}
          initialCitationDomains={citationDomains}
          initialSentimentSlices={sentimentSlices}
          initialRuns={recentRuns}
          competitors={competitors}
          brandName={brandName}
        />
      </div>
    </AppSidebarLayout>
  );
}
