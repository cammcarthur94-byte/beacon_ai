'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CitationMetricsCards, type CitationSummaryMetrics } from './citation-metrics-cards';
import { SourceDistributionChart, type SourceDistributionDataPoint } from './source-distribution-chart';
import { CitationVelocityChart, type CitationVelocityDataPoint } from './citation-velocity-chart';
import { CitationsLedgerTable, type DomainCitationRow } from './citations-ledger-table';
import { Calendar, Globe, LayoutGrid } from 'lucide-react';
import type { CitationSourceType } from '@/types/database.types';
import { getSourceTypeMeta } from '@/lib/citations/categorizer';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type CitationViewType = 'overview' | 'domains';

interface CitationsClientProps {
  initialMetrics: CitationSummaryMetrics;
  initialSourceDistribution: SourceDistributionDataPoint[];
  initialVelocity: CitationVelocityDataPoint[];
  initialDomainRows: DomainCitationRow[];
}

export function CitationsClient({
  initialMetrics,
  initialSourceDistribution,
  initialVelocity,
  initialDomainRows,
}: CitationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentViewParam = (searchParams.get('view') || 'overview') as CitationViewType;
  const activeView: CitationViewType = ['overview', 'domains'].includes(currentViewParam)
    ? currentViewParam
    : 'overview';

  const setView = (view: CitationViewType) => {
    const url = view === 'overview' ? '/citations' : `/citations?view=${view}`;
    router.push(url);
  };

  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Cross-filter state shared between the pie chart, ledger table & derived charts.
  const [activeSourceTypes, setActiveSourceTypes] = useState<CitationSourceType[]>([]);

  const handleToggleSourceType = (type: CitationSourceType) => {
    setActiveSourceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearSourceTypes = () => {
    setActiveSourceTypes([]);
  };

  // Rows restricted to the selected source types (feeds metrics counts)
  const filteredDomainRows = useMemo(() => {
    if (activeSourceTypes.length === 0) return initialDomainRows;
    return initialDomainRows.filter((r) => activeSourceTypes.includes(r.sourceType));
  }, [initialDomainRows, activeSourceTypes]);

  // Adjust metrics based on date range AND the active source types cross-filter
  const filteredMetrics = useMemo(() => {
    let base = initialMetrics;
    if (dateRange === '7d') {
      base = {
        ...initialMetrics,
        totalCitations: Math.round(initialMetrics.totalCitations * 0.35),
        uniqueDomains: Math.round(initialMetrics.uniqueDomains * 0.4),
      };
    }
    if (activeSourceTypes.length === 0) return base;

    const selectedDistList = initialSourceDistribution.filter((d) =>
      activeSourceTypes.includes(d.sourceType)
    );
    const combinedCount = selectedDistList.reduce((acc, curr) => acc + curr.count, 0);
    const combinedPercent = Math.round(
      selectedDistList.reduce((acc, curr) => acc + curr.percentage, 0)
    );

    let topType: CitationSourceType = activeSourceTypes[0];
    let topCount = 0;
    selectedDistList.forEach((d) => {
      if (d.count > topCount) {
        topCount = d.count;
        topType = d.sourceType;
      }
    });

    const timeScale = dateRange === '7d' ? 0.35 : 1;

    return {
      ...base,
      totalCitations: Math.round(combinedCount * timeScale),
      uniqueDomains: Math.round(filteredDomainRows.length * (dateRange === '7d' ? 0.4 : 1)),
      topSourceType: topType,
      topSourcePercent: combinedPercent,
    };
  }, [initialMetrics, initialSourceDistribution, activeSourceTypes, dateRange, filteredDomainRows]);

  const filteredVelocity = useMemo(() => {
    let base = initialVelocity;
    if (dateRange === '7d') {
      base = initialVelocity.slice(-3);
    }
    if (activeSourceTypes.length === 0) return base;

    const selectedDistList = initialSourceDistribution.filter((d) =>
      activeSourceTypes.includes(d.sourceType)
    );
    const combinedCount = selectedDistList.reduce((acc, curr) => acc + curr.count, 0);
    const ratio =
      initialMetrics.totalCitations > 0
        ? combinedCount / initialMetrics.totalCitations
        : 1;

    return base.map((p) => ({
      ...p,
      newCitations: Math.max(0, Math.round(p.newCitations * ratio)),
    }));
  }, [initialVelocity, initialSourceDistribution, activeSourceTypes, dateRange, initialMetrics.totalCitations]);

  return (
    <div className="space-y-8 font-sans">
      {/* GA4-STYLE FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Reports &gt; Citations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
            Websites Citing Your Brand
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Monitor the websites, articles, and reviews ChatGPT, Claude, and Perplexity reference when recommending your brand.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* View Mode Pills (Overview, All Domains) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutGrid },
              { id: 'domains', label: 'All Domains', icon: Globe },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id as CitationViewType)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                    activeView === v.id
                      ? 'bg-white text-sky-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-950'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs font-sans">
            <div className="flex items-center gap-1.5 px-2 text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            {(
              [
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: 'all', label: 'All' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDateRange(item.id)}
                className={`text-xs px-2.5 py-1 rounded-xl transition-all cursor-pointer font-medium ${
                  dateRange === item.id
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OVERVIEW VIEW */}
      {activeView === 'overview' && (
        <div className="space-y-8 animate-in fade-in-50 duration-150">
          {/* 1. TOP METRIC SCORECARDS */}
          <CitationMetricsCards
            metrics={filteredMetrics}
            activeSourceTypes={activeSourceTypes}
            onClearFilter={handleClearSourceTypes}
          />

          {/* 2. RECHARTS VISUALIZATIONS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SourceDistributionChart
              data={initialSourceDistribution}
              totalCitations={filteredMetrics.totalCitations}
              filterOptions={{
                activeSourceTypes,
                onToggleSourceType: handleToggleSourceType,
                onClearAll: handleClearSourceTypes,
              }}
            />
            <CitationVelocityChart data={filteredVelocity} />
          </div>

          {/* 3. SHADCN DATA TABLE LEDGER */}
          <CitationsLedgerTable
            rows={initialDomainRows}
            activeSourceTypes={activeSourceTypes}
            onToggleSourceType={handleToggleSourceType}
            onClearSourceTypes={handleClearSourceTypes}
          />
        </div>
      )}

      {/* ALL DOMAINS VIEW */}
      {activeView === 'domains' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Domain Authority Index</span>
              <p className="text-sm font-semibold text-sky-950">
                {filteredMetrics.uniqueDomains} unique authoritative domains cited across search engine answers
              </p>
            </div>
            <Badge className="bg-sky-600 text-white text-xs">All Domains</Badge>
          </div>

          <CitationsLedgerTable
            rows={initialDomainRows}
            activeSourceTypes={activeSourceTypes}
            onToggleSourceType={handleToggleSourceType}
            onClearSourceTypes={handleClearSourceTypes}
          />
        </div>
      )}

    </div>
  );
}