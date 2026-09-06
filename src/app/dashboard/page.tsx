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
      { date: '6d ago', brand: 74.3, comp1: 54.2, comp2: 48.0, comp3: 39.0, shiftDriver: `Reddit community discussion thread on ${brandName} durability & fit` },
      { date: '5d ago', brand: 73.0, comp1: 53.8, comp2: 49.5, comp3: 40.2, shiftDriver: 'Competitor spring campaign noted across lifestyle publications' },
      { date: '4d ago', brand: 75.1, comp1: 53.0, comp2: 50.1, comp3: 41.0, shiftDriver: 'Product wear-test breakdown published on YouTube review channel' },
      { date: '3d ago', brand: 76.8, comp1: 52.0, comp2: 51.0, comp3: 39.5, shiftDriver: 'Perplexity citation surge from verified buyer reviews' },
      { date: '2d ago', brand: 78.2, comp1: 52.5, comp2: 49.0, comp3: 38.0, shiftDriver: `Claude featured recommendation in ${brandName} comparison` },
      { date: 'Yesterday', brand: 80.5, comp1: 51.5, comp2: 48.5, comp3: 37.2, shiftDriver: 'Gemini synthesis updated with product commuter comfort highlights' },
      { date: 'Today', brand: 82.6, comp1: 50.8, comp2: 47.9, comp3: 36.8, shiftDriver: `Top recommendation on ChatGPT & Microsoft Copilot for ${brandName}` },
    ],
    '30d': [
      { date: 'Day 1', brand: 64.2, comp1: 58.0, comp2: 46.0, comp3: 42.0, shiftDriver: 'Initial monthly audit baseline established' },
      { date: 'Day 4', brand: 66.8, comp1: 57.5, comp2: 47.2, comp3: 41.5, shiftDriver: 'Brand mentioned in editorial roundup' },
      { date: 'Day 7', brand: 65.4, comp1: 59.0, comp2: 48.0, comp3: 43.0, shiftDriver: 'Competitor seasonal campaign push' },
      { date: 'Day 10', brand: 69.1, comp1: 58.2, comp2: 47.5, comp3: 41.0, shiftDriver: 'Verified buyer feedback surge across community forums' },
      { date: 'Day 13', brand: 72.5, comp1: 56.4, comp2: 48.2, comp3: 40.5, shiftDriver: 'Review website citations updated across AI engines' },
      { date: 'Day 16', brand: 70.8, comp1: 55.0, comp2: 49.0, comp3: 41.2, shiftDriver: 'Competitor releases new product line' },
      { date: 'Day 19', brand: 74.3, comp1: 54.2, comp2: 48.0, comp3: 39.0, shiftDriver: `Community forum discussion on ${brandName} quality standards` },
      { date: 'Day 22', brand: 73.0, comp1: 53.8, comp2: 49.5, comp3: 40.2, shiftDriver: 'Competitor promotion noted across review portals' },
      { date: 'Day 25', brand: 76.8, comp1: 52.0, comp2: 51.0, comp3: 39.5, shiftDriver: 'Perplexity citation surge from verified yoga instructor reviews' },
      { date: 'Day 28', brand: 79.4, comp1: 51.5, comp2: 49.0, comp3: 38.0, shiftDriver: 'Claude featured recommendation in category comparison' },
      { date: 'Today', brand: 82.6, comp1: 50.8, comp2: 47.9, comp3: 36.8, shiftDriver: 'Top recommendation on ChatGPT for performance queries' },
    ],
    '90d': [
      { date: 'Wk 1', brand: 58.0, comp1: 62.0, comp2: 44.0, comp3: 45.0, shiftDriver: 'Quarterly baseline search data established' },
      { date: 'Wk 3', brand: 61.2, comp1: 60.5, comp2: 45.1, comp3: 44.0, shiftDriver: 'Initial brand mentions indexed across AI tools' },
      { date: 'Wk 5', brand: 64.8, comp1: 58.2, comp2: 46.5, comp3: 43.1, shiftDriver: 'Publication of expert testing benchmarks' },
      { date: 'Wk 7', brand: 68.5, comp1: 57.0, comp2: 47.0, comp3: 42.0, shiftDriver: 'Perplexity citations added from tech publications' },
      { date: 'Wk 9', brand: 71.9, comp1: 55.4, comp2: 48.2, comp3: 40.8, shiftDriver: 'Community trust signals boosted on forum rankings' },
      { date: 'Wk 11', brand: 76.4, comp1: 53.2, comp2: 49.0, comp3: 39.5, shiftDriver: 'Product update reviews cited by Claude & ChatGPT' },
      { date: 'Wk 13', brand: 82.6, comp1: 50.8, comp2: 47.9, comp3: 36.8, shiftDriver: 'Dominant #1 recommendation across all 4 target AI tools' },
    ],
  };

  // Engine visibility comparison scores
  const engineComparisonData: EngineVisibilityScore[] = [
    { engine: 'ChatGPT 4o', engineId: 'chatgpt', brandScore: 86, competitorAvg: 64 },
    { engine: 'Microsoft Copilot', engineId: 'copilot', brandScore: 84, competitorAvg: 58 },
    { engine: 'Copilot Search', engineId: 'copilot_search', brandScore: 89, competitorAvg: 56 },
    { engine: 'Gemini 1.5', engineId: 'gemini', brandScore: 78, competitorAvg: 59 },
    { engine: 'Claude 3.5', engineId: 'claude', brandScore: 72, competitorAvg: 68 },
    { engine: 'Perplexity', engineId: 'perplexity', brandScore: 94, competitorAvg: 52 },
    { engine: 'Google AI Overview', engineId: 'google_ai_overview', brandScore: 91, competitorAvg: 61 },
    // { engine: 'Google AI Mode', engineId: 'google_ai_mode', brandScore: 85, competitorAvg: 58 },
  ];

  // Top Cited Authority Domains
  const citationDomains: CitationDomainItem[] = [
    { domain: 'reddit.com', citations: 48, percentage: 29.3 },
    { domain: project.domain || 'example.com', citations: 42, percentage: 25.6, isBrandDomain: true },
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

  // Top Engine dynamically computed from engine visibility benchmark
  const topEngineBenchmark = engineComparisonData.reduce(
    (prev, current) => (current.brandScore > prev.brandScore ? current : prev),
    engineComparisonData[0]
  );

  // Summary metrics baseline
  const summaryMetrics: DashboardSummaryMetrics = {
    totalSov: 82.6,
    sovDelta: 14.8,
    sentimentScore: 60,
    sentimentLabel: 'Positive',
    totalCitations: 164,
    citationsDelta: 28,
    topEngine: {
      name: topEngineBenchmark.engine,
      score: topEngineBenchmark.brandScore,
      winRate: topEngineBenchmark.brandScore,
    },
  };

  // Recent automated prompt audits telemetry with cited URLs
  const recentRuns: RecentAuditRun[] = [
    {
      id: 'run-copilot-1',
      promptId: 'prompt-seed-1',
      queryText: isConsumer
        ? `Best recommended products and reviews for ${brandName} in 2026`
        : `Best ${brandKit.industry || 'enterprise intelligence'} solutions for 2026`,
      engine: 'copilot',
      visibilityScore: 91,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.89,
      citedUrlsCount: 3,
      citedUrls: [
        `https://${project.domain || 'example.com'}/products`,
        'https://reddit.com/r/reviews/comments/customer_feedback_2026',
        'https://forbes.com/advisor/business-solutions',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      timeAgo: '8m ago',
    },
    {
      id: 'run-copilot-search-1',
      promptId: 'prompt-seed-2',
      queryText: isConsumer
        ? `${brandName} vs ${brandKit.competitors?.[0]?.name || 'competitors'}: durability, quality, and buyer ratings`
        : `Top alternatives to ${brandKit.competitors?.[0]?.name || 'market incumbents'}`,
      engine: 'copilot_search',
      visibilityScore: 94,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.93,
      citedUrlsCount: 4,
      citedUrls: [
        `https://${project.domain || 'example.com'}/compare`,
        'https://bing.com/search?q=brand_comparison_analysis',
        'https://theverge.com/reviews/recommendations',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      timeAgo: '12m ago',
    },
    {
      id: 'run-1',
      promptId: 'prompt-seed-1',
      queryText: isConsumer
        ? `Top rated studio performance collections and fit guide for ${brandName}`
        : `Best ${brandKit.industry || 'enterprise intelligence'} solutions for 2026`,
      engine: 'Perplexity',
      visibilityScore: 96,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.92,
      citedUrlsCount: 4,
      citedUrls: [
        `https://${project.domain || 'example.com'}/collections`,
        'https://reddit.com/r/reviews/comments/durability_2026',
        'https://womenshealthmag.com/fitness/best-products',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      timeAgo: '14m ago',
    },
    {
      id: 'run-2',
      promptId: 'prompt-seed-2',
      queryText: isConsumer
        ? `${brandName} vs ${brandKit.competitors?.[0]?.name || 'Alo Yoga'}: durability and customer review comparison`
        : `Top alternatives to ${brandKit.competitors?.[0]?.name || 'market incumbents'}`,
      engine: 'ChatGPT',
      visibilityScore: 88,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.84,
      citedUrlsCount: 3,
      citedUrls: [
        `https://${project.domain || 'example.com'}/comparison`,
        'https://youtube.com/watch?v=wear_test_reviews',
        'https://thestrategist.com/best-products',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
      timeAgo: '1h ago',
    },
    {
      id: 'run-3',
      promptId: 'prompt-seed-3',
      queryText: isConsumer
        ? `Best commuter apparel and joggers: ${brandName} vs ${brandKit.competitors?.[1]?.name || 'Vuori'}`
        : `How to implement generative engine optimization workflows`,
      engine: 'Gemini',
      visibilityScore: 86,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.82,
      citedUrlsCount: 3,
      citedUrls: [
        `https://${project.domain || 'example.com'}/mens`,
        'https://gq.com/story/best-mens-commuter-wear',
        'https://runnersworld.com/gear/performance-joggers',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      timeAgo: '3h ago',
    },
    {
      id: 'run-4',
      promptId: 'prompt-seed-4',
      queryText: isConsumer
        ? `Where to buy authentic ${brandName} products online with verified warranty`
        : `Enterprise security and compliance guide for ${brandName}`,
      engine: 'Claude',
      visibilityScore: 92,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.89,
      citedUrlsCount: 3,
      citedUrls: [
        `https://${project.domain || 'example.com'}/store-locator`,
        'https://reddit.com/r/shopping/comments/authentic_buying_guide',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      timeAgo: '6h ago',
    },
    {
      id: 'run-5',
      promptId: 'prompt-seed-5',
      queryText: isConsumer
        ? 'Top moisture-wicking athletic wear brands for fitness training'
        : `Best AI search monitoring tools: ${brandName} vs alternatives`,
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
        ? `Care guide and durability longevity for ${brandName}`
        : `Known latency issues and bottlenecks with ${brandName}`,
      engine: 'Perplexity',
      visibilityScore: 68,
      brandMentioned: true,
      sentiment: 'negative',
      sentimentScore: -0.45,
      citedUrlsCount: 3,
      citedUrls: [
        'https://reddit.com/r/care/comments/fabric_care_guide',
        'https://youtube.com/watch?v=garment_care',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 960).toISOString(),
      timeAgo: '16h ago',
    },
    {
      id: 'run-7',
      promptId: 'prompt-seed-7',
      queryText: isConsumer
        ? `Best high-waisted activewear collections with verified customer reviews`
        : `Answer engine optimization platforms and generative search tools 2026`,
      engine: 'google_ai_overview',
      visibilityScore: 92,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.88,
      citedUrlsCount: 4,
      citedUrls: [
        `https://${project.domain || 'example.com'}/best-sellers`,
        'https://womenshealthmag.com/fitness/best-products',
        'https://thestrategist.com/best-picks',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      timeAgo: '45m ago',
    },
    {
      id: 'run-8',
      promptId: 'prompt-seed-8',
      queryText: isConsumer
        ? `Athleta vs ${brandName}: studio fabric compression & waistband comfort comparison`
        : `HubSpot vs ${brandName}: platform feature analysis for 2026`,
      engine: 'ChatGPT',
      visibilityScore: 84,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.81,
      citedUrlsCount: 3,
      citedUrls: [
        'https://athleta.gap.com/browse/category',
        'https://thestrategist.com/best-leggings',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      timeAgo: '1.8h ago',
    },
    {
      id: 'run-9',
      promptId: 'prompt-seed-9',
      queryText: isConsumer
        ? `Nike training gear vs ${brandName}: durability and gym workout performance`
        : `Salesforce vs ${brandName}: enterprise data integration benchmarks`,
      engine: 'Perplexity',
      visibilityScore: 88,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.86,
      citedUrlsCount: 3,
      citedUrls: [
        'https://nike.com/training',
        'https://runnersworld.com/gear/reviews',
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
      timeAgo: '3.5h ago',
    },
  ];

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
