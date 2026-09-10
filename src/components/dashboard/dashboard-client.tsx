'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SummaryCards, type DashboardSummaryMetrics } from './summary-cards';
import { SovTrendChart, type MultiLineSovDataPoint, type CompetitorMeta } from './sov-trend-chart';
import { CitationSourcesChart, type CitationDomainItem } from './citation-sources-chart';
import { EngineComparisonChart, type EngineVisibilityScore } from './engine-comparison-chart';
import { SentimentDonutChart, type SentimentSliceData } from './sentiment-donut-chart';
import { RecentActivityTable, type RecentAuditRun } from './recent-activity-table';

interface DashboardClientViewProps {
  initialSummaryMetrics: DashboardSummaryMetrics;
  fullSovTrendData: {
    '7d': MultiLineSovDataPoint[];
    '30d': MultiLineSovDataPoint[];
    '90d': MultiLineSovDataPoint[];
  };
  initialEngineScores: EngineVisibilityScore[];
  initialCitationDomains: CitationDomainItem[];
  initialSentimentSlices: SentimentSliceData[];
  initialRuns: RecentAuditRun[];
  competitors: CompetitorMeta[];
  brandName: string;
}

function matchesEngineId(runEngine: string, targetEngineId: string): boolean {
  const normRun = runEngine.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normTarget = targetEngineId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normTarget === 'copilot') {
    return normRun === 'copilot';
  }
  return normRun.includes(normTarget) || normTarget.includes(normRun);
}

