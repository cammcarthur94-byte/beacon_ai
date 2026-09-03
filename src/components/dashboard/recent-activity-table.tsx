'use client';

import * as React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EngineBadge } from '@/components/ui/engine-badge';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  X,
  Link2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DomainFavicon } from '@/components/citations/domain-favicon';

export interface RecentAuditRun {
  id: string;
  promptId: string;
  queryText: string;
  engine: string;
  visibilityScore: number;
  brandMentioned: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  citedUrlsCount: number;
  citedUrls?: string[];
  createdAt: string;
  timeAgo: string;
}

interface RecentActivityTableProps {
  runs: RecentAuditRun[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'mentioned' | 'missing';
  onStatusFilterChange: (status: 'all' | 'mentioned' | 'missing') => void;
  citationFilter: 'all' | 'has_citations' | 'high_citations';
  onCitationFilterChange: (filter: 'all' | 'has_citations' | 'high_citations') => void;
  activeCitationDomainFilter: string | null;
  onClearCitationDomainFilter: () => void;
  onResetTableFilters: () => void;
}

export function RecentActivityTable({
  runs,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  citationFilter,
  onCitationFilterChange,
  activeCitationDomainFilter,
  onClearCitationDomainFilter,
  onResetTableFilters,
}: RecentActivityTableProps) {
  const getSentimentBadge = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return (
          <Badge variant="success" className="text-[10px] font-mono">
            Positive
          </Badge>
        );
      case 'negative':
        return (
          <Badge variant="destructive" className="text-[10px] font-mono">
            Negative
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] font-mono">
            Neutral
          </Badge>
        );
    }
  };

  const hasTableFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    citationFilter !== 'all' ||
    Boolean(activeCitationDomainFilter);

  return (
    <Card className="border-zinc-200 bg-white shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            Recent Prompt Telemetry Runs
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Chronological audit log showing mention status, visibility score, and cited sources
          </CardDescription>
        </div>
        <Link
          href="/audits"
          className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-medium transition-colors self-start sm:self-auto"
        >
          View all audits <ExternalLink className="h-3 w-3" />
        </Link>
      </CardHeader>

      {/* Inline Filter Controls Bar */}
      <div className="p-4 bg-zinc-50/70 border-b border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Filter prompts (e.g. shoes, platform)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-xs bg-white border-zinc-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Center & Right: Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto text-xs font-mono">
          {/* Mention Status Filter */}
          <div className="flex items-center rounded-md border border-zinc-200 bg-white p-0.5">
            {(
              [
                { id: 'all', label: 'All Status' },
                { id: 'mentioned', label: 'Mentioned' },
                { id: 'missing', label: 'Missing' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onStatusFilterChange(s.id)}
                className={cn(
                  'px-2 py-1 rounded transition-all cursor-pointer text-[11px]',
                  statusFilter === s.id
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Citation Count Filter */}
          <div className="flex items-center rounded-md border border-zinc-200 bg-white p-0.5">
            {(
              [
                { id: 'all', label: 'All Citations' },
                { id: 'has_citations', label: 'Citations > 0' },
                { id: 'high_citations', label: 'High (≥3)' },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCitationFilterChange(c.id)}
                className={cn(
                  'px-2 py-1 rounded transition-all cursor-pointer text-[11px]',
                  citationFilter === c.id
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Cross-Filter Domain Badge if active */}
          {activeCitationDomainFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200 text-[11px] font-medium shadow-2xs">
              <DomainFavicon domain={activeCitationDomainFilter} size="xs" />
              <span>Domain: {activeCitationDomainFilter}</span>
              <button
                type="button"
                onClick={onClearCitationDomainFilter}
                className="hover:text-red-700 cursor-pointer ml-0.5"
                title="Clear domain filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Reset Filters button if any filter applied */}
          {hasTableFilters && (
            <button
              type="button"
              onClick={onResetTableFilters}
              className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer ml-1"
            >
              Reset
            </button>
          )}

          <span className="text-[11px] text-zinc-400 ml-auto md:ml-2">
            ({runs.length} shown)
          </span>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead className="w-[360px] text-xs font-semibold">Search Query Tracked</TableHead>
                <TableHead className="text-xs font-semibold">Engine</TableHead>
                <TableHead className="text-xs font-semibold">Brand Mention</TableHead>
                <TableHead className="text-xs font-semibold">Visibility</TableHead>
                <TableHead className="text-xs font-semibold">Sentiment</TableHead>
                <TableHead className="text-xs font-semibold">Citations</TableHead>
                <TableHead className="text-right text-xs font-semibold">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-zinc-500 text-xs font-mono">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="h-6 w-6 text-zinc-400" />
                      <span>No prompt audits match your current filter criteria.</span>
                      {hasTableFilters && (
                        <button
                          type="button"
                          onClick={onResetTableFilters}
                          className="text-xs text-blue-600 hover:underline font-sans cursor-pointer mt-1"
                        >
                          Clear table filters
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow key={run.id} className="group hover:bg-zinc-50/70 transition-colors">
                    {/* Search Query Tracked */}
                    <TableCell className="font-medium text-zinc-900 py-3">
                      <Link
                        href={`/audits/${run.promptId}`}
                        className="hover:underline flex items-center gap-1.5 line-clamp-1 text-xs"
                      >
                        <span>&quot;{run.queryText}&quot;</span>
                        <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-zinc-900 shrink-0" />
                      </Link>
                    </TableCell>

                    {/* Engine */}
                    <TableCell className="py-3">
                      <EngineBadge engine={run.engine.toLowerCase()} size="xs" showLabel={true} />
                    </TableCell>

                    {/* Brand Mention Status */}
                    <TableCell className="py-3 font-mono text-xs">
                      {run.brandMentioned ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Mentioned
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <AlertCircle className="h-3.5 w-3.5 text-zinc-400" /> Missing
                        </span>
                      )}
                    </TableCell>

                    {/* Visibility Score */}
                    <TableCell className="py-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">{run.visibilityScore}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              run.visibilityScore >= 80
                                ? 'bg-emerald-500'
                                : run.visibilityScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-red-400'
                            )}
                            style={{ width: `${run.visibilityScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Sentiment */}
                    <TableCell className="py-3 font-mono text-xs">
                      {getSentimentBadge(run.sentiment)}
                    </TableCell>

                    {/* Citations Count */}
                    <TableCell className="py-3 font-mono text-xs text-zinc-600">
                      {run.citedUrls && run.citedUrls.length > 0 ? (
                        <div
                          className="flex items-center gap-1.5"
                          title={`Citations:\n${run.citedUrls.join('\n')}`}
                        >
                          <div className="flex items-center -space-x-1 overflow-hidden py-0.5">
                            {run.citedUrls.slice(0, 3).map((url, i) => (
                              <DomainFavicon
                                key={i}
                                url={url}
                                size="xs"
                                className="ring-1 ring-white shadow-2xs"
                              />
                            ))}
                          </div>
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-semibold text-zinc-800">
                            {run.citedUrlsCount}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-400 text-[11px]">
                          <Link2 className="h-3 w-3 text-zinc-400" />
                          <span>0</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Timestamp */}
                    <TableCell className="py-3 text-right font-mono text-xs text-zinc-500">
                      {run.timeAgo}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
