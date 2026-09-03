import { performance } from 'node:perf_hooks';

// Simulate database network latency in milliseconds
const DB_LATENCY_MS = 15;

async function mockInsertSequential(evaluationResults) {
  const start = performance.now();
  let resultsCreated = 0;
  const insertedResultIds = [];

  for (const evaluation of evaluationResults) {
    // 1 DB call for results insert
    await new Promise((resolve) => setTimeout(resolve, DB_LATENCY_MS));
    const insertedResult = { id: `res_${Math.random()}` };
    insertedResultIds.push(insertedResult.id);

    if (evaluation.citedUrls && evaluation.citedUrls.length > 0) {
      // 1 DB call for citations insert
      await new Promise((resolve) => setTimeout(resolve, DB_LATENCY_MS));
    }
    resultsCreated++;
  }

  const duration = performance.now() - start;
  return { duration, resultsCreated };
}

async function mockInsertBulk(evaluationResults, projectId, promptId) {
  const start = performance.now();
  let resultsCreated = 0;

  // 1. Prepare bulk results insert
  const resultsToInsert = evaluationResults.map((evaluation) => ({
    prompt_id: promptId,
    engine: evaluation.engine,
    visibility_score: evaluation.visibilityScore,
    brand_mentioned: evaluation.brandMentioned,
    sentiment: evaluation.sentiment,
    sentiment_score: evaluation.sentimentScore,
    raw_text: evaluation.rawText,
    cited_urls: evaluation.citedUrls,
    ranking_position: evaluation.rankingPosition,
  }));

  if (resultsToInsert.length > 0) {
    // 1 DB call for bulk results insert
    await new Promise((resolve) => setTimeout(resolve, DB_LATENCY_MS));
    resultsCreated += resultsToInsert.length;
  }

  // 2. Prepare bulk citations insert
  const citationRows = [];
  for (const evaluation of evaluationResults) {
    if (evaluation.citedUrls && evaluation.citedUrls.length > 0) {
      for (const rawUrl of evaluation.citedUrls) {
        citationRows.push({
          project_id: projectId,
          engine: evaluation.engine,
          url: rawUrl,
        });
      }
    }
  }

  if (citationRows.length > 0) {
    // 1 DB call for bulk citations insert
    await new Promise((resolve) => setTimeout(resolve, DB_LATENCY_MS));
  }

  const duration = performance.now() - start;
  return { duration, resultsCreated };
}

async function runBenchmark() {
  const numPrompts = 10;
  const enginesPerPrompt = 6;
  const mockEvaluations = Array.from({ length: enginesPerPrompt }, (_, i) => ({
    engine: `engine_${i}`,
    visibilityScore: 80,
    brandMentioned: true,
    sentiment: 'positive',
    sentimentScore: 0.9,
    rawText: 'sample text',
    citedUrls: ['https://example.com/1', 'https://example.com/2'],
    rankingPosition: 1,
  }));

  console.log(`Running benchmark with ${numPrompts} prompts, each with ${enginesPerPrompt} engine evaluations...`);
  console.log(`Simulated DB Latency: ${DB_LATENCY_MS}ms per request\n`);

  // Measure Sequential
  const seqStart = performance.now();
  for (let p = 0; p < numPrompts; p++) {
    await mockInsertSequential(mockEvaluations);
  }
  const seqTotalDuration = performance.now() - seqStart;

  // Measure Bulk
  const bulkStart = performance.now();
  for (let p = 0; p < numPrompts; p++) {
    await mockInsertBulk(mockEvaluations, 'proj_123', `prompt_${p}`);
  }
  const bulkTotalDuration = performance.now() - bulkStart;

  console.log(`--- BENCHMARK RESULTS ---`);
  console.log(`Sequential (Original): ${seqTotalDuration.toFixed(2)} ms (${(seqTotalDuration / numPrompts).toFixed(2)} ms/prompt)`);
  console.log(`Bulk (Optimized):     ${bulkTotalDuration.toFixed(2)} ms (${(bulkTotalDuration / numPrompts).toFixed(2)} ms/prompt)`);
  const speedup = (seqTotalDuration / bulkTotalDuration).toFixed(2);
  const reductionPercent = (((seqTotalDuration - bulkTotalDuration) / seqTotalDuration) * 100).toFixed(1);
  console.log(`Speedup: ${speedup}x faster (${reductionPercent}% latency reduction)`);
}

runBenchmark();
