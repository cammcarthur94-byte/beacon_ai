import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { BrandKit } from '@/types/database.types';

export interface CompetitorSovEntry {
  id: string;
  name: string;
  domain: string;
  isCurrentBrand: boolean;
  rank: number;
  previousRank: number;
  totalCitations: number;
  citationShare: number;
  sovScore: number;
  weeklyDelta: number;
  monthlyDelta: number;
  engineBreakdown: {
    chatgpt: { citations: number; share: number };
    gemini: { citations: number; share: number };
    claude: { citations: number; share: number };
    perplexity: { citations: number; share: number };
    google_ai_overview: { citations: number; share: number };
    google_ai_mode: { citations: number; share: number };
  };
  dominantKeywords: string[];
  topCitedSources: string[];
  sentimentScore: number;
}

export interface LeaderboardResponse {
  success: boolean;
  brandName: string;
  domain: string;
  industry: string;
  availableVerticals: string[];
  selectedVertical: string;
  selectedEngine: string;
  timeframe: string;
  metrics: {
    totalIndustryCitations: number;
    brandRank: number;
    brandSovShare: number;
    brandSovDeltaWeekly: number;
    marketLeaderName: string;
    marketLeaderShare: number;
    activeTrackedPrompts: number;
  };
  leaderboard: CompetitorSovEntry[];
  lastCalculatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedVertical = searchParams.get('vertical') || 'all';
    const selectedEngine = searchParams.get('engine') || 'all';
    const timeframe = searchParams.get('timeframe') || '7d';

