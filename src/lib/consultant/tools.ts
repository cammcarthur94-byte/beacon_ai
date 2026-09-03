import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, BrandKit } from '@/types/database.types';
import { generateDraftRewrite, isConsumerIndustry } from '@/lib/consultant/draft-generator';

export type RlsSupabase = SupabaseClient<Database>;

export interface ToolContext {
  /** RLS-scoped Supabase client bound to the authenticated workspace owner. */
  supabase: RlsSupabase;
  projectId: string;
  brandName: string;
  brandDomain: string;
  brandKit: BrandKit;
}

const CONSUMER_ENTITIES = [
  'Proprietary four-way stretch fabric softness with squat-proof opacity',
  'Ergonomic anti-roll high waistband engineering',
  'Sweat-wicking shape retention verified by third-party wear tests',
];

const B2B_ENTITIES = [
  'SOC 2 Type II verified telemetry',
  'Real-time multi-hop verification controls',
  'Self-hosted privacy and data residency options',
];

export function pickDefaultEntities(industry: string): string[] {
  return isConsumerIndustry(industry) ? CONSUMER_ENTITIES : B2B_ENTITIES;
}

function isSupabaseUnavailable(error: unknown): boolean {
  return error instanceof Error && error.message === 'SUPABASE_NOT_CONFIGURED';
}

function unavailableTelemetry(days: number) {
  return {
    window_days: days,
    data_available: false,
    summary:
      'Workspace database is not connected in this environment, so live telemetry is unavailable. Answer from the grounded brand kit instead and avoid quoting any numbers.',
    prompts: [],
    series: [],
    engine_totals: [],
    overall: null,
  };
}



function isValidDays(value: unknown): value is 7 | 30 | 90 {
  return value === 7 || value === 30 || value === 90;
}

function clampDays(value: unknown): 7 | 30 | 90 {
  return isValidDays(value) ? value : 30;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Tool 1 — queryAuditTelemetry
 * Natural-language access to historical visibility + sentiment data.
 * The RLS-scoped client guarantees only this workspace's rows are reachable.
 */
export async function executeQueryAuditTelemetry(
  ctx: ToolContext,
  input: { days: number; engineId?: string; promptId?: string }
) {
  const days = clampDays(input.days);
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let promptIds: string[] = [];
  try {
    if (input.promptId) {
      const { data: promptRow } = await ctx.supabase
        .from('prompts')
        .select('id, query_text')
        .eq('id', input.promptId)
        .eq('project_id', ctx.projectId)
        .limit(1);
      promptIds = promptRow && promptRow.length > 0 ? [promptRow[0].id] : [];
    } else {
      const { data: promptRows } = await ctx.supabase
        .from('prompts')
        .select('id')
        .eq('project_id', ctx.projectId);
      promptIds = (promptRows || []).map((r) => r.id);
    }
  } catch (error) {
    if (isSupabaseUnavailable(error)) return unavailableTelemetry(days);
    throw error;
  }

  if (promptIds.length === 0) {
    return {
      window_days: days,
      data_available: false,
      summary: 'No tracked prompts exist for this workspace yet, so there is no telemetry to analyze.',
      prompts: [],
      series: [],
      engine_totals: [],
      overall: null,
      note: 'Suggest the user add trackers (prompts) first; without them Beacon cannot measure Share of Voice.',
    };
  }

  let resultsQuery = ctx.supabase
    .from('results')
    .select(
      'id, prompt_id, engine, visibility_score, brand_mentioned, sentiment, sentiment_score, ranking_position, created_at'
    )
    .in('prompt_id', promptIds)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true });

  if (input.engineId) {
    resultsQuery = resultsQuery.eq('engine', input.engineId);
  }

  let rows;
  let error;
  try {
    const fetched = await resultsQuery;
    rows = fetched.data;
    error = fetched.error;
  } catch (thrown) {
    if (isSupabaseUnavailable(thrown)) return unavailableTelemetry(days);
    throw thrown;
  }

  if (error) {
    return {
      window_days: days,
      data_available: false,
      summary: `Telemetry query failed: ${error.message}`,
      prompts: [],
      series: [],
      engine_totals: [],
      overall: null,
    };
  }

  const telemetryRows = rows || [];
  const engines = Array.from(new Set(telemetryRows.map((r) => r.engine)));

  const engineTotals = engines
    .map((engine) => {
      const engineRows = telemetryRows.filter((r) => r.engine === engine);
      const avgScore =
        engineRows.reduce((sum, r) => sum + (r.visibility_score ?? 0), 0) /
        Math.max(engineRows.length, 1);
      const mentioned = engineRows.filter((r) => r.brand_mentioned).length;
      const avgSentiment =
        engineRows.reduce((sum, r) => sum + (r.sentiment_score ?? 0), 0) /
        Math.max(engineRows.length, 1);
      const sentimentCounts: Record<string, number> = {};
      for (const r of engineRows) {
        sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1;
      }
      return {
        engine,
        runs: engineRows.length,
        avg_visibility: round2(avgScore),
        mention_rate: round2((mentioned / Math.max(engineRows.length, 1)) * 100),
        avg_sentiment: round2(avgSentiment),
        sentiment_counts: sentimentCounts,
      };
    })
    .sort((a, b) => b.avg_visibility - a.avg_visibility);

  const overall =
    telemetryRows.length > 0
      ? {
          runs: telemetryRows.length,
          avg_visibility: round2(
            telemetryRows.reduce((s, r) => s + (r.visibility_score ?? 0), 0) / telemetryRows.length
          ),
          mention_rate: round2(
            (telemetryRows.filter((r) => r.brand_mentioned).length / telemetryRows.length) * 100
          ),
          avg_sentiment: round2(
            telemetryRows.reduce((s, r) => s + (r.sentiment_score ?? 0), 0) / telemetryRows.length
          ),
        }
      : null;

  const series = engines.map((engine) => ({
    engine,
    points: telemetryRows
      .filter((r) => r.engine === engine)
      .map((r) => ({
        date: r.created_at,
        visibility: r.visibility_score,
        sentiment: r.sentiment_score,
      })),
  }));

  const { data: promptRows } = await ctx.supabase
    .from('prompts')
    .select('id, query_text, search_intent, brand_association')
    .eq('project_id', ctx.projectId)
    .in('id', promptIds);

  return {
    window_days: days,
    data_available: telemetryRows.length > 0,
    summary:
      telemetryRows.length > 0
        ? `Retrieved ${telemetryRows.length} audit runs across ${engines.length} engine(s) over the last ${days} days for ${ctx.brandName}.`
        : `No audit runs recorded in the last ${days} days for this workspace.`,
    prompts: promptRows || [],
    series,
    engine_totals: engineTotals,
    overall,
    note: 'Share of Voice is the average visibility score across runs; mention_rate is the % of runs where the brand appeared.',
  };
}

