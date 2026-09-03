import { performance } from 'perf_hooks';

// Simulated database delay per network roundtrip (in milliseconds)
const DB_NETWORK_LATENCY_MS = 15;

interface EvaluationResult {
  engine: string;
  visibilityScore: number;
  brandMentioned: boolean;
  sentiment: string;
  sentimentScore: number;
  rawText: string;
  citedUrls: string[];
  rankingPosition: number | null;
}

// Generate mock evaluation data for engines
function generateMockEvaluations(count: number): EvaluationResult[] {
  const engines = ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai_overview', 'google_ai_mode'];
  return Array.from({ length: count }, (_, i) => {
    const engine = engines[i % engines.length] + (i >= engines.length ? `_${i}` : '');
    return {
      engine,
      visibilityScore: 85,
      brandMentioned: true,
      sentiment: 'positive',
      sentimentScore: 0.9,
      rawText: 'Sample text with citations...',
      citedUrls: [
        `https://example.com/article-${i}-1`,
        `https://competitor.com/blog-${i}-2`,
        `https://reviewsite.org/best-${i}-3`,
        `https://news.com/item-${i}-4`,
      ],
      rankingPosition: 1,
    };
  });
}

// Simulated Supabase client that logs query counts and simulates network delay
class MockSupabaseClient {
  queryCount = 0;

  async insertResult(row: any) {
    this.queryCount++;
    await new Promise((resolve) => setTimeout(resolve, DB_NETWORK_LATENCY_MS));
    return { data: { id: `res-${Math.random().toString(36).substring(2, 9)}`, ...row } };
  }

  async insertResultsBatch(rows: any[]) {
    this.queryCount++;
    await new Promise((resolve) => setTimeout(resolve, DB_NETWORK_LATENCY_MS));
    return {
      data: rows.map((row) => ({
        id: `res-${Math.random().toString(36).substring(2, 9)}`,
        engine: row.engine,
      })),
    };
  }

  async insertCitationsBatch(rows: any[]) {
    this.queryCount++;
    await new Promise((resolve) => setTimeout(resolve, DB_NETWORK_LATENCY_MS));
    return { data: rows };
  }
}

// Legacy Unbatched Approach (N+1 queries)
async function runUnbatched(evaluations: EvaluationResult[], supabase: MockSupabaseClient) {
  const startTime = performance.now();

  for (const ev of evaluations) {
    const { data: insertedRes } = await supabase.insertResult({
      prompt_id: 'prompt-123',
      engine: ev.engine,
      visibility_score: ev.visibilityScore,
      brand_mentioned: ev.brandMentioned,
      sentiment: ev.sentiment,
      sentiment_score: ev.sentimentScore,
      raw_text: ev.rawText,
      cited_urls: ev.citedUrls,
      ranking_position: ev.rankingPosition,
    });

    if (ev.citedUrls && ev.citedUrls.length > 0) {
      const citationRows = ev.citedUrls.map((rawUrl) => {
        return {
          project_id: 'proj-123',
          run_id: insertedRes?.id || null,
          engine: ev.engine,
          url: rawUrl,
          domain: 'example.com',
          source_type: 'organic',
        };
      });
      await supabase.insertCitationsBatch(citationRows);
    }
  }

  const duration = performance.now() - startTime;
  return { durationMs: duration, queryCount: supabase.queryCount };
}

// Optimized Batched Approach (Bulk results insert + Bulk citations insert)
async function runBatched(evaluations: EvaluationResult[], supabase: MockSupabaseClient) {
  const startTime = performance.now();

  if (evaluations.length > 0) {
    const resultRows = evaluations.map((ev) => ({
      prompt_id: 'prompt-123',
      engine: ev.engine,
      visibility_score: ev.visibilityScore,
      brand_mentioned: ev.brandMentioned,
      sentiment: ev.sentiment,
      sentiment_score: ev.sentimentScore,
      raw_text: ev.rawText,
      cited_urls: ev.citedUrls,
      ranking_position: ev.rankingPosition,
    }));

    const { data: insertedResults } = await supabase.insertResultsBatch(resultRows);

    const resultMap = new Map<string, string>();
    if (insertedResults) {
      for (const res of insertedResults) {
        resultMap.set(res.engine, res.id);
      }
    }

    const allCitationRows = [];
    for (const ev of evaluations) {
      if (ev.citedUrls && ev.citedUrls.length > 0) {
        const runId = resultMap.get(ev.engine) || null;
        for (const rawUrl of ev.citedUrls) {
          allCitationRows.push({
            project_id: 'proj-123',
            run_id: runId,
            engine: ev.engine,
            url: rawUrl,
            domain: 'example.com',
            source_type: 'organic',
          });
        }
      }
    }

    if (allCitationRows.length > 0) {
      await supabase.insertCitationsBatch(allCitationRows);
    }
  }

  const duration = performance.now() - startTime;
  return { durationMs: duration, queryCount: supabase.queryCount };
}

async function main() {
  console.log('--- CITATION & RESULT INSERTION BENCHMARK ---\n');

  const engineCounts = [4, 6, 12, 20];

  for (const count of engineCounts) {
    const evaluations = generateMockEvaluations(count);

    const clientUnbatched = new MockSupabaseClient();
    const resUnbatched = await runUnbatched(evaluations, clientUnbatched);

    const clientBatched = new MockSupabaseClient();
    const resBatched = await runBatched(evaluations, clientBatched);

    console.log(`Evaluations Count: ${count} engines (${count * 4} citations total)`);
    console.log(`  [UNBATCHED] Query Count: ${resUnbatched.queryCount} queries | Duration: ${resUnbatched.durationMs.toFixed(2)}ms`);
    console.log(`  [BATCHED]   Query Count: ${resBatched.queryCount} queries  | Duration: ${resBatched.durationMs.toFixed(2)}ms`);
    const speedup = (resUnbatched.durationMs / resBatched.durationMs).toFixed(2);
    const queryReduction = (((resUnbatched.queryCount - resBatched.queryCount) / resUnbatched.queryCount) * 100).toFixed(1);
    console.log(`  ==> Speedup: ${speedup}x faster | Query reduction: -${queryReduction}%\n`);
  }
}

main().catch(console.error);