    const cookieStore = await cookies();
    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    let project: { id: string; name: string; domain: string; tier: string; brand_kit?: BrandKit } | null = null;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dbProject } = await supabase
          .from('projects')
          .select('id, name, domain, tier, brand_kit')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (dbProject) project = dbProject as any;
      }
    }

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

    const fallbackProject = {
      id: 'demo-project-lululemon',
      name: 'Lululemon',
      domain: 'lululemon.com',
      tier: 'enterprise',
      brand_kit: {
        industry: 'Premium Athleisure & Athletic Apparel',
        target_audience: 'Fitness enthusiasts and premium athletic apparel shoppers',
        core_offerings: 'Yoga pants, activewear, technical athletic apparel',
        tone_of_voice: 'Inspiring, active, technical, mindful',
        competitors: [
          { name: 'Alo Yoga', domain: 'aloyoga.com' },
          { name: 'Vuori', domain: 'vuoriclothing.com' },
          { name: 'Athleta', domain: 'athleta.gap.com' },
        ],
      },
    };

    const activeProject = project || fallbackProject;
    const brandName = activeProject.name;
    const brandDomain = activeProject.domain;
    const competitors = activeProject.brand_kit?.competitors || fallbackProject.brand_kit.competitors;

    let dbCitations: any[] = [];
    if (supabaseUrl && !supabaseUrl.includes('placeholder') && project?.id) {
      const { data } = await supabase
        .from('citations')
        .select('*')
        .eq('project_id', project.id);
      if (data && data.length > 0) {
        dbCitations = data;
      }
    }

    const availableVerticals = [
      'All Verticals',
      'Premium Athleisure & Activewear',
      'B2B SaaS / FinTech',
      'Health & Longevity Supplements',
      'Consumer Electronics & Tech',
    ];

    const c1 = competitors[0]?.name || 'Alo Yoga';
    const c1Domain = competitors[0]?.domain || 'aloyoga.com';
    const c2 = competitors[1]?.name || 'Vuori';
    const c2Domain = competitors[1]?.domain || 'vuoriclothing.com';
    const c3 = competitors[2]?.name || 'Athleta';
    const c3Domain = competitors[2]?.domain || 'athleta.gap.com';

    let rawEntries: CompetitorSovEntry[] = [
      {
        id: 'brand-self',
        name: brandName,
        domain: brandDomain,
        isCurrentBrand: true,
        rank: 1,
        previousRank: 2,
        totalCitations: 1420 + dbCitations.length * 15,
        citationShare: 37.4,
        sovScore: 88.5,
        weeklyDelta: +4.2,
        monthlyDelta: +9.1,
        engineBreakdown: {
          chatgpt: { citations: 420, share: 39.2 },
          gemini: { citations: 380, share: 36.8 },
          claude: { citations: 290, share: 38.4 },
          perplexity: { citations: 190, share: 34.5 },
          google_ai_overview: { citations: 90, share: 36.0 },
          google_ai_mode: { citations: 50, share: 40.0 },
        },
        dominantKeywords: ['best workout leggings', 'align pant review', 'technical commuter trousers', 'studio yoga gear'],
        topCitedSources: ['nytimes.com/wirecutter', 'runnersworld.com', 'goodhousekeeping.com', 'vogue.com'],
        sentimentScore: 0.84,
      },
      {
        id: 'comp-1',
        name: c1,
        domain: c1Domain,
        isCurrentBrand: false,
        rank: 2,
        previousRank: 1,
        totalCitations: 1180,
        citationShare: 31.1,
        sovScore: 76.2,
        weeklyDelta: -1.8,
        monthlyDelta: +2.4,
        engineBreakdown: {
          chatgpt: { citations: 340, share: 31.7 },
          gemini: { citations: 310, share: 30.0 },
          claude: { citations: 240, share: 31.8 },
          perplexity: { citations: 180, share: 32.7 },
          google_ai_overview: { citations: 75, share: 30.0 },
          google_ai_mode: { citations: 35, share: 28.0 },
        },
        dominantKeywords: ['celebrity athleisure', 'airlift leggings', 'aspen streetwear drop', 'pilates sets'],
        topCitedSources: ['popsugar.com', 'whowhatwear.com', 'elle.com', 'shape.com'],
        sentimentScore: 0.72,
      },
      {
        id: 'comp-2',
        name: c2,
        domain: c2Domain,
        isCurrentBrand: false,
        rank: 3,
        previousRank: 3,
        totalCitations: 740,
        citationShare: 19.5,
        sovScore: 58.4,
        weeklyDelta: +2.1,
        monthlyDelta: +5.6,
        engineBreakdown: {
          chatgpt: { citations: 210, share: 19.6 },
          gemini: { citations: 200, share: 19.4 },
          claude: { citations: 150, share: 19.9 },
          perplexity: { citations: 110, share: 20.0 },
          google_ai_overview: { citations: 45, share: 18.0 },
          google_ai_mode: { citations: 25, share: 20.0 },
        },
        dominantKeywords: ['mens travel pant', 'meta pant review', 'dreamknit softness', 'california casual'],
        topCitedSources: ['gq.com', 'gearpatrol.com', 'menshealth.com', 'wsj.com/buyside'],
        sentimentScore: 0.79,
      },
      {
        id: 'comp-3',
        name: c3,
        domain: c3Domain,
        isCurrentBrand: false,
        rank: 4,
        previousRank: 4,
        totalCitations: 455,
        citationShare: 12.0,
        sovScore: 42.1,
        weeklyDelta: -0.9,
        monthlyDelta: -3.2,
        engineBreakdown: {
          chatgpt: { citations: 102, share: 9.5 },
          gemini: { citations: 142, share: 13.8 },
          claude: { citations: 75, share: 9.9 },
          perplexity: { citations: 71, share: 12.8 },
          google_ai_overview: { citations: 40, share: 16.0 },
          google_ai_mode: { citations: 15, share: 12.0 },
        },
        dominantKeywords: ['petite yoga pants', 'size inclusive activewear', 'b-corp athletic wear', 'powervita tights'],
        topCitedSources: ['health.com', 'self.com', 'forbes.com/vetted', 'realsimple.com'],
        sentimentScore: 0.68,
      },
    ];

    if (selectedEngine !== 'all') {
      const eng = selectedEngine as keyof CompetitorSovEntry['engineBreakdown'];
      const totalEngineCitations = rawEntries.reduce(
        (acc, entry) => acc + (entry.engineBreakdown[eng]?.citations || 0),
        0
      );

      rawEntries = rawEntries.map((entry) => {
        const engCitations = entry.engineBreakdown[eng]?.citations || 0;
        const newShare = totalEngineCitations > 0
          ? Number(((engCitations / totalEngineCitations) * 100).toFixed(1))
          : 0;
        return {
          ...entry,
          totalCitations: engCitations,
          citationShare: newShare,
          sovScore: Math.round(newShare * 2.2),
        };
      });

      rawEntries.sort((a, b) => b.totalCitations - a.totalCitations);
      rawEntries = rawEntries.map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
    }

    const brandEntry = rawEntries.find((e) => e.isCurrentBrand) || rawEntries[0];
    const leaderEntry = rawEntries[0];
    const totalIndustryCitations = rawEntries.reduce((sum, e) => sum + e.totalCitations, 0);

    const payload: LeaderboardResponse = {
      success: true,
      brandName,
      domain: brandDomain,
      industry: activeProject.brand_kit?.industry || 'Premium Athleisure & Athletic Apparel',
      availableVerticals,
      selectedVertical,
      selectedEngine,
      timeframe,
      metrics: {
        totalIndustryCitations,
        brandRank: brandEntry.rank,
        brandSovShare: brandEntry.citationShare,
        brandSovDeltaWeekly: brandEntry.weeklyDelta,
        marketLeaderName: leaderEntry.name,
        marketLeaderShare: leaderEntry.citationShare,
        activeTrackedPrompts: 38,
      },
      leaderboard: rawEntries,
      lastCalculatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Error in /api/leaderboard GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
