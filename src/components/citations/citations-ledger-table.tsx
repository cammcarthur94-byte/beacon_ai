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
  Globe,
  Calendar,
  X,
  Filter,
  Layers,
  Cpu,
} from 'lucide-react';
import type { CitationSourceType } from '@/types/database.types';
import { getSourceTypeMeta } from '@/lib/citations/categorizer';
import { DomainFavicon, CitationSourceIcon } from './domain-favicon';
import { AddressBarCitation } from './address-bar-citation';
import { EngineIcon, getEngineMeta } from '@/components/ui/engine-badge';
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

type SortField = 'totalMentions' | 'domain' | 'lastCitedAt' | 'sourceType';
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
  const [sortField, setSortField] = useState<SortField>('totalMentions');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected domain for drill-down inspection modal
  const [inspectedDomain, setInspectedDomain] = useState<DomainCitationRow | null>(null);

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
    mentionsFilter !== 'all';

  const resetAllFilters = () => {
    setSearchTerm('');
    onClearSourceTypes?.();
    setSelectedEngine('all');
    setMentionsFilter('all');
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

      return matchesSearch && matchesSource && matchesEngine && matchesMentions;
    });
  }, [rows, searchTerm, isSourceFiltered, activeSourceTypes, selectedEngine, mentionsFilter]);

  // Sorting logic
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      if (sortField === 'totalMentions') {
        return sortDirection === 'desc'
          ? b.totalMentions - a.totalMentions
          : a.totalMentions - b.totalMentions;
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
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Filter referring domains (e.g. reddit, runnersworld)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 pr-7 h-8.5 text-xs bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 shadow-2xs font-sans"
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
          {/* Source Category Segmented Pills (Multi-select toggling) - extended lengthwise */}
          <div className="flex-1 flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs font-sans min-w-0">
            <button
              type="button"
              onClick={() => {
                onClearSourceTypes?.();
                setCurrentPage(1);
              }}
              className={cn(
                'flex-1 text-center py-1.5 px-2 rounded-md text-[11px] transition-all cursor-pointer whitespace-nowrap font-medium',
                !isSourceFiltered
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              All Sources
            </button>
            {(
              [
                { id: 'news', label: 'News' },
                { id: 'forum', label: 'Forums' },
                { id: 'blog', label: 'Blogs' },
                { id: 'documentation', label: 'Docs' },
                { id: 'social', label: 'Social' },
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
                    'flex-1 text-center py-1.5 px-2 rounded-md text-[11px] transition-all cursor-pointer whitespace-nowrap font-medium',
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Engine Dropdown Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 text-xs border-zinc-200 bg-white text-zinc-700 gap-1.5 cursor-pointer shrink-0 shadow-2xs font-sans font-medium"
              >
                <Cpu className="h-3.5 w-3.5 text-zinc-400" />
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

          {/* Mentions Volume Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 text-xs border-zinc-200 bg-white text-zinc-700 gap-1.5 cursor-pointer shrink-0 shadow-2xs font-sans font-medium"
              >
                <Layers className="h-3.5 w-3.5 text-zinc-400" />
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

          {/* Reset Filters button if any filter applied */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer shrink-0"
            >
              Reset
            </button>
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
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-zinc-50/70 border-b border-zinc-200">
                {/* Column 1: Referring Domain (20%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('domain')}
                  className="w-[20%] min-w-[170px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold py-3.5 group text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Referring Domain</span>
                    {getSortIcon('domain')}
                  </div>
                </TableHead>

                {/* Column 2: Source Category (15%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('sourceType')}
                  className="w-[15%] min-w-[150px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold py-3.5 group text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Source Category</span>
                    {getSortIcon('sourceType')}
                  </div>
                </TableHead>

                {/* Column 3: Citing Engines (15%) - Centered */}
                <TableHead className="w-[15%] min-w-[130px] text-xs font-semibold py-3.5 text-center">
                  Citing Engines
                </TableHead>

                {/* Column 4: Mentions (12%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('totalMentions')}
                  className="w-[12%] min-w-[100px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold py-3.5 group text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Mentions</span>
                    {getSortIcon('totalMentions')}
                  </div>
                </TableHead>

                {/* Column 5: Recent Evidence URL (22%) - Centered */}
                <TableHead className="w-[22%] min-w-[200px] text-xs font-semibold py-3.5 text-center">
                  Most Recent URL
                </TableHead>

                {/* Column 6: Last Grounded (8%) - Centered */}
                <TableHead
                  onClick={() => toggleSort('lastCitedAt')}
                  className="w-[8%] min-w-[90px] cursor-pointer hover:text-zinc-950 select-none text-xs font-semibold text-center py-3.5 group"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Last Grounded</span>
                    {getSortIcon('lastCitedAt')}
                  </div>
                </TableHead>

                {/* Column 7: Deep Dive Action (8%) - Centered */}
                <TableHead className="w-[8%] min-w-[90px] text-center text-xs font-semibold py-3.5">
                  Deep Dive
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-zinc-500 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="h-6 w-6 text-zinc-400" />
                      <span className="font-medium text-zinc-700">
                        No referring domains match your filter criteria.
                      </span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer mt-1"
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
                      {/* Column 1: Referring Domain - Centered */}
                      <TableCell className="py-3.5 text-center font-medium text-zinc-950">
                        <div className="flex items-center justify-center gap-2.5">
                          <DomainFavicon domain={row.domain} size="sm" />
                          <span className="font-medium text-xs text-zinc-900 truncate max-w-[170px]">
                            {row.domain}
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 2: Source Category - Centered & Standout */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border font-semibold',
                              meta.badgeClass
                            )}
                          >
                            <CitationSourceIcon sourceType={row.sourceType} className={cn("h-3.5 w-3.5", meta.iconClass)} />
                            <span>{meta.label}</span>
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 3: Citing Engines - Logos instead of words, Centered */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {engines.map((eng) => (
                            <EngineFaviconLogo key={eng} engine={eng} />
                          ))}
                        </div>
                      </TableCell>

                      {/* Column 4: Mentions (with visual bar) - Centered */}
                      <TableCell className="py-3.5 text-center">
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

                      {/* Column 5: Most Recent Evidence URL - Centered */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex items-center justify-center max-w-full">
                          <AddressBarCitation url={row.recentUrl} size="sm" showExternalLink={true} />
                        </div>
                      </TableCell>

                      {/* Column 6: Timestamp - Centered */}
                      <TableCell className="py-3.5 text-center text-xs text-zinc-600 font-medium tabular-nums">
                        {new Date(row.lastCitedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>

                      {/* Column 7: Actions - Centered */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectedDomain(row)}
                            className="h-7 px-2.5 text-xs text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 font-medium cursor-pointer"
                          >
                            Deep Dive ({row.allCitations?.length || row.totalMentions})
                          </Button>
                        </div>
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
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <DomainFavicon domain={inspectedDomain.domain} />
                  <h3 className="font-semibold text-zinc-950 text-base">
                    {inspectedDomain.domain}
                  </h3>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs border font-semibold',
                      getSourceTypeMeta(inspectedDomain.sourceType).badgeClass
                    )}
                  >
                    <CitationSourceIcon
                      sourceType={inspectedDomain.sourceType}
                      className={cn('h-3.5 w-3.5', getSourceTypeMeta(inspectedDomain.sourceType).iconClass)}
                    />
                    <span>{getSourceTypeMeta(inspectedDomain.sourceType).label}</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Total of {inspectedDomain.totalMentions} citation occurrences extracted during audits
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInspectedDomain(null)}
                className="h-8 w-8 text-zinc-500 hover:text-zinc-950 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal List of Citations */}
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
    </Card>
  );
}
