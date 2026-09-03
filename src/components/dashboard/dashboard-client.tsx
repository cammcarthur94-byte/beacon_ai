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

  // Dynamically Filter Summary Metrics based on filtered slice
  const dynamicSummaryMetrics = useMemo(() => {
    if (filteredRuns.length === 0) {
      return initialSummaryMetrics;
    }

    const totalVisibility = filteredRuns.reduce((acc, r) => acc + r.visibilityScore, 0);
    const avgSov = Number((totalVisibility / filteredRuns.length).toFixed(1));
    const totalCitations = filteredRuns.reduce((acc, r) => acc + r.citedUrlsCount, 0);

    const positiveRuns = filteredRuns.filter((r) => r.sentiment === 'positive').length;
    const negativeRuns = filteredRuns.filter((r) => r.sentiment === 'negative').length;
    const netSentiment = Math.round(((positiveRuns - negativeRuns) / filteredRuns.length) * 100);

    const sentimentLabel: 'Positive' | 'Neutral' | 'Negative' =
      netSentiment >= 20 ? 'Positive' : netSentiment <= -20 ? 'Negative' : 'Neutral';

    return {
      totalSov: avgSov,
      sovDelta: initialSummaryMetrics.sovDelta,
      sentimentScore: Math.max(0, netSentiment),
      sentimentLabel,
      totalCitations,
      citationsDelta: initialSummaryMetrics.citationsDelta,
      topEngine: initialSummaryMetrics.topEngine,
    };
  }, [filteredRuns, initialSummaryMetrics]);

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
        filters={{
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
