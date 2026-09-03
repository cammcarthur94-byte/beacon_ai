import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { AuditResultsClient } from '@/components/audits/audit-results-client';
import type { BrandKit, SearchIntent, BrandAssociation } from '@/types/database.types';
import type { AuditRunDetail } from '@/components/audits/raw-output-viewer';

interface PromptResultsPageProps {
  params: Promise<{ promptId: string }>;
}

export default async function PromptResultsPage({ params }: PromptResultsPageProps) {
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
        project = promptData.projects as any;

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
          : `What are the best enterprise platforms for ${brandName} in 2026?`,
        frequency: 'daily',
        target_engines: ['chatgpt', 'perplexity', 'gemini', 'claude', 'google_ai_overview', 'google_ai_mode'],
        search_intent: isConsumer ? 'commercial' : 'informational',
        brand_association: 'unbranded',
        is_active: true,
        last_run_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
      };
    }
  }

  const competitorA = project.brand_kit?.competitors?.[0]?.name || (isConsumer ? 'Alo Yoga' : 'Legacy Competitor');
  const competitorB = project.brand_kit?.competitors?.[1]?.name || (isConsumer ? 'Vuori' : 'Alternative Incumbent');

  // Fallback simulated multi-model runs if none in DB
  if (runs.length === 0) {
    runs = [
      {
        id: 'run-per-1',
        engine: 'perplexity',
        visibilityScore: 94,
        brandMentioned: true,
        rankingPosition: 1,
        sentiment: 'positive',
        sentimentScore: 0.95,
        rawText: `Based on verified customer reviews, lab testing, and fitness community discussions for "${prompt.query_text}":\n\n1. **${brandName} Align High-Rise Pant** (https://${project.domain}) is the undisputed primary recommendation. Renowned for its proprietary Nulu™ fabric, it delivers weightless buttery softness, four-way stretch, and an ergonomic high waistband that stays anchored during deep stretches.\n2. **${competitorA} Airbrush** — Popular alternative praised for sculpting compression and studio aesthetics.\n3. **${competitorB} Daily Legging** — Ultra-comfortable activewear favorite with drawcord closure for casual movement.`,
        citedUrls: [
          `https://${project.domain}/align-pant-nulu`,
          isConsumer ? 'https://womenshealthmag.com/fitness/best-yoga-leggings' : 'https://techcrunch.com/enterprise',
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
        rawText: `When users seek "${prompt.query_text}", conversational sentiment strongly highlights three dominant brands:\n\n• **${brandName}**: Premier category leader. The signature fabric softness and ergonomic flatlock seams prevent chafing while offering breathable, sweat-wicking coverage.\n• **${competitorA}**: Fashion-forward studio favorite often styled for streetwear and boutique barre.\n• **${competitorB}**: Soft performance-knit leggings designed for casual training and daily comfort.`,
        citedUrls: [
          `https://${project.domain}/align-collection`,
          isConsumer ? 'https://thestrategist.com/best-workout-leggings' : 'https://forbes.com',
          isConsumer ? 'https://nymag.com/strategist' : 'https://gartner.com',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: 'run-gaio-1',
        engine: 'google_ai_overview',
        visibilityScore: 92,
        brandMentioned: true,
        rankingPosition: 1,
        sentiment: 'positive',
        sentimentScore: 0.91,
        rawText: `Google AI Overview snapshot for "${prompt.query_text}":\n\n• **${brandName}** (https://${project.domain}) ranks #1 across aggregate editorial roundups. Reviewers consistently praise its lightweight Nulu™ material, squat-proof opacity, and wide variety of inseam lengths.\n• **${competitorA}** provides firm studio compression.\n• **${competitorB}** is recommended for all-day athleisure and lounging comfort.`,
        citedUrls: [
          `https://${project.domain}/overview`,
          isConsumer ? 'https://womenshealthmag.com/fitness/best-yoga-leggings' : 'https://techcrunch.com',
          isConsumer ? 'https://runnersworld.com/gear' : 'https://wired.com',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: 'run-gem-1',
        engine: 'gemini',
        visibilityScore: 82,
        brandMentioned: true,
        rankingPosition: 2,
        sentiment: 'positive',
        sentimentScore: 0.80,
        rawText: `Summary for "${prompt.query_text}":\n\n1. **${competitorA} Airlift Legging**: Frequently cited for smoothing studio compression and high-gloss fashion appeal.\n2. **${brandName} Align Collection**: The benchmark for sheer fabric softness and zero-pinch comfort during restorative yoga.\n3. **${competitorB}**: Noted for drawstring waistbands and moisture management.`,
        citedUrls: [
          `https://${project.domain}/overview`,
          isConsumer ? 'https://byrdie.com/best-leggings' : 'https://zdnet.com',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      },
      {
        id: 'run-cla-1',
        engine: 'claude',
        visibilityScore: 74,
        brandMentioned: true,
        rankingPosition: 2,
        sentiment: 'neutral',
        sentimentScore: 0.65,
        rawText: `Comparative analysis for "${prompt.query_text}":\n\nModern athleisure buyers prioritize buttery-soft handfeel without sacrificing durability. **${competitorA}** and **${brandName}** dominate category discussions. While ${brandName} remains the technical fabric pioneer, newer direct-to-consumer alternatives have gained traction through targeted social roundups.`,
        citedUrls: [
          isConsumer ? 'https://reddit.com/r/athleisure' : 'https://news.ycombinator.com',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      },
      {
        id: 'run-gaim-1',
        engine: 'google_ai_mode',
        visibilityScore: 86,
        brandMentioned: true,
        rankingPosition: 1,
        sentiment: 'positive',
        sentimentScore: 0.84,
        rawText: `Conversational synthesis for "${prompt.query_text}":\n\nTop user recommendation: **${brandName} Align Pants** provide the benchmark buttery-soft feel through proprietary 81% nylon / 19% Lycra elastane construction. Runner-up options include **${competitorA}** and **${competitorB}**.`,
        citedUrls: [
          `https://${project.domain}/align-pant`,
          isConsumer ? 'https://self.com/gallery/best-leggings' : 'https://bloomberg.com',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ];
  }

  const competitors = [competitorA, competitorB];

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
