'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { CitationMetricsCards, type CitationSummaryMetrics } from './citation-metrics-cards';
import { SourceDistributionChart, type SourceDistributionDataPoint } from './source-distribution-chart';
import { CitationVelocityChart, type CitationVelocityDataPoint } from './citation-velocity-chart';
import { CitationsLedgerTable, type DomainCitationRow } from './citations-ledger-table';
import { Calendar, X } from 'lucide-react';
import type { CitationSourceType } from '@/types/database.types';
import { getSourceTypeMeta } from '@/lib/citations/categorizer';
interface CitationsClientProps {
  initialMetrics: CitationSummaryMetrics;
  initialSourceDistribution: SourceDistributionDataPoint[];
  initialVelocity: CitationVelocityDataPoint[];
  initialDomainRows: DomainCitationRow[];
  brandName: string;
}

export function CitationsClient({
  initialMetrics,
  initialSourceDistribution,
  initialVelocity,
  initialDomainRows,
  brandName,
}: CitationsClientProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Cross-filter state shared between the pie chart, ledger table & derived charts.
  // Supports multi-slice selection: clicking slices/legend rows toggles categories in/out.
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

    // Identify top category among the selected set
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

  // Adjust velocity data based on date range AND the active source type cross-filter
  // (scales each period proportionally to the selected sources' combined share of citations)
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
    <div className="space-y-8">
      {/* GA4-STYLE FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              SOURCES &amp; CITATIONS
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
          {/* Active cross-filter chips (click to toggle off or clear all) */}
          {activeSourceTypes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeSourceTypes.map((type) => {
                const meta = getSourceTypeMeta(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleToggleSourceType(type)}
                    title={`Remove ${meta.label} filter`}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-900 text-white font-medium px-2.5 py-1.5 rounded-lg shadow-2xs cursor-pointer hover:bg-slate-800 transition-colors group"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span>{meta.label}</span>
                    <X className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 ml-0.5" />
                  </button>
                );
              })}
              {activeSourceTypes.length > 1 && (
                <button
                  type="button"
                  onClick={handleClearSourceTypes}
                  className="text-xs text-slate-500 hover:text-slate-950 font-medium underline cursor-pointer px-1 py-1 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          )}

          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs font-sans">
            <div className="flex items-center gap-1.5 px-2 text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            {(
              [
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDateRange(item.id)}
                className={`text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium border-2 ${
                  dateRange === item.id
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. TOP METRIC SCORECARDS (Cross-filters with multi-slice donut chart) */}
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
  );
}