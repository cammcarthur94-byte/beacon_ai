'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { ReportHeader } from './report-header';
import { ExecutiveCallout } from './executive-callout';
import { ModelComparisonCard } from './model-comparison-card';
import { PromptConsensusTable } from './prompt-consensus-table';
import { CitationGapsCard } from './citation-gaps-card';
import { generateProjectReportAction } from '@/actions/generate-project-report';
import type { ExecutiveReportData } from '@/lib/schemas/executive-report';
import { toast } from 'sonner';
import { Radio } from 'lucide-react';

interface ReportsClientProps {
  initialReport: ExecutiveReportData;
  initialDateRange?: '7d' | '30d' | 'all';
  brandName: string;
  domain: string;
  generatedAt?: string;
}

export function ReportsClient({
  initialReport,
  initialDateRange = '30d',
  brandName,
  domain,
  generatedAt: initialGeneratedAt,
}: ReportsClientProps) {
  const [report, setReport] = useState<ExecutiveReportData>(initialReport);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>(initialDateRange);
  const [generatedAt, setGeneratedAt] = useState<string | undefined>(initialGeneratedAt);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = (selectedRange = dateRange) => {
    startTransition(async () => {
      toast.info(`Generating executive report across ${selectedRange} search data...`);
      const res = await generateProjectReportAction(selectedRange);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.report) {
        setReport(res.report);
        setGeneratedAt(new Date().toISOString());
        toast.success('Executive AI Audit Report successfully generated.');
      }
    });
  };

  const handleDateRangeChange = (range: '7d' | '30d' | 'all') => {
    setDateRange(range);
    handleGenerate(range);
  };

  return (
    <div className="space-y-8 print:space-y-6">
      {/* PRINT-ONLY WHITE-LABEL COVER BANNER */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-zinc-900 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-black text-white flex items-center justify-center font-bold">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-black">Beacon AI Platform</span>
            <p className="text-[10px] font-mono text-zinc-600">Confidential Executive Strategy Audit</p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-bold text-base text-black">{brandName}</span>
          <p className="text-xs font-mono text-zinc-600">{domain}</p>
        </div>
      </div>

      {/* 1. REPORT CONTROLS & HEADER WITH PERIOD-OVER-PERIOD DELTAS */}
      <ReportHeader
        brandName={brandName}
        domain={domain}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onGenerateFresh={() => handleGenerate()}
        isGenerating={isPending}
        generatedAt={generatedAt}
        periodDelta={report.periodDelta}
        bestEngineSov={report.modelComparison.bestEngine.sov}
      />

      {/* 2. EXECUTIVE CALLOUT BRIEF */}
      <div className="print-break-inside-avoid">
        <ExecutiveCallout summary={report.executiveSummary} brandName={brandName} />
      </div>

      {/* 3. MODEL COMPARISON & COMPETITOR BENCHMARK */}
      <div className="print-break-inside-avoid">
        <ModelComparisonCard
          modelComparison={report.modelComparison}
          competitorBenchmark={report.competitorBenchmark}
          brandName={brandName}
        />
      </div>

      {/* 4. PROMPT CONSENSUS SHADCN TABLE */}
      <div className="print-break-inside-avoid">
        <PromptConsensusTable
          promptConsensusList={report.promptConsensusList}
          brandName={brandName}
        />
      </div>

      {/* 5. CITATION ANALYSIS & IDENTIFIED GAPS WITH AI AGENT HANDOFF */}
      <div className="print-break-inside-avoid">
        <CitationGapsCard
          citationAnalysis={report.citationAnalysis}
          brandName={brandName}
        />
      </div>
    </div>
  );
}
