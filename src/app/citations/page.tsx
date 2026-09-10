import * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { CitationsClient } from '@/components/citations/citations-client';
import type { CitationSourceType, BrandKit } from '@/types/database.types';
import type { CitationSummaryMetrics } from '@/components/citations/citation-metrics-cards';
import type { SourceDistributionDataPoint } from '@/components/citations/source-distribution-chart';
import type { CitationVelocityDataPoint } from '@/components/citations/citation-velocity-chart';
import type { DomainCitationRow } from '@/components/citations/citations-ledger-table';
import { parseActiveProjectCookie, isLegacyMockProject } from '@/lib/project-utils';
import { isOwnedDomain } from '@/lib/citations/categorizer';
import { getDemoPrompts, generateContextualAuditRuns } from '@/lib/demo-prompts';

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

      if (dbProject && !isLegacyMockProject(dbProject)) {
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
      project = parseActiveProjectCookie(projectCookie.value);
    }
  }

  if (!project) {
    redirect('/onboarding');
  }

  const brandName = project.name || 'My Brand';
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
    brandName.toLowerCase().includes('nike');

  // Local demo fallback: Extract citations from prompt runs
  if (dbCitations.length === 0 && project) {
    const demoPrompts = getDemoPrompts(cookieStore, project);
    const extractedCitations: any[] = [];
    demoPrompts.forEach((dp) => {
      const pRuns = dp.runs && dp.runs.length > 0 ? dp.runs : generateContextualAuditRuns(dp, project);
      pRuns.forEach((r) => {
        (r.citedUrls || []).forEach((u, idx) => {
          let domain = 'web';
          let st: CitationSourceType = 'blog';
          try {
            domain = new URL(u).hostname.replace(/^www\./, '');
          } catch {}
          if (domain.includes('reddit') || domain.includes('trustpilot')) st = 'forum';
          else if (domain.includes('techcrunch') || domain.includes('forbes') || domain.includes('bloomberg') || domain.includes('news')) st = 'news';
          else if (domain.includes('docs') || domain.includes('github')) st = 'documentation';
          else if (domain.includes('youtube') || domain.includes('twitter') || domain.includes('instagram')) st = 'social';

          extractedCitations.push({
            id: `${r.id}-cit-${idx}`,
            project_id: project.id,
            url: u,
            domain,
            source_type: st,
            engine: r.engine,
            created_at: r.createdAt || new Date().toISOString(),
          });
        });
      });
    });
    dbCitations = extractedCitations;
  }

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
        isOwned: boolean;
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
      const owned = isOwnedDomain(c.domain, project.domain);
      sourceCountMap[st] = (sourceCountMap[st] || 0) + 1;

      const existing = domainMap.get(c.domain);
      if (!existing) {
        domainMap.set(c.domain, {
          count: 1,
          recentUrl: c.url,
          lastDate: c.created_at,
          sourceType: st,
          items: [c],
          isOwned: owned,
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
        isOwned: val.isOwned,
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
    metrics = {
      totalCitations: 0,
      citationsDelta: 0,
      uniqueDomains: 0,
      domainsDelta: 0,
      topSourceType: 'None' as any,
      topSourcePercent: 0,
      averageProminence: 0,
    };
    sourceDistribution = [];
    velocity = [];
    domainRows = [];
  }

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-[1400px] w-full mx-auto">
        <React.Suspense fallback={<div className="h-40 animate-pulse bg-slate-50 rounded-2xl" />}>
          <CitationsClient
            initialMetrics={metrics}
            initialSourceDistribution={sourceDistribution}
            initialVelocity={velocity}
            initialDomainRows={domainRows}
          />
        </React.Suspense>
      </div>
    </AppSidebarLayout>
  );
}
