import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Award,
  Link2,
  Clock,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { PromptTrendChart, type PromptHistoricalDataPoint } from '@/components/audits/prompt-trend-chart';
import { RawOutputViewer, type AuditRunDetail } from '@/components/audits/raw-output-viewer';
import { AiReportView } from '@/components/audits/ai-report-view';
import { EngineIcon, getEngineMeta } from '@/components/ui/engine-badge';
import type { BrandKit, SearchIntent, BrandAssociation } from '@/types/database.types';

interface PromptDeepDivePageProps {
  params: Promise<{ promptId: string }>;
}

function getIntentBadgeClass(intent: string) {
  switch (intent) {
    case 'commercial':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'transactional':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'navigational':
      return 'border-purple-200 bg-purple-50 text-purple-800';
    case 'informational':
    default:
      return 'border-blue-200 bg-blue-50 text-blue-800';
  }
}

export default async function PromptDeepDivePage({ params }: PromptDeepDivePageProps) {
  const { promptId } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: { id: string; name: string; domain: string; tier: string; brand_kit?: BrandKit } | null = null;
  let prompt: {
    id: string;
    query_text: string;
    frequency: string;
    target_engines: string[];
    search_intent?: SearchIntent;
    brand_association?: BrandAssociation;
    is_active: boolean;
    last_run_at: string | null;
    next_run_at: string;
  } | null = null;
  let runs: AuditRunDetail[] = [];

  // 1. Fetch from Supabase cloud
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
        project = promptData.projects as any;

        const { data: results } = await supabase
          .from('results')
          .select('*')
          .eq('prompt_id', promptId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (results) {
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

  // 2. Fallback to active project cookie / demo prompts
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

  const rawIndustry = (project.brand_kit?.industry || '').toLowerCase();
  const brandName = project.name || 'Lululemon';
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

  if (!prompt) {
    const demoPromptsCookie = cookieStore.get('beacon_demo_prompts');
    if (demoPromptsCookie?.value) {
      try {
        const demoList = JSON.parse(demoPromptsCookie.value);
        const match = demoList.find((p: any) => p.id === promptId);
        if (match) prompt = match;
      } catch {}
    }

    if (!prompt) {
      prompt = {
        id: promptId,
        query_text: isConsumer
          ? 'Best buttery-soft yoga leggings for Pilates and studio workouts in 2026'
          : `What are the best platforms for ${brandName} in 2026?`,
        frequency: 'daily',
        target_engines: ['chatgpt', 'gemini', 'claude', 'perplexity'],
        search_intent: isConsumer ? 'commercial' : 'informational',
        brand_association: 'unbranded',
        is_active: true,
        last_run_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
      };
    }
  }

  // Fallback simulated runs if none in DB
  if (runs.length === 0) {
    const competitorA = project.brand_kit?.competitors?.[0]?.name || (isConsumer ? 'Alo Yoga' : 'Legacy Incumbent');
    const competitorB = project.brand_kit?.competitors?.[1]?.name || (isConsumer ? 'Vuori' : 'Alternative Leader');

    runs = [
      {
        id: 'run-per-1',
        engine: 'perplexity',
        visibilityScore: 94,
        brandMentioned: true,
        rankingPosition: 1,
        sentiment: 'positive',
        sentimentScore: 0.94,
        rawText: `Based on verified reviews and expert testing for "${prompt.query_text}":\n\n1. ${brandName} Align High-Rise (https://${project.domain}) stands out as the primary recommendation, celebrated for buttery-soft Nulu™ fabric, four-way stretch, and an ergonomic waistband that doesn't slip during deep stretches.\n2. ${competitorA} - Airbrush & Airlift sculpting studio alternative.\n3. ${competitorB} - Performance knit daily activewear favorite.`,
        citedUrls: [
          `https://${project.domain}/align-pant-nulu`,
          isConsumer ? 'https://womenshealthmag.com/fitness/best-yoga-leggings' : 'https://techcrunch.com/2026/platform',
          isConsumer ? 'https://reddit.com/r/lululemon/comments/align_durability' : 'https://reddit.com/r/technology',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
      },
      {
        id: 'run-gpt-1',
        engine: 'chatgpt',
        visibilityScore: 89,
        brandMentioned: true,
        rankingPosition: 1,
        sentiment: 'positive',
        sentimentScore: 0.88,
        rawText: `When evaluating options for "${prompt.query_text}", several key choices lead the category:\n\n• ${brandName}: Strongly recommended for proprietary Nulu™ fabric softness, verified squat-proof opacity, and stellar community feedback on r/lululemon.\n• ${competitorA}: Popular fashion-forward studio alternative.\n• ${competitorB}: Noted for ultra-soft loungewear and versatile joggers.`,
        citedUrls: [
          `https://${project.domain}/align-collection`,
          isConsumer ? 'https://thestrategist.com/best-workout-leggings' : 'https://techcrunch.com',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: 'run-gem-1',
        engine: 'gemini',
        visibilityScore: 82,
        brandMentioned: true,
        rankingPosition: 2,
        sentiment: 'positive',
        sentimentScore: 0.78,
        rawText: `Summary for "${prompt.query_text}":\n\n1. ${competitorA}\n2. ${brandName}: Emerging at the top of recommendations with high satisfaction ratings.\n3. ${competitorB}.`,
        citedUrls: [`https://${project.domain}/overview`],
        createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      },
      {
        id: 'run-cla-1',
        engine: 'claude',
        visibilityScore: 74,
        brandMentioned: true,
        rankingPosition: 2,
        sentiment: 'neutral',
        sentimentScore: 0.62,
        rawText: `Analysis for "${prompt.query_text}":\n\nThe market segment features ${brandName} and ${competitorA}. Reviewers praise ${brandName}'s modern innovation, though legacy incumbents retain historic name recognition.`,
        citedUrls: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      },
      {
        id: 'run-gaio-1',
        engine: 'google_ai_overview',
        visibilityScore: 92,
        brandMentioned: true,
        rankingPosition: 1,
        sentiment: 'positive',
        sentimentScore: 0.90,
        rawText: `Google AI Overview snapshot for "${prompt.query_text}":\n\n• ${brandName} (https://${project.domain}) is highlighted as the premier choice with top tier product reviews.\n• ${competitorA} represents a prominent alternative.\n• ${competitorB} is notable for everyday comfort.`,
        citedUrls: [
          `https://${project.domain}/overview`,
          isConsumer ? 'https://womenshealthmag.com/fitness/best-yoga-leggings' : 'https://techcrunch.com',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ];
  }

  // Multi-line chart historical trend data
  const trendData: PromptHistoricalDataPoint[] = [
    { date: '14d ago', chatgpt: 70, gemini: 65, claude: 60, perplexity: 78, google_ai_overview: 72, google_ai_mode: 68 },
    { date: '11d ago', chatgpt: 74, gemini: 68, claude: 62, perplexity: 82, google_ai_overview: 76, google_ai_mode: 71 },
    { date: '8d ago', chatgpt: 79, gemini: 72, claude: 68, perplexity: 86, google_ai_overview: 81, google_ai_mode: 77 },
    { date: '5d ago', chatgpt: 84, gemini: 76, claude: 70, perplexity: 89, google_ai_overview: 85, google_ai_mode: 80 },
    { date: '2d ago', chatgpt: 86, gemini: 80, claude: 72, perplexity: 93, google_ai_overview: 89, google_ai_mode: 84 },
    { date: 'Today', chatgpt: 88, gemini: 82, claude: 74, perplexity: 92, google_ai_overview: 91, google_ai_mode: 86 },
  ];

  // Top-Line Metrics Calculation:
  const latestRun = trendData[trendData.length - 1];
  const currentAvgSov = Math.round(
    (latestRun.chatgpt +
      latestRun.gemini +
      latestRun.claude +
      latestRun.perplexity +
      (latestRun.google_ai_overview || 0) +
      (latestRun.google_ai_mode || 0)) /
      6
  );

  // Run from ~7 days prior (index 2: '8d ago')
  const priorRun7d = trendData[2];
  const priorAvgSov = Math.round(
    (priorRun7d.chatgpt +
      priorRun7d.gemini +
      priorRun7d.claude +
      priorRun7d.perplexity +
      (priorRun7d.google_ai_overview || 0) +
      (priorRun7d.google_ai_mode || 0)) /
      6
  );

  const delta = currentAvgSov - priorAvgSov;
  const isPositiveDelta = delta > 0;
  const isZeroDelta = delta === 0;
  const deltaFormatted = isZeroDelta ? '0%' : `${isPositiveDelta ? '▲ +' : '▼ '}${Math.abs(delta)}%`;

  // Top performing engine from latest trend data
  const engineScores = [
    { id: 'perplexity', label: 'Perplexity', score: latestRun.perplexity },
    { id: 'chatgpt', label: 'ChatGPT', score: latestRun.chatgpt },
    { id: 'google_ai_overview', label: 'AI Overviews', score: latestRun.google_ai_overview || 0 },
    { id: 'google_ai_mode', label: 'AI Mode', score: latestRun.google_ai_mode || 0 },
    { id: 'gemini', label: 'Gemini', score: latestRun.gemini },
    { id: 'claude', label: 'Claude', score: latestRun.claude },
  ].sort((a, b) => b.score - a.score);

  const topEngine = engineScores[0] || { id: 'perplexity', label: 'Perplexity', score: 92 };

  // Total active citations across audit runs
  const totalCitationsCount =
    runs.reduce((acc, r) => acc + (r.citedUrls ? r.citedUrls.length : 0), 0) || 14;

  const currentIntent = prompt.search_intent || 'commercial';
  const currentAssociation = prompt.brand_association || 'unbranded';

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/audits"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to All Audits
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-emerald-50 border-emerald-200 text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{prompt.is_active ? 'Continuous Monitoring Active' : 'Monitoring Paused'}</span>
          </div>
        </div>

        {/* ── 1. FULL-WIDTH HEADER BANNER ── */}
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-6 sm:p-7 space-y-5">
            {/* Categorization Badges: Intent, Brand Association, Cadence */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Prompt Details
              </span>
              <span className="text-slate-300">&bull;</span>
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-mono capitalize"
              >
                {prompt.frequency} Cadence
              </Badge>
              {/* Search Intent Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border font-semibold uppercase tracking-wider ${getIntentBadgeClass(
                  currentIntent
                )}`}
              >
                {currentIntent} Intent
              </span>
              {/* Brand Association Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border font-medium capitalize ${
                  currentAssociation === 'branded'
                    ? 'border-slate-300 bg-slate-100 text-slate-900 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {currentAssociation}
              </span>
            </div>

            {/* Actual Prompt Text (Large, prominent) */}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-950 tracking-tight leading-snug">
                &ldquo;{prompt.query_text}&rdquo;
              </h1>
            </div>

            {/* Sub-line metadata & Target Engines */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {prompt.last_run_at && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Last run: {new Date(prompt.last_run_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                )}
                {prompt.next_run_at && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Next scheduled: {new Date(prompt.next_run_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                )}
              </div>

              {/* Target engines row */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
                  Target Engines:
                </span>
                <div className="flex items-center gap-1.5">
                  {prompt.target_engines.map((eng) => {
                    const meta = getEngineMeta(eng);
                    return (
                      <div
                        key={eng}
                        title={meta.label}
                        className="h-6 w-6 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center p-1"
                      >
                        <EngineIcon engine={eng} size={14} className={meta.iconColor} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── 2. 4-COLUMN KPI METRIC GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Current Avg SOV */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-medium">
                  Current Avg SOV
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-950 tracking-tight">
                  {currentAvgSov}%
                </div>
                <p className="text-xs text-slate-500 mt-1 font-sans">Across target engines</p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: 7-Day Delta */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-medium">
                  7-Day Delta
                </span>
                <div
                  className={`h-8 w-8 rounded-lg border flex items-center justify-center shadow-2xs ${
                    isPositiveDelta
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : isZeroDelta
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'bg-red-50 border-red-200 text-red-600'
                  }`}
                >
                  {isPositiveDelta ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : isZeroDelta ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>
              </div>
              <div>
                <div
                  className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                    isPositiveDelta
                      ? 'text-emerald-600'
                      : isZeroDelta
                      ? 'text-slate-700'
                      : 'text-red-600'
                  }`}
                >
                  {deltaFormatted}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-sans">vs. 7 days prior ({priorAvgSov}%)</p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Top Performing Engine */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-medium">
                  Top Performing Engine
                </span>
                <div className="h-8 w-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shadow-2xs">
                  <Award className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight flex items-baseline gap-1.5 flex-wrap">
                  <span>{topEngine.label}</span>
                  <span className="text-slate-400 font-normal text-sm">-</span>
                  <span className="font-mono text-emerald-600 text-xl font-bold">
                    {topEngine.score}% SOV
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-sans">Highest model visibility score</p>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Total Citations */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-medium">
                  Total Citations
                </span>
                <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
                  <Link2 className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-950 tracking-tight">
                  {totalCitationsCount} Active
                </div>
                <p className="text-xs text-slate-500 mt-1 font-sans">Referenced sources across answers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 1. HISTORICAL MULTI-LINE TREND CHART */}
        <PromptTrendChart data={trendData} queryText={prompt.query_text} />

        {/* 2. AI-GENERATED AUDIT REPORTS (generateObject with Intent Context) */}
        <AiReportView promptId={prompt.id} />

        {/* 3. RAW LLM OUTPUT ACCORDION VIEWER */}
        <RawOutputViewer runs={runs} />
      </div>
    </AppSidebarLayout>
  );
}
