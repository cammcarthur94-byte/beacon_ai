import type { BrandKit } from '@/types/database.types';
import type { MultiLineSovDataPoint, CompetitorMeta } from '@/components/dashboard/sov-trend-chart';
import type { RecentAuditRun } from '@/components/dashboard/recent-activity-table';

export const COMPETITOR_PALETTE = [
  '#e37400', // Amber
  '#12b5cb', // Cyan
  '#7c3aed', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f59e0b', // Warm Gold
  '#10b981', // Emerald
  '#6366f1', // Indigo
];

export interface KnownCompetitorCandidate {
  name: string;
  domain: string;
  aliases: string[];
  baseSov: number;
}

export interface ResolveCompetitorsParams {
  brandKit?: BrandKit | null;
  runs: RecentAuditRun[];
  isConsumer: boolean;
  brandName: string;
  fullSovTrendData: {
    '7d': MultiLineSovDataPoint[];
    '30d': MultiLineSovDataPoint[];
    '90d': MultiLineSovDataPoint[];
  };
}

/**
 * Resolves all competitors to be shown in visuals and metrics.
 * Uses explicitly configured brand profile competitors without synthetic or preset injections.
 */
export function resolveCompetitorsWithAiResults({
  brandKit,
  runs,
  fullSovTrendData,
}: ResolveCompetitorsParams) {
  const profileCompetitors = brandKit?.competitors || [];
  const competitorsList: CompetitorMeta[] = [];

  profileCompetitors.forEach((c, idx) => {
    if (!c.name || !c.name.trim()) return;
    const trimmed = c.name.trim();
    const id = `comp${idx + 1}`;
    competitorsList.push({
      id,
      name: trimmed,
      color: COMPETITOR_PALETTE[idx % COMPETITOR_PALETTE.length],
      isUnlisted: false,
    });
  });

  // Annotate each RecentAuditRun with competitors mentioned in that run
  const enrichedRuns: RecentAuditRun[] = runs.map((run) => {
    const textToSearch = `${run.queryText} ${(run.citedUrls || []).join(' ')}`.toLowerCase();
    const mentioned: Array<{ name: string; isUnlisted?: boolean }> = [];

    competitorsList.forEach((comp) => {
      const compLower = comp.name.toLowerCase();
      if (textToSearch.includes(compLower)) {
        mentioned.push({
          name: comp.name,
          isUnlisted: comp.isUnlisted,
        });
      }
    });

    return {
      ...run,
      competitorsMentioned: mentioned,
    };
  });

  return {
    competitors: competitorsList,
    fullSovTrendData,
    runs: enrichedRuns,
  };
}

export interface DiscoveredCompetitorItem {
  name: string;
  domain: string;
  isUnlisted?: boolean;
}

export function getAllTrackedAndDiscoveredCompetitors({
  brandKit,
  brandName,
  extraDiscovered = [],
}: {
  brandKit?: BrandKit | null;
  brandName: string;
  industry?: string;
  extraDiscovered?: DiscoveredCompetitorItem[];
}): DiscoveredCompetitorItem[] {
  const brandLower = (brandName || '').toLowerCase();
  const rawCompetitors = brandKit?.competitors || [];
  const competitors: DiscoveredCompetitorItem[] = [];
  const trackedNames = new Set<string>();

  // 1. Add configured brand profile competitors
  rawCompetitors.forEach((c) => {
    if (!c.name || !c.name.trim()) return;
    const trimmed = c.name.trim();
    const domain = c.domain || `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    competitors.push({
      name: trimmed,
      domain,
      isUnlisted: (c as any).isUnlisted || false,
    });
    trackedNames.add(trimmed.toLowerCase());
  });

  // 2. Add extra discovered competitors (from cookies, AI crawls, or session data)
  extraDiscovered.forEach((c) => {
    if (!c.name || !c.name.trim()) return;
    const trimmed = c.name.trim();
    const lower = trimmed.toLowerCase();
    if (lower === brandLower || trackedNames.has(lower)) return;
    competitors.push({
      name: trimmed,
      domain: c.domain || `${lower.replace(/[^a-z0-9]/g, '')}.com`,
      isUnlisted: c.isUnlisted !== undefined ? c.isUnlisted : true,
    });
    trackedNames.add(lower);
  });

  return competitors;
}

