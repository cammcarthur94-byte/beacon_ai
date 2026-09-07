import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { BrandKit } from '@/types/database.types';
import {
  getAllTrackedAndDiscoveredCompetitors,
  type DiscoveredCompetitorItem,
} from '@/lib/competitors/discovered-competitors';
import { parseActiveProjectCookie, isLegacyMockProject } from '@/lib/project-utils';

export interface CompetitorSovEntry {
  id: string;
  name: string;
  domain: string;
  isCurrentBrand: boolean;
  isUnlisted?: boolean;
  rank: number;
  previousRank: number;
  totalCitations: number;
  citationShare: number;
  sovScore: number;
  weeklyDelta: number;
  monthlyDelta: number;
  engineBreakdown: {
    chatgpt: { citations: number; share: number };
    copilot: { citations: number; share: number };
    copilot_search: { citations: number; share: number };
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
        project = parseActiveProjectCookie(projectCookie.value);
        if (!project) {
          cookieStore.delete('beacon_active_project');
        }
      }
    } else if (isLegacyMockProject(project)) {
      project = null;
    }

    const fallbackProject = {
      id: 'default-workspace-project',
      name: 'My Brand',
      domain: 'example.com',
      tier: 'enterprise',
      brand_kit: {
        industry: 'Technology & Business',
        target_audience: 'Modern enterprise teams and decision makers',
        core_offerings: 'Autonomous AI Search & Brand Optimization',
        tone_of_voice: 'Professional, Authoritative, and Direct',
        competitors: [],
      },
    };

    const activeProject = project || fallbackProject;
    const brandName = activeProject.name;
    const brandDomain = activeProject.domain;
    const industry = activeProject.brand_kit?.industry || 'Technology & Business';

    let dbCitations: any[] = [];
    if (supabaseUrl && !supabaseUrl.includes('placeholder') && activeProject?.id) {
      const { data } = await supabase
        .from('citations')
        .select('*')
        .eq('project_id', activeProject.id);
      if (data && data.length > 0) {
        dbCitations = data;
      }
    }

    let activeTrackedPrompts = 0;
    if (supabaseUrl && !supabaseUrl.includes('placeholder') && activeProject?.id) {
      const { count } = await supabase
        .from('prompts')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', activeProject.id);
      if (typeof count === 'number') {
        activeTrackedPrompts = count;
      }
    }
    if (activeTrackedPrompts === 0) {
      const demoPromptsCookie = cookieStore.get('beacon_demo_prompts');
      if (demoPromptsCookie?.value) {
        try {
          const list = JSON.parse(demoPromptsCookie.value);
          if (Array.isArray(list)) activeTrackedPrompts = list.length;
        } catch {}
      }
    }

    const availableVerticals = [
      'All Verticals',
      'Technology & Enterprise SaaS',
      'AI & Machine Learning Infrastructure',
      'Consumer Electronics & Hardware',
      'Financial Technology & Banking',
      'Health, Wellness & BioTech',
    ];

    // 1. Read dynamically discovered competitors from cookies (AI crawls, audits, or session)
    const discoveredCookie = cookieStore.get('beacon_ai_discovered_competitors');
    let extraDiscovered: DiscoveredCompetitorItem[] = [];
    if (discoveredCookie?.value) {
      try {
        extraDiscovered = JSON.parse(discoveredCookie.value);
      } catch {}
    }

    // 2. Resolve all competitors: configured brand kit competitors + extra AI-discovered
    const resolvedCompetitors = getAllTrackedAndDiscoveredCompetitors({
      brandKit: activeProject.brand_kit,
      brandName,
      industry,
      extraDiscovered,
    });

    const engines = [
      'chatgpt',
      'copilot',
      'copilot_search',
      'gemini',
      'claude',
      'perplexity',
      'google_ai_overview',
      'google_ai_mode',
    ] as const;

    const createEmptyEngineBreakdown = () => ({
      chatgpt: { citations: 0, share: 0 },
      copilot: { citations: 0, share: 0 },
      copilot_search: { citations: 0, share: 0 },
      gemini: { citations: 0, share: 0 },
      claude: { citations: 0, share: 0 },
      perplexity: { citations: 0, share: 0 },
      google_ai_overview: { citations: 0, share: 0 },
      google_ai_mode: { citations: 0, share: 0 },
    });

    const brandEntry: CompetitorSovEntry = {
      id: 'brand-self',
      name: brandName,
      domain: brandDomain,
      isCurrentBrand: true,
      isUnlisted: false,
      rank: 1,
      previousRank: 1,
      totalCitations: 0,
      citationShare: 0,
      sovScore: 0,
      weeklyDelta: 0,
      monthlyDelta: 0,
      engineBreakdown: createEmptyEngineBreakdown(),
      dominantKeywords: [],
      topCitedSources: [],
      sentimentScore: 0,
    };

    const competitorEntries: CompetitorSovEntry[] = resolvedCompetitors.map((comp, idx) => ({
      id: `comp-${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: comp.name,
      domain: comp.domain,
      isCurrentBrand: false,
      isUnlisted: comp.isUnlisted || false,
      rank: idx + 2,
      previousRank: idx + 2,
      totalCitations: 0,
      citationShare: 0,
      sovScore: 0,
      weeklyDelta: 0,
      monthlyDelta: 0,
      engineBreakdown: createEmptyEngineBreakdown(),
      dominantKeywords: [],
      topCitedSources: [],
      sentimentScore: 0,
    }));

    let rawEntries: CompetitorSovEntry[] = [brandEntry, ...competitorEntries];

    if (dbCitations.length > 0) {
      const brandDomainClean = (brandDomain || '').toLowerCase().replace(/^www\./, '');
      const brandNameLower = (brandName || '').toLowerCase();

      dbCitations.forEach((cit) => {
        const citDomain = (cit.domain || '').toLowerCase().replace(/^www\./, '');
        const citUrl = (cit.url || '').toLowerCase();
        const citEngine = (cit.engine || '').toLowerCase() as typeof engines[number];

        const isBrand =
          (brandDomainClean && (citDomain.includes(brandDomainClean) || citUrl.includes(brandDomainClean))) ||
          (brandNameLower && citUrl.includes(brandNameLower));

        if (isBrand) {
          brandEntry.totalCitations += 1;
          if (engines.includes(citEngine)) {
            brandEntry.engineBreakdown[citEngine].citations += 1;
          }
          if (citDomain && !brandEntry.topCitedSources.includes(citDomain)) {
            brandEntry.topCitedSources.push(citDomain);
          }
        } else {
          for (const comp of competitorEntries) {
            const compDomainClean = (comp.domain || '').toLowerCase().replace(/^www\./, '');
            const compNameLower = comp.name.toLowerCase();
            if (
              (compDomainClean && (citDomain.includes(compDomainClean) || citUrl.includes(compDomainClean))) ||
              (compNameLower && citUrl.includes(compNameLower))
            ) {
              comp.totalCitations += 1;
              if (engines.includes(citEngine)) {
                comp.engineBreakdown[citEngine].citations += 1;
              }
              if (citDomain && !comp.topCitedSources.includes(citDomain)) {
                comp.topCitedSources.push(citDomain);
              }
              break;
            }
          }
        }
      });
    }

    const totalIndustryCitations = rawEntries.reduce(
      (sum, e) => sum + e.totalCitations,
      0
    );

    // Compute shares across each engine
    engines.forEach((eng) => {
      const sum = rawEntries.reduce(
        (acc, e) => acc + (e.engineBreakdown[eng]?.citations || 0),
        0
      );
      rawEntries.forEach((e) => {
        const cits = e.engineBreakdown[eng]?.citations || 0;
        e.engineBreakdown[eng].share =
          sum > 0 ? Number(((cits / sum) * 100).toFixed(1)) : 0;
      });
    });

    rawEntries.forEach((entry) => {
      entry.citationShare =
        totalIndustryCitations > 0
          ? Number(((entry.totalCitations / totalIndustryCitations) * 100).toFixed(1))
          : 0;
      entry.sovScore = totalIndustryCitations > 0 ? Math.min(100, Math.round(entry.citationShare)) : 0;
    });

    if (totalIndustryCitations > 0) {
      rawEntries.sort((a, b) => b.totalCitations - a.totalCitations);
      rawEntries.forEach((entry, idx) => {
        entry.rank = idx + 1;
        entry.previousRank = idx + 1;
      });
    }

    if (selectedEngine !== 'all') {
      const eng = selectedEngine as keyof CompetitorSovEntry['engineBreakdown'];
      const totalEngineCitations = rawEntries.reduce(
        (acc, entry) => acc + (entry.engineBreakdown[eng]?.citations || 0),
        0
      );

      rawEntries = rawEntries.map((entry) => {
        const engCitations = entry.engineBreakdown[eng]?.citations || 0;
        const newShare =
          totalEngineCitations > 0
            ? Number(((engCitations / totalEngineCitations) * 100).toFixed(1))
            : 0;
        return {
          ...entry,
          totalCitations: engCitations,
          citationShare: newShare,
          sovScore: totalEngineCitations > 0 ? Math.round(newShare) : 0,
        };
      });

      if (totalEngineCitations > 0) {
        rawEntries.sort((a, b) => b.totalCitations - a.totalCitations);
        rawEntries = rawEntries.map((entry, idx) => ({
          ...entry,
          rank: idx + 1,
        }));
      }
    }

    const brandEntryResult = rawEntries.find((e) => e.isCurrentBrand) || rawEntries[0];
    const leaderEntry = rawEntries[0];
    const activeTotalCitations = rawEntries.reduce((sum, e) => sum + e.totalCitations, 0);

    const payload: LeaderboardResponse = {
      success: true,
      brandName,
      domain: brandDomain,
      industry,
      availableVerticals,
      selectedVertical,
      selectedEngine,
      timeframe,
      metrics: {
        totalIndustryCitations: activeTotalCitations,
        brandRank: brandEntryResult ? brandEntryResult.rank : 1,
        brandSovShare: brandEntryResult ? brandEntryResult.citationShare : 0,
        brandSovDeltaWeekly: brandEntryResult ? brandEntryResult.weeklyDelta : 0,
        marketLeaderName: activeTotalCitations > 0 && leaderEntry ? leaderEntry.name : brandName,
        marketLeaderShare: activeTotalCitations > 0 && leaderEntry ? leaderEntry.citationShare : 0,
        activeTrackedPrompts,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domain, isUnlisted = true } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Competitor name is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const existingCookie = cookieStore.get('beacon_ai_discovered_competitors');
    let discovered: DiscoveredCompetitorItem[] = [];
    if (existingCookie?.value) {
      try {
        discovered = JSON.parse(existingCookie.value);
      } catch {}
    }

    const cleanDomain =
      domain || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const exists = discovered.some(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    if (!exists) {
      discovered.push({
        name: name.trim(),
        domain: cleanDomain,
        isUnlisted,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: `Competitor "${name}" added to leaderboard`,
      added: { name: name.trim(), domain: cleanDomain, isUnlisted },
      allDiscovered: discovered,
    });

    response.cookies.set('beacon_ai_discovered_competitors', JSON.stringify(discovered), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Error in /api/leaderboard POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
