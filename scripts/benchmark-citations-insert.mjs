import { performance } from 'node:perf_hooks';

// Simulate database insert latency (e.g. 50ms network round-trip per request)
const MOCK_DB_LATENCY_MS = 50;

async function mockInsertOneByOne(evaluationsCount, citationsPerEval) {
  const start = performance.now();
  let dbCalls = 0;

  for (let i = 0; i < evaluationsCount; i++) {
    const citationRows = Array.from({ length: citationsPerEval }, (_, j) => ({
      url: `https://example${i}-${j}.com`,
    }));

    if (citationRows.length > 0) {
      dbCalls++;
      await new Promise((resolve) => setTimeout(resolve, MOCK_DB_LATENCY_MS));
    }
  }

  const end = performance.now();
  return { timeMs: end - start, dbCalls };
}

async function mockInsertBatched(evaluationsCount, citationsPerEval) {
  const start = performance.now();
  let dbCalls = 0;

  const allCitationRows = [];
  for (let i = 0; i < evaluationsCount; i++) {
    const citationRows = Array.from({ length: citationsPerEval }, (_, j) => ({
      url: `https://example${i}-${j}.com`,
    }));
    allCitationRows.push(...citationRows);
  }

  if (allCitationRows.length > 0) {
    dbCalls++;
    await new Promise((resolve) => setTimeout(resolve, MOCK_DB_LATENCY_MS));
  }

  const end = performance.now();
  return { timeMs: end - start, dbCalls };
}

async function runBenchmark() {
  console.log('--- Benchmarking Citation Ingestion (Loop vs Batched) ---');
  const evaluationsCount = 6; // 6 AI engines evaluated in parallel
  const citationsPerEval = 3;  // 3 citations per engine

  console.log(`Evaluations: ${evaluationsCount}, Citations per engine: ${citationsPerEval}`);

  const unbatched = await mockInsertOneByOne(evaluationsCount, citationsPerEval);
  console.log(`Unbatched (Current): ${unbatched.timeMs.toFixed(2)} ms, DB calls: ${unbatched.dbCalls}`);

  const batched = await mockInsertBatched(evaluationsCount, citationsPerEval);
  console.log(`Batched (Optimized):  ${batched.timeMs.toFixed(2)} ms, DB calls: ${batched.dbCalls}`);

  const improvementPct = (((unbatched.timeMs - batched.timeMs) / unbatched.timeMs) * 100).toFixed(1);
  console.log(`Latency Reduction: ${improvementPct}% (${unbatched.dbCalls} calls -> ${batched.dbCalls} call)`);
}

runBenchmark();
