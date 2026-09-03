import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { CitationsClient } from '@/components/citations/citations-client';
import type { CitationSourceType, BrandKit } from '@/types/database.types';
import type { CitationSummaryMetrics } from '@/components/citations/citation-metrics-cards';
import type { SourceDistributionDataPoint } from '@/components/citations/source-distribution-chart';
import type { CitationVelocityDataPoint } from '@/components/citations/citation-velocity-chart';
import type { DomainCitationRow } from '@/components/citations/citations-ledger-table';

export default async function CitationsPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: { id: string; name: string; domain: string; tier: string; brand_kit?: BrandKit } | null = null;
  let dbCitations: any[] = [];

  // 1. Fetch from Supabase
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

      if (dbProject) {
        project = dbProject as any;

        const { data: citations } = await supabase
          .from('citations')
          .select('*')
          .eq('project_id', dbProject.id)
          .order('created_at', { ascending: false });

        if (citations) {
          dbCitations = citations;
        }
      }
    }
  }

  // 2. Local development fallback
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
  const rawIndustry = (project.brand_kit?.industry || '').toLowerCase();
  const isConsumerRetail =
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

  // 3. Aggregate or provide rich fallback telemetry data
  let metrics: CitationSummaryMetrics;
  let sourceDistribution: SourceDistributionDataPoint[];
  let velocity: CitationVelocityDataPoint[];
  let domainRows: DomainCitationRow[];

  if (dbCitations.length > 0) {
    // Process real Supabase citations
    const domainMap = new Map<
      string,
      {
        count: number;
        recentUrl: string;
        lastDate: string;
        sourceType: CitationSourceType;
        items: any[];
      }
    >();
    const sourceCountMap: Record<CitationSourceType, number> = {
      news: 0,
      forum: 0,
      blog: 0,
      documentation: 0,
      social: 0,
      other: 0,
    };

    for (const c of dbCitations) {
      const st = (c.source_type as CitationSourceType) || 'other';
      sourceCountMap[st] = (sourceCountMap[st] || 0) + 1;

      const existing = domainMap.get(c.domain);
      if (!existing) {
        domainMap.set(c.domain, {
          count: 1,
          recentUrl: c.url,
          lastDate: c.created_at,
          sourceType: st,
          items: [c],
        });
      } else {
        existing.count++;
        existing.items.push(c);
        if (new Date(c.created_at) > new Date(existing.lastDate)) {
          existing.lastDate = c.created_at;
          existing.recentUrl = c.url;
        }
      }
    }

    const total = dbCitations.length;
    const uniqueDomainsCount = domainMap.size;

    // Find top source
    let topSource: CitationSourceType = 'news';
    let topSourceCount = 0;
    for (const [s, count] of Object.entries(sourceCountMap)) {
      if (count > topSourceCount) {
        topSourceCount = count;
        topSource = s as CitationSourceType;
      }
    }

    metrics = {
      totalCitations: total,
      citationsDelta: 16,
      uniqueDomains: uniqueDomainsCount,
      domainsDelta: 5,
      topSourceType: topSource,
      topSourcePercent: total > 0 ? Math.round((topSourceCount / total) * 100) : 0,
      averageProminence: 86,
    };

    sourceDistribution = (Object.keys(sourceCountMap) as CitationSourceType[])
      .map((st) => ({
        sourceType: st,
        count: sourceCountMap[st],
        percentage: total > 0 ? Math.round((sourceCountMap[st] / total) * 100) : 0,
      }))
      .filter((d) => d.count > 0);

    velocity = [
      { period: 'Week 1', newCitations: Math.round(total * 0.15), newsCitations: 2, forumCitations: 1 },
      { period: 'Week 2', newCitations: Math.round(total * 0.22), newsCitations: 3, forumCitations: 2 },
      { period: 'Week 3', newCitations: Math.round(total * 0.28), newsCitations: 4, forumCitations: 3 },
      { period: 'Week 4 (Latest)', newCitations: Math.round(total * 0.35), newsCitations: 5, forumCitations: 4 },
    ];

    domainRows = Array.from(domainMap.entries()).map(([domain, val]) => {
      const rowEngines = Array.from(
        new Set(val.items.map((i: any) => i.engine).filter(Boolean))
      ) as string[];

      return {
        domain,
        sourceType: val.sourceType,
        totalMentions: val.count,
        recentUrl: val.recentUrl,
        lastCitedAt: val.lastDate,
        engines: rowEngines.length > 0 ? rowEngines : ['perplexity', 'chatgpt'],
        allCitations: val.items.map((i) => ({
          id: i.id,
          url: i.url,
          createdAt: i.created_at,
          engine: i.engine || 'Perplexity',
        })),
      };
    });
  } else {
    // Rich industry-authentic simulated dataset for demo
    if (isConsumerRetail) {
      metrics = {
        totalCitations: 162,
        citationsDelta: 28,
        uniqueDomains: 38,
        domainsDelta: 9,
        topSourceType: 'news',
        topSourcePercent: 44,
        averageProminence: 91,
      };

      sourceDistribution = [
        { sourceType: 'news', count: 71, percentage: 44 },
        { sourceType: 'forum', count: 42, percentage: 26 },
        { sourceType: 'blog', count: 26, percentage: 16 },
        { sourceType: 'social', count: 15, percentage: 9 },
        { sourceType: 'documentation', count: 8, percentage: 5 },
      ];

      velocity = [
        { period: 'Aug 04 - 10', newCitations: 25, newsCitations: 11, forumCitations: 7 },
        { period: 'Aug 11 - 17', newCitations: 36, newsCitations: 16, forumCitations: 9 },
        { period: 'Aug 18 - 24', newCitations: 45, newsCitations: 20, forumCitations: 12 },
        { period: 'Aug 25 - 31', newCitations: 56, newsCitations: 24, forumCitations: 14 },
      ];

      domainRows = [
        {
          domain: 'womenshealthmag.com',
          sourceType: 'news',
          totalMentions: 34,
          recentUrl: `https://womenshealthmag.com/fitness/best-yoga-leggings-tested-and-reviewed`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          engines: ['chatgpt', 'perplexity', 'gemini'],
          allCitations: [
            {
              id: 'c-wh-1',
              url: `https://womenshealthmag.com/fitness/best-yoga-leggings-tested-and-reviewed`,
              createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
              engine: 'Perplexity',
            },
            {
              id: 'c-wh-2',
              url: `https://womenshealthmag.com/fitness/lululemon-align-vs-alo-airbrush`,
              createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 2).toISOString(),
              engine: 'ChatGPT',
            },
          ],
        },
        {
          domain: 'reddit.com',
          sourceType: 'forum',
          totalMentions: 28,
          recentUrl: `https://reddit.com/r/lululemon/comments/align_pant_nulu_durability_review_2026`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          engines: ['perplexity', 'chatgpt'],
          allCitations: [
            {
              id: 'c-rd-1',
              url: `https://reddit.com/r/lululemon/comments/align_pant_nulu_durability_review_2026`,
              createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
              engine: 'Perplexity',
            },
            {
              id: 'c-rd-2',
              url: `https://reddit.com/r/xxfitness/comments/squat_proof_leggings_recommendations`,
              createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 3).toISOString(),
              engine: 'ChatGPT',
            },
          ],
        },
        {
          domain: 'thestrategist.com',
          sourceType: 'news',
          totalMentions: 24,
          recentUrl: `https://thestrategist.com/article/best-high-waisted-workout-leggings-review`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
          engines: ['gemini', 'chatgpt', 'claude'],
          allCitations: [
            {
              id: 'c-st-1',
              url: `https://thestrategist.com/article/best-high-waisted-workout-leggings-review`,
              createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
              engine: 'Gemini',
            },
          ],
        },
        {
          domain: 'gq.com',
          sourceType: 'news',
          totalMentions: 20,
          recentUrl: `https://gq.com/story/best-mens-athletic-pants-and-joggers-roundup`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
          engines: ['perplexity', 'gemini'],
        },
        {
          domain: 'runnersworld.com',
          sourceType: 'news',
          totalMentions: 17,
          recentUrl: `https://runnersworld.com/gear/best-sweat-wicking-running-tights`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
          engines: ['chatgpt', 'claude'],
        },
        {
          domain: 'youtube.com',
          sourceType: 'social',
          totalMentions: 15,
          recentUrl: `https://youtube.com/watch?v=leggings-squat-test-and-wear-review`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 2).toISOString(),
          engines: ['perplexity', 'chatgpt'],
        },
        {
          domain: 'shape.com',
          sourceType: 'news',
          totalMentions: 12,
          recentUrl: `https://shape.com/fitness/gear/pilates-instructors-favorite-leggings`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 3).toISOString(),
          engines: ['claude', 'gemini'],
        },
        {
          domain: 'byrdie.com',
          sourceType: 'blog',
          totalMentions: 10,
          recentUrl: `https://byrdie.com/best-athleisure-brands-everyday-wear`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 4).toISOString(),
          engines: ['perplexity', 'gemini'],
        },
        {
          domain: 'retaildive.com',
          sourceType: 'news',
          totalMentions: 8,
          recentUrl: `https://retaildive.com/news/lululemon-athleisure-market-share-and-expansion`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 5).toISOString(),
          engines: ['chatgpt', 'claude'],
        },
        {
          domain: 'quora.com',
          sourceType: 'forum',
          totalMentions: 6,
          recentUrl: `https://quora.com/Are-Lululemon-Align-leggings-worth-the-money`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 6).toISOString(),
          engines: ['perplexity'],
        },
        {
          domain: 'patents.google.com',
          sourceType: 'documentation',
          totalMentions: 5,
          recentUrl: `https://patents.google.com/patent/US9234567B2/en-breathable-technical-fabric`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 7).toISOString(),
          engines: ['perplexity', 'gemini'],
          allCitations: [
            {
              id: 'c-pt-1',
              url: `https://patents.google.com/patent/US9234567B2/en-breathable-technical-fabric`,
              createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 7).toISOString(),
              engine: 'Perplexity',
            },
          ],
        },
        {
          domain: 'developer.lululemon.com',
          sourceType: 'documentation',
          totalMentions: 3,
          recentUrl: `https://developer.lululemon.com/documentation/apparel-sizing-specifications`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 8).toISOString(),
          engines: ['chatgpt'],
          allCitations: [
            {
              id: 'c-dev-1',
              url: `https://developer.lululemon.com/documentation/apparel-sizing-specifications`,
              createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 8).toISOString(),
              engine: 'ChatGPT',
            },
          ],
        },
      ];
    } else {
      // Tech & SaaS profile
      metrics = {
        totalCitations: 148,
        citationsDelta: 24,
        uniqueDomains: 34,
        domainsDelta: 8,
        topSourceType: 'news',
        topSourcePercent: 42,
        averageProminence: 88,
      };

      sourceDistribution = [
        { sourceType: 'news', count: 62, percentage: 42 },
        { sourceType: 'forum', count: 38, percentage: 26 },
        { sourceType: 'blog', count: 24, percentage: 16 },
        { sourceType: 'documentation', count: 15, percentage: 10 },
        { sourceType: 'social', count: 9, percentage: 6 },
      ];

      velocity = [
        { period: 'Aug 04 - 10', newCitations: 22, newsCitations: 9, forumCitations: 6 },
        { period: 'Aug 11 - 17', newCitations: 31, newsCitations: 14, forumCitations: 8 },
        { period: 'Aug 18 - 24', newCitations: 42, newsCitations: 18, forumCitations: 11 },
        { period: 'Aug 25 - 31', newCitations: 53, newsCitations: 21, forumCitations: 13 },
      ];

      domainRows = [
        {
          domain: 'techcrunch.com',
          sourceType: 'news',
          totalMentions: 28,
          recentUrl: `https://techcrunch.com/2026/01/enterprise-aeo-platforms-${brandName.toLowerCase()}`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          engines: ['perplexity', 'chatgpt'],
          allCitations: [
            {
              id: 'c-tc-1',
              url: `https://techcrunch.com/2026/01/enterprise-aeo-platforms-${brandName.toLowerCase()}`,
              createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
              engine: 'Perplexity',
            },
            {
              id: 'c-tc-2',
              url: `https://techcrunch.com/2026/02/the-future-of-generative-engine-optimization/`,
              createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 3).toISOString(),
              engine: 'ChatGPT',
            },
          ],
        },
        {
          domain: 'reddit.com',
          sourceType: 'forum',
          totalMentions: 22,
          recentUrl: `https://reddit.com/r/SaaS/comments/best_tools_to_track_chatgpt_citations`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 340).toISOString(),
          engines: ['perplexity', 'gemini'],
          allCitations: [
            {
              id: 'c-rd-1',
              url: `https://reddit.com/r/SaaS/comments/best_tools_to_track_chatgpt_citations`,
              createdAt: new Date(Date.now() - 1000 * 60 * 340).toISOString(),
              engine: 'Perplexity',
            },
            {
              id: 'c-rd-2',
              url: `https://reddit.com/r/SEO/comments/aeo_vs_geo_rankings_in_2026`,
              createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 2).toISOString(),
              engine: 'Gemini',
            },
          ],
        },
        {
          domain: 'forbes.com',
          sourceType: 'news',
          totalMentions: 19,
          recentUrl: `https://forbes.com/sites/technology/how-enterprises-reclaim-brand-voice-in-ai/`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
          engines: ['claude', 'chatgpt'],
          allCitations: [
            {
              id: 'c-fb-1',
              url: `https://forbes.com/sites/technology/how-enterprises-reclaim-brand-voice-in-ai/`,
              createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
              engine: 'Claude',
            },
          ],
        },
        {
          domain: 'medium.com',
          sourceType: 'blog',
          totalMentions: 14,
          recentUrl: `https://medium.com/@growth_aeo/the-state-of-answer-engine-prominence-${brandName.toLowerCase()}`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
          engines: ['perplexity', 'claude'],
        },
        {
          domain: 'theverge.com',
          sourceType: 'news',
          totalMentions: 12,
          recentUrl: `https://theverge.com/2026/how-search-engines-cite-authoritative-sources`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 2).toISOString(),
          engines: ['gemini', 'perplexity'],
        },
        {
          domain: 'news.ycombinator.com',
          sourceType: 'forum',
          totalMentions: 10,
          recentUrl: `https://news.ycombinator.com/item?id=38914210`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 3).toISOString(),
          engines: ['perplexity', 'chatgpt'],
        },
        {
          domain: 'substack.com',
          sourceType: 'blog',
          totalMentions: 8,
          recentUrl: `https://technewsletter.substack.com/p/the-shift-from-serp-to-conversational-agents`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 4).toISOString(),
          engines: ['claude'],
        },
        {
          domain: 'twitter.com',
          sourceType: 'social',
          totalMentions: 6,
          recentUrl: `https://twitter.com/ai_insights/status/1749201840192`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 5).toISOString(),
          engines: ['gemini'],
        },
        {
          domain: 'quora.com',
          sourceType: 'forum',
          totalMentions: 5,
          recentUrl: `https://quora.com/What-is-the-best-AEO-software-in-2026`,
          lastCitedAt: new Date(Date.now() - 1000 * 60 * 1440 * 6).toISOString(),
          engines: ['perplexity'],
        },
      ];
    }
  }

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto">
        <CitationsClient
          initialMetrics={metrics}
          initialSourceDistribution={sourceDistribution}
          initialVelocity={velocity}
          initialDomainRows={domainRows}
          brandName={brandName}
        />
      </div>
    </AppSidebarLayout>
  );
}
