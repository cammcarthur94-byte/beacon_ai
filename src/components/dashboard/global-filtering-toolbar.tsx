'use client';

import * as React from 'react';
import { Calendar, Cpu, Users, RotateCcw, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EngineBadge } from '@/components/ui/engine-badge';
import { SentimentRangeSlider } from './sentiment-range-slider';
import { cn } from '@/lib/utils';
import type { CompetitorMeta } from './sov-trend-chart';

const ALL_ENGINES = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'google_ai_overview', label: 'AI Overview' },
  { id: 'google_ai_mode', label: 'AI Mode' },
];

interface GlobalFilteringToolbarProps {
  dateRange: '7d' | '30d' | '90d';
  onDateRangeChange: (range: '7d' | '30d' | '90d') => void;

  selectedEngines: string[];
  onToggleEngine: (engineId: string) => void;
  onClearEngines: () => void;

  sentimentRange: [number, number];
  onSentimentRangeChange: (range: [number, number]) => void;

  competitors: CompetitorMeta[];
  selectedCompetitors: string[];
  onToggleCompetitor: (competitorId: string) => void;

  selectedCitationDomain: string | null;
  onClearCitationDomain: () => void;

  selectedSentimentCategory: 'all' | 'positive' | 'neutral' | 'negative';
  onClearSentimentCategory: () => void;

  onResetAllFilters: () => void;
  totalFilteredPromptsCount: number;
}

export function GlobalFilteringToolbar({
  dateRange,
  onDateRangeChange,
  selectedEngines,
  onToggleEngine,
  onClearEngines,
  sentimentRange,
  onSentimentRangeChange,
  competitors,
  selectedCompetitors,
  onToggleCompetitor,
  selectedCitationDomain,
  onClearCitationDomain,
  selectedSentimentCategory,
  onClearSentimentCategory,
  onResetAllFilters,
  totalFilteredPromptsCount,
}: GlobalFilteringToolbarProps) {
  const isDateFiltered = dateRange !== '30d';
  const isEngineFiltered = selectedEngines.length > 0 && selectedEngines.length < ALL_ENGINES.length;
  const isSentimentSliderFiltered = sentimentRange[0] !== -100 || sentimentRange[1] !== 100;
  const isSentimentCategoryFiltered = selectedSentimentCategory !== 'all';
  const isCompetitorsFiltered = selectedCompetitors.length < competitors.length;
  const isCitationFiltered = Boolean(selectedCitationDomain);

  const activeFiltersCount =
    (isDateFiltered ? 1 : 0) +
    (isEngineFiltered ? 1 : 0) +
    (isSentimentSliderFiltered ? 1 : 0) +
    (isSentimentCategoryFiltered ? 1 : 0) +
    (isCitationFiltered ? 1 : 0);

  const hasAnyFilterActive = activeFiltersCount > 0;

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-zinc-200 py-3 px-4 sm:px-6 -mx-4 sm:-mx-6 transition-all shadow-xs">
      <div className="flex flex-col gap-3">
        {/* Main Controls Row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* 1. Date Range Preset Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-zinc-500 font-medium flex items-center gap-1 mr-0.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              Range:
            </span>
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs font-mono">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onDateRangeChange(r)}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-all cursor-pointer uppercase',
                    dateRange === r
                      ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Engine Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono text-zinc-500 font-medium flex items-center gap-1 mr-0.5">
              <Cpu className="h-3.5 w-3.5 text-zinc-400" />
              Engines:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {ALL_ENGINES.map((eng) => {
                const isSelected = selectedEngines.length === 0 || selectedEngines.includes(eng.id);
                return (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => onToggleEngine(eng.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-all cursor-pointer',
                      isSelected
                        ? 'border-zinc-900 bg-zinc-50 text-zinc-950 font-medium ring-1 ring-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-400 opacity-60 hover:opacity-100'
                    )}
                  >
                    <EngineBadge engine={eng.id} size="xs" showLabel={true} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Dual-Handle Sentiment Slider */}
          <div className="flex items-center">
            <SentimentRangeSlider
              value={sentimentRange}
              onChange={onSentimentRangeChange}
            />
          </div>

          {/* 4. Competitor Comparison Toggle Pills */}
          {competitors.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-mono text-zinc-500 font-medium flex items-center gap-1 mr-0.5">
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                Rivals:
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {competitors.map((comp) => {
                  const isSelected = selectedCompetitors.includes(comp.id);
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => onToggleCompetitor(comp.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-mono transition-all cursor-pointer',
                        isSelected
                          ? 'border-zinc-300 bg-white text-zinc-900 font-medium shadow-2xs'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-400 line-through opacity-60'
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: comp.color }} />
                      <span>{comp.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* High-Visibility Persistent Active Filters Strip */}
        {hasAnyFilterActive && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 flex-wrap text-xs font-mono animate-in fade-in-50">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-zinc-500 font-semibold flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-zinc-700" /> Active Filters:
              </span>

              {/* Date Filter Pill */}
              {isDateFiltered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                  <span>Range: {dateRange}</span>
                  <button
                    type="button"
                    onClick={() => onDateRangeChange('30d')}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Engine Filter Pill */}
              {isEngineFiltered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                  <span>Engines: {selectedEngines.join(', ')}</span>
                  <button
                    type="button"
                    onClick={onClearEngines}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Sentiment Slider Filter Pill */}
              {isSentimentSliderFiltered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                  <span>Sentiment: {sentimentRange[0]} to {sentimentRange[1]}</span>
                  <button
                    type="button"
                    onClick={() => onSentimentRangeChange([-100, 100])}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Sentiment Donut Slice Filter Pill */}
              {isSentimentCategoryFiltered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize font-medium">
                  <span>Category: {selectedSentimentCategory}</span>
                  <button
                    type="button"
                    onClick={onClearSentimentCategory}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Citation Domain Filter Pill */}
              {isCitationFiltered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                  <span>Domain: {selectedCitationDomain}</span>
                  <button
                    type="button"
                    onClick={onClearCitationDomain}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-500">
                <span className="font-bold text-zinc-900">{totalFilteredPromptsCount}</span> telemetry prompts match
              </span>
              <button
                type="button"
                onClick={onResetAllFilters}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer underline"
              >
                <RotateCcw className="h-3 w-3" /> Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
