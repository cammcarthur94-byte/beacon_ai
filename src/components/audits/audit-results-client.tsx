'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  LayoutGrid,
  Columns2,
  Play,
  Loader2,
  Sparkles,
  TrendingUp,
  Globe,
  Radio,
  Quote,
  ShieldCheck,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModelGridMatrix } from './model-grid-matrix';
import { ModelComparisonView } from './model-comparison-view';
import { LowScoreStrategyCard } from './low-score-strategy-card';
import { SentimentContextCard } from './sentiment-context-card';
import { SentinelRemediationDrawer, type RemediationContext } from './sentinel-remediation-drawer';
import { triggerInstantRun } from '@/app/audits/actions';
import type { AuditRunDetail } from './raw-output-viewer';
import type { SearchIntent, BrandAssociation } from '@/types/database.types';
import { cn } from '@/lib/utils';

export interface AuditResultsClientProps {
  prompt: {
    id: string;
    query_text: string;
    frequency: string;
    target_engines: string[];
    search_intent?: SearchIntent;
    brand_association?: BrandAssociation;
    is_active: boolean;
    last_run_at: string | null;
    next_run_at: string;
  };
  project: {
    id: string;
    name: string;
    domain: string;
    tier: string;
    competitors?: string[];
  };
  initialRuns: AuditRunDetail[];
}

export function AuditResultsClient({
  prompt,
  project,
  initialRuns,
}: AuditResultsClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');
  const [runs, setRuns] = useState<AuditRunDetail[]>(initialRuns);
  const [isPending, startTransition] = useTransition();
  const [sentinelOpen, setSentinelOpen] = useState(false);
  const [sentinelContext, setSentinelContext] = useState<RemediationContext | null>(null);
  const [showStrategyManual, setShowStrategyManual] = useState(false);

  // Compute aggregate KPI metrics
  const totalRuns = runs.length;
  const averageSOV =
    totalRuns > 0
      ? Math.round(runs.reduce((acc, r) => acc + r.visibilityScore, 0) / totalRuns)
      : 0;

  const totalCitations = runs.reduce((acc, r) => acc + (r.citedUrls?.length || 0), 0);
  const uniqueDomains = Array.from(
    new Set(
      runs.flatMap((r) =>
        (r.citedUrls || []).map((u) => {
          try {
            return new URL(u).hostname.replace('www.', '');
          } catch {
            return '';
          }
        }).filter(Boolean)
      )
    )
  ).length;

  const underperformingEngines = runs
    .filter((r) => r.visibilityScore < 70)
    .map((r) => r.engine);

  const competitorsList = project.competitors || ['Alo Yoga', 'Vuori'];

  // Handle live instant audit re-run
  const handleRunAudit = () => {
    startTransition(async () => {
      toast.info('Initiating live multi-engine search scan across active AI models...');
      const res = await triggerInstantRun(prompt.id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Live audit completed! Latest engine answers and scores updated.');
      }
    });
  };

  const handleOpenSentinel = (context: RemediationContext) => {
    setSentinelContext(context);
    setSentinelOpen(true);
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ── 1. BREADCRUMB & PAGE TITLE HEADER ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Link
            href="/audits"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Prompts</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Audit Execution &amp; Model Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Verbatim AI search engine answers, cross-model consensus, and autonomous remediation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Sentinel Drawer Trigger */}
          <Button
            variant="outline"
            onClick={() =>
              handleOpenSentinel({
                strategyTitle: 'General Prompt Optimization Blueprint',
                strategyCategory: 'Topical Authority Blueprint',
                queryText: prompt.query_text,
                brandName: project.name,
                domain: project.domain,
                competitors: competitorsList,
                underperformingEngines,
                averageScore: averageSOV,
              })
            }
            className="h-10 text-xs font-semibold border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Bot className="h-4 w-4 text-emerald-600" />
            <span>Consult Sentinel</span>
          </Button>

          {/* Live Run Trigger */}
          <Button
            onClick={handleRunAudit}
            disabled={isPending}
            className="h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Scan...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Run Audit Now</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── 2. UNIFORM 4-COLUMN KPI METRICS BAR ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Prompt Evaluated */}
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Prompt Evaluated
            </span>
            <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
              &ldquo;{prompt.query_text}&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-1.5 pt-3">
            <Badge variant="outline" className="text-[10px] font-sans font-bold capitalize border-slate-200 bg-slate-50 text-slate-700">
              {prompt.search_intent || 'commercial'}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-sans font-bold capitalize border-slate-200 bg-slate-50 text-slate-600">
              {prompt.brand_association || 'unbranded'}
            </Badge>
          </div>
        </Card>

        {/* KPI 2: Average Visibility (SOV) */}
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Average Recommendation Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                {averageSOV}%
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                Across {totalRuns} models
              </span>
            </div>
          </div>
          <div className="pt-3">
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(100, averageSOV)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* KPI 3: Engines Responding */}
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              AI Tools Responding
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                {totalRuns} / {prompt.target_engines?.length || totalRuns}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                100% complete
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 pt-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block mr-1" />
            <span>All active models captured</span>
          </div>
        </Card>

        {/* KPI 4: Citation Status */}
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Citation Status
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                {uniqueDomains} Domains
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {totalCitations} references
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600 pt-3">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <span>Grounded in active category answers</span>
          </div>
        </Card>
      </div>

      {/* ── 3. LOW-SCORE DISCOVERABILITY STRATEGY PANEL ─────────── */}
      <LowScoreStrategyCard
        queryText={prompt.query_text}
        brandName={project.name}
        domain={project.domain}
        averageScore={averageSOV}
        competitors={competitorsList}
        underperformingEngines={underperformingEngines}
        onOpenSentinel={handleOpenSentinel}
        forceShow={showStrategyManual}
      />

      {/* Toggle Strategy Button if not automatically shown */}
      {averageSOV >= 75 && !showStrategyManual && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowStrategyManual(true)}
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Inspect Discoverability &amp; Optimization Strategy</span>
          </button>
        </div>
      )}

      {/* ── 3B. CITATION SENTIMENT & CONTEXT ANALYSIS ───────────── */}
      <SentimentContextCard
        runs={runs}
        brandName={project.name}
        domain={project.domain}
        competitors={competitorsList}
        queryText={prompt.query_text}
        onOpenSentinel={handleOpenSentinel}
      />

      {/* ── 4. VIEW SWITCHER (GRID MATRIX VS MODEL COMPARISON) ──── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            AI Engine Outputs &amp; Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Compare verbatim answers and citations returned by each search model.
          </p>
        </div>

        {/* View Switcher Pill Toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              viewMode === 'grid'
                ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
            <span>Grid Matrix View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('comparison')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              viewMode === 'comparison'
                ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Columns2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Model Comparison View</span>
          </button>
        </div>
      </div>

      {/* ── 5. VIEW RENDER: GRID MATRIX VS COMPARISON ───────────── */}
      {viewMode === 'grid' ? (
        <ModelGridMatrix runs={runs} brandName={project.name} />
      ) : (
        <ModelComparisonView
          runs={runs}
          brandName={project.name}
          competitors={competitorsList}
        />
      )}

      {/* ── 6. INLINE SENTINEL REMEDIATION DRAWER ────────────────── */}
      <SentinelRemediationDrawer
        open={sentinelOpen}
        onOpenChange={setSentinelOpen}
        context={sentinelContext}
      />
    </div>
  );
}