/**
 * Tool 2 — analyzeCitationGap
 * Inspects referring domains from the citations ledger, evaluates which
 * competitor-adjacent domains are winning citation blocks, and recommends
 * targeted backlink / placement strategies.
 */
export async function executeAnalyzeCitationGap(
  ctx: ToolContext,
  input: { competitorName?: string; days?: number }
) {
  const days = clampDays(input?.days);
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // RLS-scoped read of this project's citations.
  let citationRows;
  let error;
  try {
    const fetched = await ctx.supabase
      .from('citations')
      .select('id, engine, url, domain, source_type, created_at')
      .eq('project_id', ctx.projectId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(500);
    citationRows = fetched.data;
    error = fetched.error;
  } catch (thrown) {
    if (isSupabaseUnavailable(thrown)) {
      return {
        data_available: false,
        summary:
          'Workspace database is not connected in this environment, so the citation ledger is unavailable. Answer from the grounded brand kit instead and avoid quoting any numbers.',
        competitor_analyzed:
          input?.competitorName || ctx.brandKit.competitors?.[0]?.name || null,
        referring_domains: [],
        competitor_wins: [],
        brand_citation_share: 0,
        recommendations: [],
      };
    }
    throw thrown;
  }

  if (error) {
    return {
      data_available: false,
      summary: `Citation query failed: ${error.message}`,
      competitor_analyzed: input?.competitorName || ctx.brandKit.competitors?.[0]?.name || null,
      referring_domains: [],
      competitor_wins: [],
      brand_citation_share: 0,
      recommendations: [],
    };
  }

  const rows = citationRows || [];
  const brandRoot = (ctx.brandDomain || '').toLowerCase().replace(/^www\./, '');

  const domainCounts = new Map<
    string,
    { count: number; engines: Set<string>; sourceTypes: Set<string> }
  >();
  for (const row of rows) {
    const entry =
      domainCounts.get(row.domain) ||
      { count: 0, engines: new Set<string>(), sourceTypes: new Set<string>() };
    entry.count += 1;
    entry.engines.add(row.engine || 'unknown');
    entry.sourceTypes.add(row.source_type);
    domainCounts.set(row.domain, entry);
  }

  const referringDomains = Array.from(domainCounts.entries())
    .map(([domain, entry]) => ({
      domain,
      citations: entry.count,
      engines: Array.from(entry.engines),
      source_types: Array.from(entry.sourceTypes),
      is_brand_domain: domain === brandRoot || domain.endsWith(`.${brandRoot}`),
    }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 15);

  // A competitor citation win = a domain citing the competitor's site inside our tracked answers.
  const competitorName = (
    input?.competitorName ||
    ctx.brandKit.competitors?.[0]?.name ||
    'the leading competitor'
  ).trim();
  const competitorDomainRaw =
    ctx.brandKit.competitors?.find(
      (c) => c.name.toLowerCase() === competitorName.toLowerCase()
    )?.domain || '';
  const competitorRoot = competitorDomainRaw
    ? competitorDomainRaw.toLowerCase().replace(/^www\./, '')
    : '';

  const competitorCitations = competitorRoot
    ? rows.filter((r) => {
        const lowerUrl = (r.url || '').toLowerCase();
        return lowerUrl.includes(competitorRoot) && !lowerUrl.includes(brandRoot);
      })
    : [];

  const competitorWinDomains = Array.from(
    new Set(
      competitorCitations
        .map((r) => r.domain)
        .filter((d) => d && d !== brandRoot && !d.endsWith(`.${brandRoot}`))
    )
  )
    .map((domain) => ({
      domain,
      citations: competitorCitations.filter((r) => r.domain === domain).length,
    }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 8);

  const recommendations = buildBacklinkRecommendations(
    competitorWinDomains,
    referringDomains,
    ctx.brandKit,
    competitorName
  );

  return {
    data_available: rows.length > 0,
    summary:
      rows.length > 0
        ? `Analyzed ${rows.length} citations across ${referringDomains.length} referring domains in the last ${days} days. ${competitorCitations.length} citation blocks currently favor ${competitorName}.`
        : `No citations recorded in the last ${days} days. Beacon needs at least one completed audit run to map the citation landscape.`,
    competitor_analyzed: competitorName,
    referring_domains: referringDomains,
    competitor_wins: competitorWinDomains,
    brand_citation_share: round2(
      (referringDomains
        .filter((d) => d.is_brand_domain)
        .reduce((s, d) => s + d.citations, 0) /
        Math.max(rows.length, 1)) *
        100
    ),
    recommendations,
  };
}

function buildBacklinkRecommendations(
  competitorWinDomains: Array<{ domain: string; citations: number }>,
  referringDomains: Array<{ domain: string; citations: number; is_brand_domain: boolean }>,
  brandKit: BrandKit,
  competitorName: string
) {
  const recommendations: Array<{
    target_domain: string;
    play: string;
    rationale: string;
    expected_effect: string;
  }> = [];

  const brandCited = new Set(referringDomains.filter((d) => d.is_brand_domain).map((d) => d.domain));

  for (const win of competitorWinDomains.slice(0, 5)) {
    if (brandCited.has(win.domain)) continue;
    recommendations.push({
      target_domain: win.domain,
      play: `Pitch the exact page ${competitorName} is being cited from on ${win.domain} with a stronger primary-source alternative from our knowledge base.`,
      rationale: `${win.domain} currently cites ${competitorName} ${win.citations} time(s) inside our tracked answers but does not cite us yet.`,
      expected_effect: 'Reclaims the citation block and lifts Share of Voice on the affected trackers.',
    });
  }

  // No competitor data yet -> evergreen authority plays calibrated to the industry.
  if (recommendations.length === 0) {
    const consumer = isConsumerIndustry(brandKit.industry);
    const evergreen = consumer
      ? [
          'Secure a wear-test or fit-guide feature on the top 3 lifestyle publications our audience already reads.',
          'Seed verified buyer reviews on the community forums that answer engines cite most in our category.',
          'Publish our material and fit spec sheets so journalists and AI crawlers can quote primary-source detail.',
        ]
      : [
          'Publish original benchmark data so industry analysts cite our telemetry instead of the incumbent.',
          'Contribute expert commentary to the trade publications currently cited in our category answers.',
          'Document integration and compliance proof points in crawlable, quotable form.',
        ];
    for (const play of evergreen) {
      recommendations.push({
        target_domain: 'category authorities (identified after the next audit run)',
        play,
        rationale: 'No competitor citation wins recorded yet in this window; building baseline authority in our vertical.',
        expected_effect: 'Establishes first-citation authority on our highest-intent trackers.',
      });
    }
  }

  return recommendations;
}

/**
 * Tool 3 — draftRewrite
 * Generates optimized content, meta tags, and structured FAQ blocks
 * integrating the missing entities needed to reclaim lost AI Share of Voice.
 */
export async function executeDraftRewrite(
  ctx: ToolContext,
  input: { topic: string; competitor_name?: string; missing_entities?: string[] }
) {
  const competitor = (
    input.competitor_name ||
    ctx.brandKit.competitors?.[0]?.name ||
    'the incumbent leader'
  ).trim();
  const entities =
    input.missing_entities && input.missing_entities.length > 0
      ? input.missing_entities
      : pickDefaultEntities(ctx.brandKit.industry);

  return generateDraftRewrite({
    topic: input.topic,
    competitorName: competitor,
    missingEntities: entities,
    brandName: ctx.brandName,
    brandDomain: ctx.brandDomain,
    brandKit: ctx.brandKit,
  });
}
