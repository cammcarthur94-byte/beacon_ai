import { z } from 'zod';

export const executiveReportSchema = z.object({
  executiveSummary: z.string().describe(
    '1-2 sentence high-level brief including period-over-period direction'
  ),
  periodDelta: z.object({
    sovChange: z.number().describe('Percentage point shift vs previous period, e.g. +4.2'),
    sentimentChange: z.number().describe('Percentage point shift vs previous period, e.g. -2.1'),
  }),
  modelComparison: z.object({
    bestEngine: z.object({
      name: z.string(),
      sov: z.number(),
      reason: z.string(),
    }),
    laggingEngine: z.object({
      name: z.string(),
      sov: z.number(),
      reason: z.string(),
    }),
    discrepancyAnalysis: z.string(),
  }),
  competitorBenchmark: z.array(
    z.object({
      competitorName: z.string(),
      estimatedSov: z.number(),
    })
  ),
  promptConsensusList: z.array(
    z.object({
      promptText: z.string(),
      brandPosition: z.enum(['primary_recommendation', 'alternative', 'omitted']),
      consensusSummary: z.string(),
      topCompetitorCited: z.string(),
    })
  ),
  citationAnalysis: z.object({
    topDomains: z.array(
      z.object({
        domain: z.string(),
        count: z.number(),
      })
    ),
    identifiedGaps: z.array(
      z.object({
        targetType: z.string(),
        description: z.string(),
        actionableStrategy: z.string(),
      })
    ),
  }),
});

export type ExecutiveReportData = z.infer<typeof executiveReportSchema>;
