import { performance } from 'node:perf_hooks';

// Simulate a database insert with network latency
async function mockDatabaseInsert(rows, latencyMs = 15) {
  await new Promise((resolve) => setTimeout(resolve, latencyMs));
  return { data: rows, error: null };
}

// Simulated data: 6 engines, each with 5 citation URLs
const mockEvaluationResults = Array.from({ length: 6 }, (_, i) => ({
  engine: `engine-${i + 1}`,
  citedUrls: Array.from({ length: 5 }, (_, j) => `https://example${j + 1}.com/article-${i}-${j}`),
}));

const projectId = 'proj-123';
const resultIdPrefix = 'res-';

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown.com';
  }
}

function categorizeSource(domain, url) {
  return 'media';
}

// Method 1: Current implementation - Sequential insertions inside evaluation loop
async function runSequentialInsertion(evaluations) {
  const start = performance.now();
  let queryCount = 0;

  for (let idx = 0; idx < evaluations.length; idx++) {
    const evaluation = evaluations[idx];
    const insertedResultId = `${resultIdPrefix}${idx}`;

    if (evaluation.citedUrls && evaluation.citedUrls.length > 0) {
      const citationRows = evaluation.citedUrls.map((rawUrl) => {
        const domain = extractDomain(rawUrl);
        return {
          project_id: projectId,
          run_id: insertedResultId,
          engine: evaluation.engine,
          url: rawUrl,
          domain: domain || 'unknown.com',
          source_type: categorizeSource(domain, rawUrl),
        };
      });

      await mockDatabaseInsert(citationRows);
      queryCount++;
    }
  }

  const end = performance.now();
  return { durationMs: end - start, queryCount };
}

// Method 2: Optimized implementation - Bulk insert accumulated citation rows
async function runBulkInsertion(evaluations) {
  const start = performance.now();
  let queryCount = 0;
  const allCitationRows = [];

  for (let idx = 0; idx < evaluations.length; idx++) {
    const evaluation = evaluations[idx];
    const insertedResultId = `${resultIdPrefix}${idx}`;

    if (evaluation.citedUrls && evaluation.citedUrls.length > 0) {
      const citationRows = evaluation.citedUrls.map((rawUrl) => {
        const domain = extractDomain(rawUrl);
        return {
          project_id: projectId,
          run_id: insertedResultId,
          engine: evaluation.engine,
          url: rawUrl,
          domain: domain || 'unknown.com',
          source_type: categorizeSource(domain, rawUrl),
        };
      });

      allCitationRows.push(...citationRows);
    }
  }

  if (allCitationRows.length > 0) {
    await mockDatabaseInsert(allCitationRows);
    queryCount++;
  }

  const end = performance.now();
  return { durationMs: end - start, queryCount, rowsInserted: allCitationRows.length };
}

async function runBenchmark() {
  console.log('--- Running Citation Insert Benchmark (6 engines x 5 citations = 30 citation rows) ---');

  // Warmup
  await runSequentialInsertion(mockEvaluationResults);
  await runBulkInsertion(mockEvaluationResults);

  const iterations = 10;
  let totalSeqTime = 0;
  let totalSeqQueries = 0;

  let totalBulkTime = 0;
  let totalBulkQueries = 0;

  for (let i = 0; i < iterations; i++) {
    const seq = await runSequentialInsertion(mockEvaluationResults);
    totalSeqTime += seq.durationMs;
    totalSeqQueries += seq.queryCount;

    const bulk = await runBulkInsertion(mockEvaluationResults);
    totalBulkTime += bulk.durationMs;
    totalBulkQueries += bulk.queryCount;
  }

  const avgSeqTime = totalSeqTime / iterations;
  const avgSeqQueries = totalSeqQueries / iterations;

  const avgBulkTime = totalBulkTime / iterations;
  const avgBulkQueries = totalBulkQueries / iterations;

  const speedup = (avgSeqTime / avgBulkTime).toFixed(2);
  const queryReduction = (((avgSeqQueries - avgBulkQueries) / avgSeqQueries) * 100).toFixed(1);

  console.log(`Sequential (Baseline): Avg Time = ${avgSeqTime.toFixed(2)}ms | Avg Queries = ${avgSeqQueries}`);
  console.log(`Bulk Insert (Optimized): Avg Time = ${avgBulkTime.toFixed(2)}ms | Avg Queries = ${avgBulkQueries}`);
  console.log(`Speedup: ${speedup}x faster | Query reduction: ${queryReduction}%`);
}

runBenchmark();
