'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
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
  // Cross-Filter States from Charts
  const ALL_ENGINE_IDS = [
    'chatgpt',
    'gemini',
    'claude',
    'perplexity',
    'google_ai_overview',
    'google_ai_mode',
  ];
  const [selectedEngines, setSelectedEngines] = useState<string[]>(ALL_ENGINE_IDS);
  const [selectedSentimentCategory, setSelectedSentimentCategory] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>(competitors.map((c) => c.id));
  const [selectedCitationDomain, setSelectedCitationDomain] = useState<string | null>(null);

  // Telemetry Table Inline Filter State
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'mentioned' | 'missing'>('all');
  const [tableCitationFilter, setTableCitationFilter] = useState<'all' | 'has_citations' | 'high_citations'>('all');

  // Engine toggling from EngineComparisonChart
  const handleToggleEngine = (engineId: string) => {
    setSelectedEngines((prev) => {
      if (prev.includes(engineId)) {
        if (prev.length === 1) return ALL_ENGINE_IDS; // reset to all if clicking the only active
        return prev.filter((id) => id !== engineId);
      } else {
        return [...prev, engineId];
      }
    });
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
    setSelectedEngines(ALL_ENGINE_IDS);
  };

  // Dynamically Filter Telemetry Runs based on active chart clicks and table inputs
  const filteredRuns = useMemo(() => {
    return initialRuns.filter((run) => {
      // 1. Engine Filter
      const runEngineKey = run.engine.toLowerCase();
      const matchesEngine =
        selectedEngines.length === 0 ||
        selectedEngines.some((eng) => runEngineKey.includes(eng));
      if (!matchesEngine) return false;

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
        if (!matchesQuery && !matchesEngineName) return false;
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
    selectedSentimentCategory,
    selectedCitationDomain,
    tableSearchQuery,
    tableStatusFilter,
    tableCitationFilter,
  ]);

  // Dynamically Filter Summary Metrics based on filtered slice & benchmark datasets
  const dynamicSummaryMetrics = useMemo(() => {
    // 1. Top Performing Engine dynamically derived from benchmark scores
    const activeEngines = selectedEngines.length > 0
      ? initialEngineScores.filter((e) => selectedEngines.includes(e.engineId))
      : initialEngineScores;
    const topEngineData = (activeEngines.length > 0 ? activeEngines : initialEngineScores).reduce(
      (prev, curr) => (curr.brandScore > prev.brandScore ? curr : prev),
      initialEngineScores[0]
    );

    // 2. Net Sentiment calculation aligned with distribution breakdown
    const positiveSlice = initialSentimentSlices.find((s) => s.category === 'positive')?.value ?? 68;
    const negativeSlice = initialSentimentSlices.find((s) => s.category === 'negative')?.value ?? 8;
    const baselineNetSentiment = positiveSlice - negativeSlice; // Standard formula: 68% - 8% = +60

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
    let totalCitations = initialSummaryMetrics.totalCitations; // 164 cumulative total
    let citationsDelta = initialSummaryMetrics.citationsDelta; // +28 this month

    if (selectedCitationDomain) {
      const domainItem = initialCitationDomains.find(
        (d) => d.domain.toLowerCase() === selectedCitationDomain.toLowerCase()
      );
      if (domainItem) {
        totalCitations = domainItem.citations;
        citationsDelta = Math.max(1, Math.round(domainItem.citations * 0.17));
      }
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
        name: topEngineData.engine,
        score: topEngineData.brandScore,
        winRate: topEngineData.brandScore,
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
    selectedSentimentCategory,
    selectedCitationDomain,
  ]);

  return (
    <div className="space-y-8">
      {/* 1. TOP SUMMARY METRIC CARDS */}
      <SummaryCards metrics={dynamicSummaryMetrics} />

      {/* 2. RESTRUCTURED 2x2 CHART GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Multi-Line Share of Voice Trend Graph */}
        <SovTrendChart
          data={fullSovTrendData['30d']}
          brandName={brandName}
          competitors={competitors}
          visibleCompetitors={selectedCompetitors}
          onToggleCompetitor={handleToggleCompetitor}
          dateRangeLabel="30 Days"
        />

        {/* Card 2: Top Cited Authority Domains */}
        <CitationSourcesChart
          data={initialCitationDomains}
          selectedDomain={selectedCitationDomain}
          onSelectDomain={setSelectedCitationDomain}
          brandName={brandName}
        />

        {/* Card 3: Engine Visibility Benchmark */}
        <EngineComparisonChart
          data={initialEngineScores}
          brandName={brandName}
          selectedEngines={selectedEngines}
          onToggleEngine={handleToggleEngine}
        />

        {/* Card 4: Brand Sentiment Distribution Donut */}
        <SentimentDonutChart
          data={initialSentimentSlices}
          selectedCategory={selectedSentimentCategory}
          onSelectCategory={setSelectedSentimentCategory}
          netScore={dynamicSummaryMetrics.sentimentScore}
          brandName={brandName}
        />
      </div>

      {/* 3. INTERACTIVE TELEMETRY TABLE */}
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
