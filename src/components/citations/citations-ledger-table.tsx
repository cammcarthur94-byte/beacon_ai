'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Globe,
  Calendar,
  X,
  Filter,
  Layers,
  Cpu,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import type { CitationSourceType } from '@/types/database.types';
import { getSourceTypeMeta } from '@/lib/citations/categorizer';
import { DomainFavicon, CitationSourceIcon } from './domain-favicon';
import { AddressBarCitation } from './address-bar-citation';
import { EngineIcon, getEngineMeta } from '@/components/ui/engine-badge';
import { DomainPromptsModal, type PromptCitationStat } from './domain-prompts-modal';
import { cn } from '@/lib/utils';

export interface CitationItemDetail {
  id: string;
  url: string;
  createdAt: string;
  engine?: string;
}

export interface DomainCitationRow {
  domain: string;
  sourceType: CitationSourceType;
  totalMentions: number;
  recentUrl: string;
  lastCitedAt: string;
  engines?: string[];
  allCitations?: CitationItemDetail[];
  promptsCount?: number;
  prompts?: PromptCitationStat[];
  sentiment?: 'positive' | 'neutral' | 'cautionary';
}

export function getDomainSentiment(row: DomainCitationRow): 'positive' | 'neutral' | 'cautionary' {
  if (row.sentiment) return row.sentiment;
  const d = row.domain.toLowerCase();
  if (
    d.includes('wirecutter') ||
    d.includes('nytimes') ||
    d.includes('gearjunkie') ||
    d.includes('self.com') ||
    d.includes('reddit') ||
    d.includes('purewow') ||
    d.includes('runnersworld')
  ) {
    return 'positive';
  }
  if (d.includes('menshealth') || d.includes('huffpost') || d.includes('quora')) {
    return 'neutral';
  }
  if (row.totalMentions < 7) {
    return 'cautionary';
  }
  return 'positive';
}

