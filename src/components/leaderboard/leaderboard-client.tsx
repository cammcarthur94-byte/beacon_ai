'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  BarChart3,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Zap,
  Globe2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DomainFavicon } from '@/components/citations/domain-favicon';
import { EngineBadge, EngineIcon } from '@/components/ui/engine-badge';
import { cn } from '@/lib/utils';
import type { CompetitorSovEntry, LeaderboardResponse } from '@/app/api/leaderboard/route';

const ENGINES = [
  { id: 'all', label: 'All Engines' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'google_ai_overview', label: 'Google AI Overviews' },
  { id: 'google_ai_mode', label: 'Google AI Mode' },
];

export function LeaderboardClient() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('all');
  const [selectedVertical, setSelectedVertical] = useState('all');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedEntry, setSelectedEntry] = useState<CompetitorSovEntry | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        engine: selectedEngine,
        vertical: selectedVertical,
        timeframe,
      });
      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedEngine, selectedVertical, timeframe]);

  const filteredLeaderboard = useMemo(() => {
    if (!data?.leaderboard) return [];
    if (!searchQuery.trim()) return data.leaderboard;
    const q = searchQuery.toLowerCase();
    return data.leaderboard.filter(
      (item) => item.name.toLowerCase().includes(q) || item.domain.toLowerCase().includes(q)
    );
  }, [data?.leaderboard, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              MARKET DOMINANCE
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            AI Share of Voice Leaderboard
          </h1>
          <p className="text-sm text-slate-500">
            Compare your brand&apos;s market dominance and citation growth against top industry competitors across major generative search platforms.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Timeframe Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
            {(['7d', '30d', '90d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                  timeframe === t
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs shadow-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5 text-slate-500', loading && 'animate-spin')} />
            Sync
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Brand Standing */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span>BRAND SOV STANDING</span>
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 font-sans">
                #{data?.metrics.brandRank ?? 1}
              </span>
              <span className="text-sm font-semibold text-emerald-700">
                {data?.metrics.brandSovShare ?? 37.4}% Share
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold text-emerald-700">
                +{data?.metrics.brandSovDeltaWeekly ?? 4.2}%
              </span>
              <span className="text-slate-400">vs prior period</span>
            </div>
          </CardContent>
        </Card>

        {/* Market Leader */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span>MARKET DOMINATOR</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 truncate">
                {data?.metrics.marketLeaderName || 'Your Brand'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Leads with <span className="font-semibold text-slate-800">{data?.metrics.marketLeaderShare ?? 37.4}%</span> total organic AI search grounding.
            </p>
          </CardContent>
        </Card>

        {/* Total Industry Citations */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span>TOTAL CITATIONS ANALYZED</span>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 font-sans">
                {data?.metrics.totalIndustryCitations ? data.metrics.totalIndustryCitations.toLocaleString() : '3,795'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Across <span className="font-semibold text-slate-800">{data?.metrics.activeTrackedPrompts ?? 38}</span> target prompts & 6 generative engines.
            </p>
          </CardContent>
        </Card>

        {/* Growth Velocity */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span>NET SOV MOMENTUM</span>
              <Zap className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-700 font-sans">
                +9.1%
              </span>
              <span className="text-xs font-mono text-slate-400">30D DELTA</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Citations expanding most rapidly in <span className="font-semibold text-slate-800">Google AI Overviews</span>.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls & Engine Bar */}
      <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search competitor or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-white border-slate-200 text-xs shadow-2xs"
            />
          </div>

          {/* Industry Vertical Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 shrink-0">Vertical:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-slate-200 bg-white text-xs shadow-2xs">
                  <Layers className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  {selectedVertical === 'all' ? 'All Verticals' : selectedVertical}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white border-slate-200">
                {(data?.availableVerticals || ['All Verticals']).map((vert) => (
                  <DropdownMenuItem
                    key={vert}
                    onClick={() => setSelectedVertical(vert === 'All Verticals' ? 'all' : vert)}
                    className="text-xs cursor-pointer"
                  >
                    {vert}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Engine Toggle Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 mr-2 font-semibold">
            Engine Filter:
          </span>
          {ENGINES.map((eng) => {
            const isSelected = selectedEngine === eng.id;
            return (
              <button
                key={eng.id}
                onClick={() => setSelectedEngine(eng.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-medium transition-all inline-flex items-center gap-1.5 text-xs border whitespace-nowrap cursor-pointer',
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                )}
              >
                {eng.id !== 'all' && <EngineIcon engine={eng.id} size={14} />}
                <span>{eng.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Leaderboard Table Card */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Executive Share of Voice Standings
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Aggregated from verified citations across all targeted generative AI search platforms
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-600 font-mono text-[11px]">
            {filteredLeaderboard.length} Competitors Tracked
          </Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-200">
              <TableRow className="border-slate-200">
                <TableHead className="w-16 font-mono text-xs font-semibold uppercase tracking-wider text-slate-700 py-3.5">Rank</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700 py-3.5">Brand / Entity</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700 py-3.5 w-64">SOV Dominance</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700 text-right py-3.5">Total Citations</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700 py-3.5">Engine Distribution</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700 text-right py-3.5">Period Delta</TableHead>
                <TableHead className="w-24 text-right font-mono text-xs font-semibold uppercase tracking-wider text-slate-700 py-3.5">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaderboard.map((entry) => {
                const rankDelta = entry.previousRank - entry.rank;
                return (
                  <TableRow
                    key={entry.id}
                    className="border-slate-200 transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {/* Rank */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono border shadow-2xs shrink-0',
                          entry.rank === 1 ? 'bg-amber-100 text-amber-950 border-amber-300' :
                          entry.rank === 2 ? 'bg-slate-100 text-slate-800 border-slate-300' :
                          entry.rank === 3 ? 'bg-orange-100 text-orange-950 border-orange-300' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        )}>
                          {entry.rank}
                        </span>
                        {rankDelta > 0 && (
                          <span className="text-emerald-700 flex items-center font-bold" title="Moved up in rank">
                            <TrendingUp className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {rankDelta < 0 && (
                          <span className="text-rose-600 flex items-center font-bold" title="Moved down in rank">
                            <TrendingDown className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {rankDelta === 0 && (
                          <span className="text-slate-400">
                            <Minus className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Brand Name & Domain */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <DomainFavicon domain={entry.domain} size="md" />
                        <div>
                          <span className="font-semibold text-slate-950 text-sm block leading-tight">
                            {entry.name}
                          </span>
                          <span className="text-xs font-mono text-slate-500 block mt-0.5">
                            {entry.domain}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* SOV Dominance Bar */}
                    <TableCell className="py-4">
                      <div className="space-y-1.5 min-w-[170px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-950 font-mono text-sm">{entry.citationShare}%</span>
                          <span className="text-xs text-slate-600 font-mono font-medium">Score: {entry.sovScore}/100</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              entry.rank === 1 ? 'bg-emerald-600' : 'bg-slate-700'
                            )}
                            style={{ width: `${Math.min(entry.citationShare, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Total Citations */}
                    <TableCell className="text-right font-mono font-bold text-sm text-slate-950 py-4">
                      {entry.totalCitations.toLocaleString()}
                    </TableCell>

                    {/* Engine Distribution Badges - High Contrast & Crisp Readability */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-semibold shadow-2xs"
                          title="ChatGPT share"
                        >
                          <span className="text-emerald-800 font-bold">GPT:</span>
                          <span>{entry.engineBreakdown.chatgpt.share}%</span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-blue-100/70 border border-blue-300 text-blue-950 font-semibold shadow-2xs"
                          title="Gemini share"
                        >
                          <span className="text-blue-800 font-bold">GEM:</span>
                          <span>{entry.engineBreakdown.gemini.share}%</span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-100/80 border border-amber-300 text-amber-950 font-semibold shadow-2xs"
                          title="Claude share"
                        >
                          <span className="text-amber-900 font-bold">CLD:</span>
                          <span>{entry.engineBreakdown.claude.share}%</span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-cyan-100/70 border border-cyan-300 text-cyan-950 font-semibold shadow-2xs"
                          title="Perplexity share"
                        >
                          <span className="text-cyan-800 font-bold">PER:</span>
                          <span>{entry.engineBreakdown.perplexity.share}%</span>
                        </span>
                      </div>
                    </TableCell>

                    {/* Period Delta */}
                    <TableCell className="text-right font-mono text-xs py-4">
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          'font-bold text-sm inline-flex items-center gap-0.5',
                          entry.weeklyDelta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        )}>
                          {entry.weeklyDelta >= 0 ? `+${entry.weeklyDelta}%` : `${entry.weeklyDelta}%`}
                        </span>
                        <span className="text-[11px] text-slate-500 font-sans">7d delta</span>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs border-slate-200 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 font-medium shadow-2xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                      >
                        Inspect
                        <ChevronRight className="h-3.5 w-3.5 ml-1 text-slate-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Drilldown Drawer / Card if competitor is selected */}
      {selectedEntry && (
        <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm animate-in slide-in-from-bottom-2 duration-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <DomainFavicon domain={selectedEntry.domain} size="md" />
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {selectedEntry.name} Deep Intelligence
                </CardTitle>
                <CardDescription className="text-xs font-mono text-slate-500">
                  {selectedEntry.domain} · Rank #{selectedEntry.rank} · SOV Score {selectedEntry.sovScore}/100
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEntry(null)}
              className="h-7 text-xs text-slate-500"
            >
              Close
            </Button>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Engine Breakdown List */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] block">
                Multi-Engine Citation Breakdown
              </span>
              <div className="space-y-1.5">
                {Object.entries(selectedEntry.engineBreakdown).map(([engineKey, stats]) => (
                  <div key={engineKey} className="flex items-center justify-between p-2 rounded bg-white border border-slate-200/80">
                    <div className="flex items-center gap-1.5">
                      <EngineIcon engine={engineKey} size={14} />
                      <span className="capitalize font-medium text-slate-700">{engineKey.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{stats.share}% ({stats.citations} citations)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dominant Keywords */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] block">
                Dominant AI Recommendation Keywords
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedEntry.dominantKeywords.map((kw) => (
                  <Badge key={kw} variant="outline" className="border-slate-300 bg-white text-slate-700 text-xs py-1">
                    {kw}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                These keywords trigger the highest citation frequency for this competitor in generative search summaries.
              </p>
            </div>

            {/* Top Cited Publication Sources */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] block">
                Top Grounding Publications
              </span>
              <div className="space-y-1.5">
                {selectedEntry.topCitedSources.map((source) => (
                  <div key={source} className="flex items-center justify-between p-2 rounded bg-white border border-slate-200/80">
                    <div className="flex items-center gap-1.5">
                      <Globe2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono text-slate-700">{source}</span>
                    </div>
                    <Link
                      href="/authority-gap"
                      className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-0.5"
                    >
                      Target Gap <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