export function DashboardClientView({
  initialSummaryMetrics,
  fullSovTrendData,
  initialEngineScores,
  initialCitationDomains,
  initialSentimentSlices,
  initialRuns,
  competitors,
  brandName,
}: DashboardClientViewProps) {
  // All 7 AI engines dynamically derived from initial benchmark scores
  const allEngineIds = useMemo(
    () => initialEngineScores.map((e) => e.engineId),
    [initialEngineScores]
  );

  // Cross-Filter States
  const [selectedEngines, setSelectedEngines] = useState<string[]>(() =>
    initialEngineScores.map((e) => e.engineId)
  );
  const [selectedSentimentCategory, setSelectedSentimentCategory] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>(() => competitors.map((c) => c.id));
  const [selectedCitationDomain, setSelectedCitationDomain] = useState<string | null>(null);

  // Telemetry Table Inline Filter State
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'mentioned' | 'missing'>('all');
  const [tableCitationFilter, setTableCitationFilter] = useState<'all' | 'has_citations' | 'high_citations'>('all');

  // Engine toggling from EngineComparisonChart (single-click isolates, re-click restores all)
  const handleToggleEngine = (engineId: string) => {
    setSelectedEngines((prev) => {
      if (prev.length === allEngineIds.length) {
        return [engineId];
      }
      if (prev.length === 1 && prev.includes(engineId)) {
        return allEngineIds;
      }
      if (prev.includes(engineId)) {
        const next = prev.filter((id) => id !== engineId);
        return next.length === 0 ? allEngineIds : next;
      } else {
        return [...prev, engineId];
      }
    });
  };

  const handleResetEngines = () => {
    setSelectedEngines(allEngineIds);
  };

  // Competitor toggling from SovTrendChart legend
  const handleToggleCompetitor = (compKey: string) => {
    setSelectedCompetitors((prev) =>
      prev.includes(compKey) ? prev.filter((k) => k !== compKey) : [...prev, compKey]
    );
  };

  const handleResetTableFilters = () => {
    setTableSearchQuery('');
    setTableStatusFilter('all');
    setTableCitationFilter('all');
    setSelectedCitationDomain(null);
    setSelectedSentimentCategory('all');
    setSelectedEngines(allEngineIds);
  };

  const handleResetAllCrossFilters = () => {
    handleResetTableFilters();
  };

  // Dynamically Filter Telemetry Runs based on active chart clicks and table inputs
  const filteredRuns = useMemo(() => {
    return initialRuns.filter((run) => {
      // 1. Engine Filter
      const isEngineSelected =
        selectedEngines.length === 0 ||
        selectedEngines.length === allEngineIds.length ||
        selectedEngines.some((engId) => matchesEngineId(run.engine, engId));
      if (!isEngineSelected) return false;

      // 2. Sentiment Donut Category Filter
      if (selectedSentimentCategory !== 'all') {
        if (run.sentiment !== selectedSentimentCategory) return false;
      }

      // 3. Citation Domain Cross-Filter
      if (selectedCitationDomain) {
        const domainLower = selectedCitationDomain.toLowerCase();
        const hasMatchingCitation = run.citedUrls?.some((u) =>
          u.toLowerCase().includes(domainLower)
        );
        const matchesInQuery = run.queryText.toLowerCase().includes(domainLower);
        if (!hasMatchingCitation && !matchesInQuery) return false;
      }

      // 4. Table Search Query
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase().trim();
        const matchesQuery = run.queryText.toLowerCase().includes(q);
        const matchesEngineName = run.engine.toLowerCase().includes(q);
        const matchesCompetitor = run.competitorsMentioned?.some((c) =>
          c.name.toLowerCase().includes(q)
        );
        if (!matchesQuery && !matchesEngineName && !matchesCompetitor) return false;
      }

      // 5. Table Status Filter
      if (tableStatusFilter === 'mentioned' && !run.brandMentioned) return false;
      if (tableStatusFilter === 'missing' && run.brandMentioned) return false;

      // 6. Table Citation Filter
      if (tableCitationFilter === 'has_citations' && run.citedUrlsCount === 0) return false;
      if (tableCitationFilter === 'high_citations' && run.citedUrlsCount < 3) return false;

      return true;
    });
  }, [
    initialRuns,
    selectedEngines,
    allEngineIds.length,
    selectedSentimentCategory,
    selectedCitationDomain,
    tableSearchQuery,
    tableStatusFilter,
    tableCitationFilter,
  ]);

  // Dynamically Filter Summary Metrics based on filtered slice & benchmark datasets
  const dynamicSummaryMetrics = useMemo(() => {
    // 1. Top Performing Engine dynamically derived from benchmark scores
    const activeEngines = selectedEngines.length > 0 && selectedEngines.length < allEngineIds.length
      ? initialEngineScores.filter((e) => selectedEngines.includes(e.engineId))
      : initialEngineScores;
    const enginesToConsider = activeEngines.length > 0 ? activeEngines : initialEngineScores;
    const topEngineData = enginesToConsider.length > 0
      ? enginesToConsider.reduce((prev, curr) => (curr.brandScore > prev.brandScore ? curr : prev), enginesToConsider[0])
      : null;

    // 2. Net Sentiment calculation aligned with distribution breakdown
    const positiveSlice = initialSentimentSlices.find((s) => s.category === 'positive')?.value ?? 0;
    const negativeSlice = initialSentimentSlices.find((s) => s.category === 'negative')?.value ?? 0;
    const baselineNetSentiment = positiveSlice - negativeSlice;

    const isFiltered = filteredRuns.length !== initialRuns.length || selectedSentimentCategory !== 'all';
    let netSentiment = baselineNetSentiment;

    if (selectedSentimentCategory === 'positive') {
      netSentiment = 100;
    } else if (selectedSentimentCategory === 'negative') {
      netSentiment = -100;
    } else if (selectedSentimentCategory === 'neutral') {
      netSentiment = 0;
    } else if (isFiltered && filteredRuns.length > 0) {
      const positiveRuns = filteredRuns.filter((r) => r.sentiment === 'positive').length;
      const negativeRuns = filteredRuns.filter((r) => r.sentiment === 'negative').length;
      netSentiment = Math.round(((positiveRuns - negativeRuns) / filteredRuns.length) * 100);
    }

    const sentimentLabel: 'Positive' | 'Neutral' | 'Negative' =
      netSentiment >= 20 ? 'Positive' : netSentiment <= -20 ? 'Negative' : 'Neutral';

    // 3. Verified Citations cumulative total and monthly delta reconciliation
    let totalCitations = initialSummaryMetrics.totalCitations;
    let citationsDelta = initialSummaryMetrics.citationsDelta;

    if (selectedCitationDomain) {
      const domainItem = initialCitationDomains.find(
        (d) => d.domain.toLowerCase() === selectedCitationDomain.toLowerCase()
      );
      if (domainItem) {
        totalCitations = domainItem.citations;
        citationsDelta = Math.max(1, Math.round(domainItem.citations * 0.17));
      }
    } else if (isFiltered && filteredRuns.length > 0) {
      const runCitations = filteredRuns.reduce((acc, r) => acc + (r.citedUrlsCount || 0), 0);
      totalCitations = runCitations;
      citationsDelta = Math.max(1, Math.round(runCitations * 0.2));
    }

    // 4. Share of Voice
    const totalVisibility = filteredRuns.reduce((acc, r) => acc + r.visibilityScore, 0);
    const avgSov = filteredRuns.length > 0
      ? Number((totalVisibility / filteredRuns.length).toFixed(1))
      : initialSummaryMetrics.totalSov;

    return {
      totalSov: avgSov,
      sovDelta: initialSummaryMetrics.sovDelta,
      sentimentScore: Math.abs(netSentiment),
      sentimentLabel,
      totalCitations,
      citationsDelta,
      topEngine: {
        name: topEngineData?.engine || 'None',
        score: topEngineData?.brandScore || 0,
        winRate: topEngineData?.brandScore || 0,
      },
    };
  }, [
    filteredRuns,
    initialRuns.length,
    initialSummaryMetrics,
    initialEngineScores,
    initialCitationDomains,
    initialSentimentSlices,
    selectedEngines,
    allEngineIds.length,
    selectedSentimentCategory,
    selectedCitationDomain,
  ]);

  // Dynamic SOV Trend scaled according to filtered Share of Voice
  const dynamicSovTrendData = useMemo(() => {
    const baseSov = initialSummaryMetrics.totalSov;
    const currentSov = dynamicSummaryMetrics.totalSov;
    const baseData = fullSovTrendData['30d'] || [];
    if (baseSov === 0 || currentSov === baseSov || baseData.length === 0) return baseData;
    const factor = currentSov / baseSov;
    return baseData.map((pt) => ({
      ...pt,
      brand: Math.min(100, Math.max(5, Math.round(pt.brand * factor * 10) / 10)),
    }));
  }, [fullSovTrendData, initialSummaryMetrics.totalSov, dynamicSummaryMetrics.totalSov]);

  // Dynamic Citation Domains derived from filteredRuns
  const dynamicCitationDomains = useMemo(() => {
    const isFiltered =
      selectedEngines.length < allEngineIds.length ||
      selectedSentimentCategory !== 'all' ||
      tableSearchQuery.trim() !== '' ||
      tableStatusFilter !== 'all' ||
      tableCitationFilter !== 'all';

    if (!isFiltered) {
      return initialCitationDomains;
    }

    const domainCounts: Record<string, number> = {};
    filteredRuns.forEach((run) => {
      run.citedUrls?.forEach((rawUrl) => {
        try {
          const parsed = new URL(rawUrl);
          const host = parsed.hostname.replace(/^www\./, '');
          domainCounts[host] = (domainCounts[host] || 0) + 1;
        } catch {
          const cleaned = rawUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
          if (cleaned) domainCounts[cleaned] = (domainCounts[cleaned] || 0) + 1;
        }
      });
    });

    const totalFilteredCitations = Object.values(domainCounts).reduce((a, b) => a + b, 0);
    if (totalFilteredCitations === 0) {
      return initialCitationDomains.map((d) => ({
        ...d,
        citations: 0,
        percentage: 0,
      }));
    }

    return Object.entries(domainCounts)
      .map(([domain, count]) => {
        const initialMatch = initialCitationDomains.find(
          (id) => id.domain.toLowerCase() === domain.toLowerCase()
        );
        return {
          domain,
          citations: count,
          percentage: Math.round((count / totalFilteredCitations) * 1000) / 10,
          isBrandDomain: initialMatch?.isBrandDomain ?? false,
        };
      })
      .sort((a, b) => b.citations - a.citations);
  }, [
    filteredRuns,
    initialCitationDomains,
    selectedEngines.length,
    allEngineIds.length,
    selectedSentimentCategory,
    tableSearchQuery,
    tableStatusFilter,
    tableCitationFilter,
  ]);

  // Dynamic Engine Visibility Scores derived from filteredRuns
  const dynamicEngineScores = useMemo(() => {
    const isFiltered =
      selectedSentimentCategory !== 'all' ||
      selectedCitationDomain !== null ||
      tableSearchQuery.trim() !== '' ||
      tableStatusFilter !== 'all' ||
      tableCitationFilter !== 'all';

    if (!isFiltered) {
      return initialEngineScores;
    }

    return initialEngineScores.map((scoreItem) => {
      const matchingRuns = filteredRuns.filter((r) =>
        matchesEngineId(r.engine, scoreItem.engineId)
      );

      if (matchingRuns.length > 0) {
        const avgScore = Math.round(
          matchingRuns.reduce((acc, r) => acc + r.visibilityScore, 0) / matchingRuns.length
        );
        return {
          ...scoreItem,
          brandScore: avgScore,
        };
      }

      return scoreItem;
    });
  }, [
    initialEngineScores,
    filteredRuns,
    selectedSentimentCategory,
    selectedCitationDomain,
    tableSearchQuery,
    tableStatusFilter,
    tableCitationFilter,
  ]);

  // Dynamic Sentiment Slices derived from filteredRuns
  const dynamicSentimentSlices = useMemo(() => {
    const isFiltered =
      selectedEngines.length < allEngineIds.length ||
      selectedCitationDomain !== null ||
      tableSearchQuery.trim() !== '' ||
      tableStatusFilter !== 'all' ||
      tableCitationFilter !== 'all';

    if (!isFiltered || filteredRuns.length === 0) {
      return initialSentimentSlices;
    }

    const positiveRuns = filteredRuns.filter((r) => r.sentiment === 'positive').length;
    const neutralRuns = filteredRuns.filter((r) => r.sentiment === 'neutral').length;
    const negativeRuns = filteredRuns.filter((r) => r.sentiment === 'negative').length;
    const total = filteredRuns.length;

    const posPct = Math.round((positiveRuns / total) * 100);
    const neuPct = Math.round((neutralRuns / total) * 100);
    const negPct = Math.max(0, 100 - posPct - neuPct);

    return [
      { name: 'Positive Sentiment', category: 'positive' as const, value: posPct, color: 'var(--chart-emerald)' },
      { name: 'Neutral Sentiment', category: 'neutral' as const, value: neuPct, color: '#94a3b8' },
      { name: 'Critical / Negative', category: 'negative' as const, value: negPct, color: 'var(--chart-rose)' },
    ];
  }, [
    initialSentimentSlices,
    filteredRuns,
    selectedEngines.length,
    allEngineIds.length,
    selectedCitationDomain,
    tableSearchQuery,
    tableStatusFilter,
    tableCitationFilter,
  ]);

  const isEngineFiltered = selectedEngines.length < allEngineIds.length;
  const isSentimentFiltered = selectedSentimentCategory !== 'all';
  const isDomainFiltered = selectedCitationDomain !== null;
  const isAnyFilterActive = isEngineFiltered || isSentimentFiltered || isDomainFiltered;

  return (
    <div className="space-y-6">
      {/* 1. TOP SUMMARY METRIC CARDS */}
      <SummaryCards metrics={dynamicSummaryMetrics} />

      {/* 2. ACTIVE FILTERS BAR */}
      {isAnyFilterActive && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-500 font-medium font-sans">
              <Filter className="h-3.5 w-3.5 text-zinc-600" />
              Active Filters:
            </span>

            {/* Engine filter pill */}
            {isEngineFiltered && (
              <Badge
                variant="outline"
                className="bg-white border-zinc-200 text-zinc-800 font-sans font-normal text-xs py-0.5 px-2.5 gap-1.5 rounded-full shadow-2xs flex items-center"
              >
                <span>
                  {selectedEngines.length === 1
                    ? `Engine: ${initialEngineScores.find((e) => e.engineId === selectedEngines[0])?.engine || selectedEngines[0]}`
                    : `${selectedEngines.length} Engines`}
                </span>
                <button
                  type="button"
                  onClick={handleResetEngines}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer text-[13px] leading-none ml-0.5"
                  aria-label="Clear engine filter"
                >
                  ✕
                </button>
              </Badge>
            )}

            {/* Sentiment filter pill */}
            {isSentimentFiltered && (
              <Badge
                variant="outline"
                className="bg-white border-zinc-200 text-zinc-800 font-sans font-normal text-xs py-0.5 px-2.5 gap-1.5 rounded-full shadow-2xs flex items-center capitalize"
              >
                <span>Tone: {selectedSentimentCategory === 'negative' ? 'Critical' : selectedSentimentCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSentimentCategory('all')}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer text-[13px] leading-none ml-0.5"
                  aria-label="Clear sentiment filter"
                >
                  ✕
                </button>
              </Badge>
            )}

            {/* Citation domain filter pill */}
            {isDomainFiltered && (
              <Badge
                variant="outline"
                className="bg-white border-zinc-200 text-zinc-800 font-sans font-normal text-xs py-0.5 px-2.5 gap-1.5 rounded-full shadow-2xs flex items-center"
              >
                <span>Domain: {selectedCitationDomain}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCitationDomain(null)}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer text-[13px] leading-none ml-0.5"
                  aria-label="Clear domain filter"
                >
                  ✕
                </button>
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetAllCrossFilters}
            className="flex items-center gap-1.5 text-xs font-sans text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* 3. RESTRUCTURED 2x2 CHART GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Multi-Line Share of Voice Trend Graph */}
        <SovTrendChart
          data={dynamicSovTrendData}
          brandName={brandName}
          competitors={competitors}
          visibleCompetitors={selectedCompetitors}
          onToggleCompetitor={handleToggleCompetitor}
          dateRangeLabel="30 Days"
        />

        {/* Card 2: Top Cited Authority Domains */}
        <CitationSourcesChart
          data={dynamicCitationDomains}
          selectedDomain={selectedCitationDomain}
          onSelectDomain={setSelectedCitationDomain}
          brandName={brandName}
        />

        {/* Card 3: Engine Visibility Benchmark */}
        <EngineComparisonChart
          data={dynamicEngineScores}
          brandName={brandName}
          selectedEngines={selectedEngines}
          onToggleEngine={handleToggleEngine}
          onResetEngines={handleResetEngines}
        />

        {/* Card 4: Brand Sentiment Distribution Donut */}
        <SentimentDonutChart
          data={dynamicSentimentSlices}
          selectedCategory={selectedSentimentCategory}
          onSelectCategory={setSelectedSentimentCategory}
          netScore={dynamicSummaryMetrics.sentimentScore}
          brandName={brandName}
        />
      </div>

      {/* 4. INTERACTIVE TELEMETRY TABLE */}
      <RecentActivityTable
        runs={filteredRuns}
        filterOptions={{
          searchQuery: tableSearchQuery,
          onSearchChange: setTableSearchQuery,
          statusFilter: tableStatusFilter,
          onStatusFilterChange: setTableStatusFilter,
          citationFilter: tableCitationFilter,
          onCitationFilterChange: setTableCitationFilter,
          activeCitationDomainFilter: selectedCitationDomain,
          onClearCitationDomainFilter: () => setSelectedCitationDomain(null),
          onResetTableFilters: handleResetTableFilters,
        }}
      />
    </div>
  );
}