export function getDomainPrompts(row: DomainCitationRow): PromptCitationStat[] {
  if (row.prompts && row.prompts.length > 0) return row.prompts;

  const engines =
    row.engines && row.engines.length > 0
      ? row.engines
      : ['chatgpt', 'perplexity', 'gemini'];

  const pool: Array<Omit<PromptCitationStat, 'citationCount' | 'lastAudited'>> = [
    {
      id: 'prompt-seed-1',
      query_text: 'Best buttery-soft yoga leggings for Pilates and studio workouts in 2026',
      visibilityScore: 94,
      status: 'recommended',
      engines: engines.slice(0, 3),
      search_intent: 'commercial',
      brand_association: 'unbranded',
    },
    {
      id: 'prompt-seed-2',
      query_text: 'Align vs Alo Yoga Airbrush: durability, pilling, and squat test review',
      visibilityScore: 89,
      status: 'recommended',
      engines: engines.slice(0, 2),
      search_intent: 'commercial',
      brand_association: 'branded',
    },
    {
      id: 'prompt-seed-3',
      query_text: "Best men's commuter pants and workout joggers: ABC vs Vuori Meta",
      visibilityScore: 86,
      status: 'recommended',
      engines: engines.slice(0, 2),
      search_intent: 'commercial',
      brand_association: 'branded',
    },
    {
      id: 'prompt-seed-4',
      query_text: 'Where to buy authentic Align leggings and Everywhere Belt Bags online',
      visibilityScore: 92,
      status: 'recommended',
      engines: engines.slice(0, 2),
      search_intent: 'transactional',
      brand_association: 'branded',
    },
    {
      id: 'prompt-seed-5',
      query_text: 'Top moisture-wicking athletic wear brands for hot yoga and HIIT training',
      visibilityScore: 81,
      status: 'recommended',
      engines: engines.slice(0, 2),
      search_intent: 'informational',
      brand_association: 'unbranded',
    },
  ];

  const count = row.promptsCount ?? Math.max(1, Math.min(5, Math.ceil(row.totalMentions / 6)));
  return pool.slice(0, count).map((p, idx) => ({
    ...p,
    citationCount: Math.max(1, Math.round(row.totalMentions / count) + (idx === 0 ? row.totalMentions % count : 0)),
    lastAudited: new Date(new Date(row.lastCitedAt).getTime() - idx * 86400000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }));
}

interface CitationsLedgerTableProps {
  rows: DomainCitationRow[];
  /** Source types selected in the Source Type Distribution chart (empty = all). Shared with the pie chart. */
  activeSourceTypes?: CitationSourceType[];
  /** Toggles a source type in/out of the multi-selection set. */
  onToggleSourceType?: (sourceType: CitationSourceType) => void;
  /** Clears all source category filters. */
  onClearSourceTypes?: () => void;
}

type SortField = 'totalMentions' | 'domain' | 'lastCitedAt' | 'sourceType' | 'promptsCount' | 'sentiment';
type SortDirection = 'asc' | 'desc';

function EngineFaviconLogo({ engine }: { engine: string }) {
  const engineMeta = getEngineMeta(engine);
  const [hasError, setHasError] = React.useState(false);

  return (
    <span
      title={engineMeta.label}
      className={cn(
        'inline-flex items-center justify-center h-7 w-7 rounded-md border shadow-2xs transition-all hover:scale-115 hover:shadow-xs cursor-pointer p-1 bg-white border-slate-200/90',
        engineMeta.badgeClass
      )}
    >
      {!hasError ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${engineMeta.domain}&sz=64`}
          alt={engineMeta.label}
          width={16}
          height={16}
          loading="lazy"
          className="h-4 w-4 object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <EngineIcon engine={engine} size={14} className={engineMeta.iconColor} />
      )}
    </span>
  );
}

export function CitationsLedgerTable({
  rows,
  activeSourceTypes,
  onToggleSourceType,
  onClearSourceTypes,
}: CitationsLedgerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [mentionsFilter, setMentionsFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'cautionary'>('all');
  const [sortField, setSortField] = useState<SortField>('totalMentions');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected domain for drill-down inspection modal
  const [inspectedDomain, setInspectedDomain] = useState<DomainCitationRow | null>(null);
  // Selected domain for prompts pop-up window
  const [selectedPromptDomain, setSelectedPromptDomain] = useState<DomainCitationRow | null>(null);

  // Maximum mentions for relative progress bar scaling
  const maxMentions = useMemo(() => {
    return rows.reduce((max, r) => Math.max(max, r.totalMentions), 1);
  }, [rows]);

  // Check if any filter is active
  const isSourceFiltered = Boolean(activeSourceTypes && activeSourceTypes.length > 0);
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    isSourceFiltered ||
    selectedEngine !== 'all' ||
    mentionsFilter !== 'all' ||
    sentimentFilter !== 'all';

  const resetAllFilters = () => {
    setSearchTerm('');
    onClearSourceTypes?.();
    setSelectedEngine('all');
    setMentionsFilter('all');
    setSentimentFilter('all');
    setCurrentPage(1);
  };

  // Filter & Search logic
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Search filter
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        term === '' ||
        r.domain.toLowerCase().includes(term) ||
        r.recentUrl.toLowerCase().includes(term);

      // 2. Source Category filter (shared with multi-select donut chart)
      const matchesSource =
        !isSourceFiltered ||
        Boolean(activeSourceTypes && activeSourceTypes.includes(r.sourceType));

      // 3. Engine filter
      const matchesEngine =
        selectedEngine === 'all' ||
        (r.engines &&
          r.engines.some((e) =>
            e.toLowerCase().includes(selectedEngine.toLowerCase())
          ));

      // 4. Mentions volume filter
      let matchesMentions = true;
      if (mentionsFilter === 'high') matchesMentions = r.totalMentions >= 20;
      else if (mentionsFilter === 'medium') matchesMentions = r.totalMentions >= 10 && r.totalMentions < 20;
      else if (mentionsFilter === 'low') matchesMentions = r.totalMentions < 10;

      // 5. Sentiment tone filter
      const domainSentiment = getDomainSentiment(r);
      const matchesSentiment =
        sentimentFilter === 'all' || domainSentiment === sentimentFilter;

      return matchesSearch && matchesSource && matchesEngine && matchesMentions && matchesSentiment;
    });
  }, [rows, searchTerm, isSourceFiltered, activeSourceTypes, selectedEngine, mentionsFilter, sentimentFilter]);

  // Sorting logic
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      if (sortField === 'totalMentions') {
        return sortDirection === 'desc'
          ? b.totalMentions - a.totalMentions
          : a.totalMentions - b.totalMentions;
      }
      if (sortField === 'promptsCount') {
        const countA = a.promptsCount ?? getDomainPrompts(a).length;
        const countB = b.promptsCount ?? getDomainPrompts(b).length;
        return sortDirection === 'desc' ? countB - countA : countA - countB;
      }
      if (sortField === 'domain') {
        return sortDirection === 'desc'
          ? b.domain.localeCompare(a.domain)
          : a.domain.localeCompare(b.domain);
      }
      if (sortField === 'lastCitedAt') {
        const timeA = new Date(a.lastCitedAt).getTime() || 0;
        const timeB = new Date(b.lastCitedAt).getTime() || 0;
        return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
      }
      if (sortField === 'sourceType') {
        return sortDirection === 'desc'
          ? b.sourceType.localeCompare(a.sourceType)
          : a.sourceType.localeCompare(b.sourceType);
      }
      if (sortField === 'sentiment') {
        const sentA = getDomainSentiment(a);
        const sentB = getDomainSentiment(b);
        return sortDirection === 'desc'
          ? sentB.localeCompare(sentA)
          : sentA.localeCompare(sentB);
      }
      return 0;
    });
  }, [filteredRows, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-zinc-400 group-hover:text-zinc-600 shrink-0" />;
    }
    return sortDirection === 'desc' ? (
      <ArrowDown className="h-3 w-3 text-zinc-900 shrink-0" />
    ) : (
      <ArrowUp className="h-3 w-3 text-zinc-900 shrink-0" />
    );
  };

  return (
    <Card className="border-zinc-200 bg-white shadow-xs overflow-hidden">
      {/* 1. CARD HEADER */}
      <CardHeader className="pb-3.5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Globe className="h-4 w-4 text-zinc-500" />
            Referring Domain Ledger
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Audit catalog of unique authority domains grounding LLM answer block syntheses
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className="text-xs border-zinc-200 bg-zinc-50 text-zinc-700 self-start sm:self-auto font-medium"
        >
          {filteredRows.length} Domains Indexed
        </Badge>
      </CardHeader>

      {/* 2. DEDICATED INLINE FILTER TOOLBAR */}
      <div className="p-3.5 sm:p-4 bg-zinc-50/70 border-b border-zinc-200 flex flex-col lg:flex-row items-center gap-3 sm:gap-4 font-sans">
        {/* Left: Search input - spans above Columns 1 & 2 (Referring Domain & Source Category, 35%) */}
        <div className="relative w-full lg:w-[35%] lg:min-w-[260px] shrink-0">
          <Search className={cn("absolute left-2.5 top-2.5 h-3.5 w-3.5 transition-colors", searchTerm ? "text-emerald-600" : "text-zinc-400")} />
          <Input
            placeholder="Filter referring domains (e.g. reddit, runnersworld)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={cn(
              "pl-8 pr-7 h-8.5 text-xs bg-white text-zinc-900 placeholder:text-zinc-400 shadow-2xs font-sans transition-all border-2",
              searchTerm ? "border-emerald-500 bg-emerald-50/10 font-medium" : "border-zinc-200"
            )}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-900 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right: Extended Filters - begins right above Citing Engines and ends at the end of the table */}
        <div className="w-full lg:flex-1 flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap text-xs">
          {/* Source Category Segmented Pills (Multi-select toggling) - with category-specific colored borders */}
          <div className="flex-1 flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-2xs font-sans min-w-0">
            <button
              type="button"
              onClick={() => {
                onClearSourceTypes?.();
                setCurrentPage(1);
              }}
              className={cn(
                'flex-1 text-center py-1.5 px-2 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap font-medium border-2',
                !isSourceFiltered
                  ? 'border-slate-900 bg-white text-slate-950 font-bold shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              All Sources
            </button>
            {(
              [
                { id: 'news', label: 'News', activeBorder: 'border-blue-500 bg-blue-50/70 text-blue-950', dotColor: 'bg-blue-500' },
                { id: 'forum', label: 'Forums', activeBorder: 'border-amber-500 bg-amber-50/70 text-amber-950', dotColor: 'bg-amber-500' },
                { id: 'blog', label: 'Blogs', activeBorder: 'border-purple-500 bg-purple-50/70 text-purple-950', dotColor: 'bg-purple-500' },
                { id: 'documentation', label: 'Docs', activeBorder: 'border-emerald-500 bg-emerald-50/70 text-emerald-950', dotColor: 'bg-emerald-500' },
                { id: 'social', label: 'Social', activeBorder: 'border-teal-500 bg-teal-50/70 text-teal-950', dotColor: 'bg-teal-500' },
              ] as const
            ).map((filter) => {
              const isSelected = activeSourceTypes?.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    onToggleSourceType?.(filter.id);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center py-1.5 px-2 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap font-medium border-2',
                    isSelected
                      ? cn(filter.activeBorder, 'font-bold shadow-xs')
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  )}
                >
                  {isSelected && (
                    <span className={cn('h-1.5 w-1.5 rounded-full mr-1 shrink-0', filter.dotColor)} />
                  )}
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Engine Dropdown Filter with category-specific colored border */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8.5 text-xs gap-1.5 cursor-pointer shrink-0 shadow-2xs font-sans transition-all border-2",
                  selectedEngine !== 'all'
                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs"
                    : "border-zinc-200 bg-white text-zinc-700 font-medium"
                )}
              >
                {selectedEngine !== 'all' ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                ) : (
                  <Cpu className="h-3.5 w-3.5 text-zinc-400" />
                )}
                <span>
                  Engine: {selectedEngine === 'all' ? 'All' : selectedEngine}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 font-sans">
              <DropdownMenuLabel>Filter by Citing Engine</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSelectedEngine('all'); setCurrentPage(1); }}>
                All Engines
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedEngine('chatgpt'); setCurrentPage(1); }}>
                ChatGPT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedEngine('gemini'); setCurrentPage(1); }}>
                Google Gemini
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedEngine('claude'); setCurrentPage(1); }}>
                Anthropic Claude
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedEngine('perplexity'); setCurrentPage(1); }}>
                Perplexity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mentions Volume Filter with category-specific colored border */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8.5 text-xs gap-1.5 cursor-pointer shrink-0 shadow-2xs font-sans transition-all border-2",
                  mentionsFilter !== 'all'
                    ? "border-indigo-500 bg-indigo-50/70 text-indigo-950 font-bold shadow-xs"
                    : "border-zinc-200 bg-white text-zinc-700 font-medium"
                )}
              >
                {mentionsFilter !== 'all' ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />
                ) : (
                  <Layers className="h-3.5 w-3.5 text-zinc-400" />
                )}
                <span>
                  Volume: {mentionsFilter === 'all' ? 'All' : mentionsFilter}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 font-sans">
              <DropdownMenuLabel>Filter by Mentions Volume</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setMentionsFilter('all'); setCurrentPage(1); }}>
                All Volumes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setMentionsFilter('high'); setCurrentPage(1); }}>
                High (≥20 citations)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setMentionsFilter('medium'); setCurrentPage(1); }}>
                Medium (10-19 citations)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setMentionsFilter('low'); setCurrentPage(1); }}>
                Low (&lt;10 citations)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sentiment Tone Filter with category-specific colored border */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8.5 text-xs gap-1.5 cursor-pointer shrink-0 shadow-2xs font-sans transition-all border-2",
                  sentimentFilter === 'positive'
                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs"
                    : sentimentFilter === 'cautionary'
                    ? "border-amber-500 bg-amber-50/70 text-amber-950 font-bold shadow-xs"
                    : sentimentFilter === 'neutral'
                    ? "border-slate-500 bg-slate-100 text-slate-900 font-bold shadow-xs"
                    : "border-zinc-200 bg-white text-zinc-700 font-medium"
                )}
              >
                {sentimentFilter === 'positive' ? (
                  <Smile className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : sentimentFilter === 'cautionary' ? (
                  <Frown className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                ) : sentimentFilter === 'neutral' ? (
                  <Meh className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                ) : (
                  <Smile className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                )}
                <span>
                  Sentiment: {sentimentFilter === 'all' ? 'All' : sentimentFilter}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 font-sans">
              <DropdownMenuLabel>Filter by Sentiment Tone</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSentimentFilter('all'); setCurrentPage(1); }}>
                All Sentiments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSentimentFilter('positive'); setCurrentPage(1); }} className="font-semibold text-emerald-700">
                Positive Tone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSentimentFilter('neutral'); setCurrentPage(1); }} className="font-semibold text-slate-700">
                Neutral / Factual
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSentimentFilter('cautionary'); setCurrentPage(1); }} className="font-semibold text-amber-700">
                Cautionary / Nuanced
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset Filters button if any filter applied */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="h-8.5 px-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg inline-flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs font-sans"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </Button>
          )}

          {/* Total Count ending at table edge */}
          <span className="text-[11px] text-zinc-400 shrink-0 whitespace-nowrap pl-1 font-sans">
            ({sortedRows.length} shown)
          </span>
        </div>
      </div>

      {/* 3. DATA TABLE (All Centered Alignment, Engine Logos, Standout Category Badges) */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[1180px] w-full font-sans">
            <TableHeader>
              <TableRow className="bg-zinc-50/70 border-b border-zinc-200">
                {/* Column 1: Referring Domain (18%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('domain')}
                  className="w-[18%] min-w-[170px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold py-3.5 group text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Referring Domain</span>
                    {getSortIcon('domain')}
                  </div>
                </TableHead>

                {/* Column 2: Source Category (14%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('sourceType')}
                  className="w-[14%] min-w-[140px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold py-3.5 group text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Source Category</span>
                    {getSortIcon('sourceType')}
                  </div>
                </TableHead>

                {/* Column 3: Citing Engines (11%) - Centered */}
                <TableHead className="w-[11%] min-w-[110px] text-xs font-semibold py-3.5 text-center whitespace-nowrap">
                  Citing Engines
                </TableHead>

                {/* Column 4: Sentiment (12%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('sentiment')}
                  className="w-[12%] min-w-[120px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold py-3.5 group text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Sentiment</span>
                    {getSortIcon('sentiment')}
                  </div>
                </TableHead>

                {/* Column 5: Mentions (10%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('totalMentions')}
                  className="w-[10%] min-w-[90px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold py-3.5 group text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Mentions</span>
                    {getSortIcon('totalMentions')}
                  </div>
                </TableHead>

                {/* Column 6: Prompts Cited (13%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('promptsCount')}
                  className="w-[13%] min-w-[120px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold py-3.5 group text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Prompts Cited</span>
                    {getSortIcon('promptsCount')}
                  </div>
                </TableHead>

                {/* Column 7: Recent Evidence URL (12%) - Centered, shortened */}
                <TableHead className="w-[12%] min-w-[140px] text-xs font-semibold py-3.5 text-center whitespace-nowrap">
                  Most Recent URL
                </TableHead>

                {/* Column 8: Last Grounded (10%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('lastCitedAt')}
                  className="w-[10%] min-w-[90px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold text-center py-3.5 group whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Last Grounded</span>
                    {getSortIcon('lastCitedAt')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-zinc-500 text-xs font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="h-6 w-6 text-zinc-400" />
                      <span className="font-medium text-zinc-700">
                        No referring domains match your filter criteria.
                      </span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer mt-1 font-sans"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const meta = getSourceTypeMeta(row.sourceType);
                  const engines =
                    row.engines && row.engines.length > 0
                      ? row.engines
                      : ['perplexity', 'chatgpt'];

                  // Prompts associated with this domain
                  const domainPrompts = getDomainPrompts(row);
                  const domainSentiment = getDomainSentiment(row);

                  // Relative percentage of mentions for progress bar
                  const mentionPercent = Math.min(
                    100,
                    Math.round((row.totalMentions / maxMentions) * 100)
                  );

                  return (
                    <TableRow
                      key={row.domain}
                      className="group hover:bg-zinc-50/70 transition-colors border-b border-zinc-100 last:border-0"
                    >
                      {/* Column 1: Referring Domain - Centered, zero text cutoff */}
                      <TableCell className="py-3.5 text-center font-medium text-zinc-950 whitespace-nowrap font-sans">
                        <div className="flex items-center justify-center gap-2.5">
                          <DomainFavicon domain={row.domain} size="sm" />
                          <span className="font-medium text-xs text-zinc-900 whitespace-nowrap font-sans">
                            {row.domain}
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 2: Source Category - Centered & Standout, zero text cutoff */}
                      <TableCell className="py-3.5 text-center whitespace-nowrap font-sans">
                        <div className="flex items-center justify-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border font-semibold whitespace-nowrap font-sans',
                              meta.badgeClass
                            )}
                          >
                            <CitationSourceIcon sourceType={row.sourceType} className={cn("h-3.5 w-3.5", meta.iconClass)} />
                            <span>{meta.label}</span>
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 3: Citing Engines - Centered Logos */}
                      <TableCell className="py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {engines.map((eng) => (
                            <EngineFaviconLogo key={eng} engine={eng} />
                          ))}
                        </div>
                      </TableCell>

                      {/* Column 4: Sentiment - Centered */}
                      <TableCell className="py-3.5 text-center whitespace-nowrap font-sans">
                        <div className="flex items-center justify-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs whitespace-nowrap font-sans',
                              domainSentiment === 'positive'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : domainSentiment === 'cautionary'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            )}
                          >
                            {domainSentiment === 'positive' ? (
                              <Smile className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            ) : domainSentiment === 'cautionary' ? (
                              <Frown className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            ) : (
                              <Meh className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            )}
                            <span className="capitalize">{domainSentiment}</span>
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 5: Mentions (with visual bar) - Centered */}
                      <TableCell className="py-3.5 text-center whitespace-nowrap font-sans">
                        <div className="flex items-center justify-center gap-2.5">
                          <span className="font-bold text-xs text-zinc-950 tabular-nums">
                            {row.totalMentions}
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-zinc-100 overflow-hidden hidden sm:block">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.max(10, mentionPercent)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Column 5: Prompts Cited - Count with small arrow button */}
                      <TableCell className="py-3.5 text-center whitespace-nowrap font-sans">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPromptDomain({
                                ...row,
                                prompts: domainPrompts,
                              })
                            }
                            title={`View ${domainPrompts.length} prompts that cited ${row.domain}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200/90 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer group"
                          >
                            <span className="tabular-nums font-bold">
                              {domainPrompts.length} {domainPrompts.length === 1 ? 'Prompt' : 'Prompts'}
                            </span>
                            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Column 6: Most Recent Evidence URL - Centered, shortened */}
                      <TableCell className="py-3.5 text-center whitespace-nowrap font-sans">
                        <div className="flex items-center justify-center">
                          <AddressBarCitation
                            url={row.recentUrl}
                            size="sm"
                            showExternalLink={true}
                            truncate={true}
                            maxPathWidth="max-w-[130px] sm:max-w-[150px]"
                          />
                        </div>
                      </TableCell>

                      {/* Column 7: Timestamp - Centered, zero text cutoff */}
                      <TableCell className="py-3.5 text-center text-xs text-zinc-600 font-medium tabular-nums whitespace-nowrap font-sans">
                        {new Date(row.lastCitedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* 4. PAGINATION FOOTER */}
      <CardFooter className="py-3 px-6 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
        <div>
          Showing {sortedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length} domains
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-8 px-2.5 text-xs border-zinc-200 text-zinc-700 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
          </Button>

          <span className="px-2 font-medium text-zinc-800">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 px-2.5 text-xs border-zinc-200 text-zinc-700 disabled:opacity-40 cursor-pointer"
          >
            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardFooter>

      {/* 5. DOMAIN DRILLDOWN INSPECTION MODAL */}
      {inspectedDomain && (
        <div
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setInspectedDomain(null)}
        >
          <div
            className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DomainFavicon domain={inspectedDomain.domain} size="md" />
                <div>
                  <h3 className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
                    {inspectedDomain.domain}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {inspectedDomain.totalMentions} total citations logged across all audit engines
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedDomain(null)}
                className="text-zinc-400 hover:text-zinc-900 cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <span className="text-xs font-semibold text-zinc-700 block">
                Logged URL Citations & Engines:
              </span>

              {(inspectedDomain.allCitations && inspectedDomain.allCitations.length > 0
                ? inspectedDomain.allCitations
                : [
                    {
                      id: 'cit-1',
                      url: inspectedDomain.recentUrl,
                      createdAt: inspectedDomain.lastCitedAt,
                      engine: 'Perplexity',
                    },
                  ]
              ).map((citation, cidx) => {
                const engineMeta = citation.engine ? getEngineMeta(citation.engine) : null;
                return (
                  <div
                    key={citation.id || cidx}
                    className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100/60 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-zinc-800">
                          Citation #{cidx + 1}
                        </span>
                        {citation.engine && engineMeta && (
                          <span
                            title={engineMeta.label}
                            className={cn(
                              'inline-flex items-center justify-center h-6 w-6 rounded-md border shadow-2xs',
                              engineMeta.badgeClass
                            )}
                          >
                            <EngineIcon engine={citation.engine} size={13} className={engineMeta.iconColor} />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(citation.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-zinc-800 hover:text-zinc-950 break-all group/link"
                    >
                      <DomainFavicon url={citation.url} size="xs" />
                      <span className="hover:underline">{citation.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-zinc-400 group-hover/link:text-zinc-700" />
                    </a>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectedDomain(null)}
                className="text-xs border-zinc-200 bg-white text-zinc-800 cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. POP-UP MODAL: PROMPTS THAT CITED THIS DOMAIN & THEIR STATS */}
      <DomainPromptsModal
        isOpen={Boolean(selectedPromptDomain)}
        onClose={() => setSelectedPromptDomain(null)}
        domainRow={selectedPromptDomain}
      />
    </Card>
  );
}
