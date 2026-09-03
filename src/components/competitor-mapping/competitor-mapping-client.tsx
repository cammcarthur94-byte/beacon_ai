'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  TrendingUp,
  Target,
  RefreshCw,
  X,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
  Filter,
  Layers,
  Award,
  CircleAlert,
  ArrowUpRight,
} from 'lucide-react';
import { DomainFavicon } from '@/components/citations/domain-favicon';
import { cn } from '@/lib/utils';
import type {
  CompetitorFeatureItem,
  CompetitorMappingData,
} from '@/app/api/competitor-mapping/route';

export function CompetitorMappingClient() {
  const [data, setData] = useState<CompetitorMappingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('42 mins ago');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/competitor-mapping');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load competitor mapping data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunCrawl = async () => {
    setCrawling(true);
    try {
      const res = await fetch('/api/competitor-mapping', { method: 'POST' });
      if (res.ok) {
        setLastSyncText('Just now');
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to run crawl sync:', err);
    } finally {
      setCrawling(false);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    if (!data?.features) return [];
    return Array.from(new Set(data.features.map((f) => f.category)));
  }, [data?.features]);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    if (!data?.features) return [];
    return data.features.filter((f) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.featureName.toLowerCase().includes(q);
        const matchesDesc = f.description.toLowerCase().includes(q);
        const matchesCat = f.category.toLowerCase().includes(q);
        const matchesBrand = f.brandDetail.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesBrand) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && f.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && f.brandStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [data?.features, searchQuery, selectedCategory, selectedStatus]);

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Competitor Product & Feature Mapping
            </h1>
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold px-2.5 py-0.5">
              Automated AEO Matrix
            </Badge>
          </div>
          <p className="text-sm text-slate-600 max-w-3xl">
            Live crawler monitoring competitor product catalogs, feature claims, and pricing tiers.
            Compare citation share parity to pinpoint where AI models favor rival brands.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCrawl}
            disabled={crawling}
            className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-2 text-slate-500', crawling && 'animate-spin')} />
            {crawling ? 'Crawling Catalogs...' : 'Run AI Crawl & Sync'}
          </Button>

          <Link href="/consultant">
            <Button
              size="sm"
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Ask Sentinel Analysis
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tracked Competitors */}
        <Card className="border border-slate-200/90 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Tracked Competitors
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data?.summary.trackedCompetitorsCount ?? 3}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Direct Peers
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 truncate">
              {data?.competitors?.map((c) => c.name).join(' • ') || 'Alo Yoga • Vuori • Athleta'}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Parity Score */}
        <Card className="border border-slate-200/90 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Feature Parity Index
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data?.summary.overallParityScore ?? 78}%
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Strong Foundation
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Core athletic performance specs lead peer group
            </p>
          </CardContent>
        </Card>

        {/* Card 3: High Risk Gaps */}
        <Card className="border border-slate-200/90 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                High-Risk Feature Gaps
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-amber-600">
                {data?.summary.highRiskGapsCount ?? 2}
              </span>
              <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Needs Attention
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Categories where rivals capture 50%+ AI citation share
            </p>
          </CardContent>
        </Card>

        {/* Card 4: AI Citation Disparity */}
        <Card className="border border-slate-200/90 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                AI Citation Share
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-purple-700">
                {data?.summary.aiCitationDisparity || '+14% Advantage'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Last catalog crawl synced: {lastSyncText}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations Action Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            AI Grounding Recommendations (Close the Parity Gap)
          </h2>
          <span className="text-xs text-slate-500">Generated by Sentinel Crawler</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.recommendations?.map((rec) => (
            <div
              key={rec.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {rec.category}
                  </span>
                  <Badge
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5',
                      rec.impact === 'Critical'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}
                  >
                    {rec.impact} Priority
                  </Badge>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">{rec.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100">
                <Link
                  href={`/consultant?q=${encodeURIComponent(
                    `Sentinel, execute this competitor parity recommendation: "${rec.title}". ${rec.promptQuery}`
                  )}`}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-semibold h-8 text-emerald-700 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all justify-between"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search features, materials, specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9.5 text-xs bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    selectedStatus !== 'all' && 'border-emerald-500 text-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-500'
                  )}
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  {selectedStatus === 'all'
                    ? 'All Parity Statuses'
                    : `Status: ${selectedStatus.toUpperCase()}`}
                  <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs font-sans">
                <DropdownMenuLabel>Filter by Parity</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('leader')}
                  className="font-semibold text-emerald-700"
                >
                  Leader (Market Leading)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('parity')}
                  className="font-semibold text-blue-700"
                >
                  Parity (Equivalent)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('gap')}
                  className="font-semibold text-amber-700"
                >
                  Gap (Competitor Advantage)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('missing')}
                  className="font-semibold text-rose-700"
                >
                  Missing (Unindexed in LLMs)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-9 px-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                Clear all ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center shrink-0">
            <Layers className="h-3 w-3 mr-1 text-slate-400" />
            Category:
          </span>

          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-all border shrink-0',
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            )}
          >
            All Categories ({data?.features?.length || 0})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-all border shrink-0',
                  isSelected
                    ? 'bg-purple-50 text-purple-800 border-purple-600 ring-1 ring-purple-600 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Parity & Comparison Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Feature Parity & Grounding Breakdown ({filteredFeatures.length} Tracked Features)
            </h3>
            <p className="text-xs text-slate-500">
              Cross-referenced from public product schemas, technical specs, and multi-engine citation frequencies
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Green bars indicate where your brand leads AI grounding share
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[240px] text-xs font-semibold text-slate-600 py-3.5 pl-6">
                  Feature & Specification
                </TableHead>
                <TableHead className="w-[110px] text-xs font-semibold text-slate-600 text-center">
                  Parity Status
                </TableHead>
                <TableHead className="w-[260px] text-xs font-semibold text-slate-600">
                  {data?.brandName || 'Our Brand'} Positioning
                </TableHead>
                <TableHead className="min-w-[320px] text-xs font-semibold text-slate-600">
                  Competitor Catalog Coverage
                </TableHead>
                <TableHead className="w-[160px] text-xs font-semibold text-slate-600 text-center">
                  AI Citation Share
                </TableHead>
                <TableHead className="w-[140px] text-xs font-semibold text-slate-600 text-right pr-6">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
                      <span>Evaluating competitor product catalogues and citation shares...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredFeatures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Target className="h-8 w-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">No matching features found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="mt-2 text-xs border-slate-200"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeatures.map((feat) => {
                  return (
                    <TableRow
                      key={feat.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Feature & Category */}
                      <TableCell className="pl-6 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {feat.category}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {feat.featureName}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-2">
                            {feat.description}
                          </span>
                        </div>
                      </TableCell>

                      {/* Parity Status */}
                      <TableCell className="text-center py-4 align-top">
                        {feat.brandStatus === 'leader' && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
                            Leader
                          </Badge>
                        )}
                        {feat.brandStatus === 'parity' && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold">
                            Parity
                          </Badge>
                        )}
                        {feat.brandStatus === 'gap' && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold">
                            Gap
                          </Badge>
                        )}
                        {feat.brandStatus === 'missing' && (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-semibold">
                            Missing
                          </Badge>
                        )}
                      </TableCell>

                      {/* Our Brand Detail */}
                      <TableCell className="py-4 align-top">
                        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                          {feat.brandDetail}
                        </p>
                      </TableCell>

                      {/* Competitor Coverage */}
                      <TableCell className="py-4 align-top">
                        <div className="space-y-1.5">
                          {feat.competitors.map((comp) => (
                            <div
                              key={comp.name}
                              className="flex items-start gap-2 text-xs bg-slate-50/60 p-2 rounded border border-slate-200/60"
                            >
                              <span className="font-semibold text-slate-800 shrink-0 w-20">
                                {comp.name}:
                              </span>
                              <span
                                className={cn(
                                  'text-[11px] flex-1',
                                  comp.hasFeature ? 'text-slate-600' : 'text-slate-400 italic'
                                )}
                              >
                                {comp.detail}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                {comp.citationShare}% SOV
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      {/* AI Citation Share Bar */}
                      <TableCell className="text-center py-4 align-top">
                        <div className="flex flex-col items-center gap-1.5 pt-1">
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                            <span className="text-emerald-700">{feat.brandCitationShare}%</span>
                            <span className="text-slate-400 text-[10px]">vs rivals</span>
                          </div>

                          {/* Multi-segment Share bar */}
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${feat.brandCitationShare}%` }}
                              title={`${data?.brandName || 'Our Brand'}: ${feat.brandCitationShare}%`}
                            />
                            <div
                              className="h-full bg-amber-400"
                              style={{ width: `${100 - feat.brandCitationShare}%` }}
                              title={`Competitors: ${100 - feat.brandCitationShare}%`}
                            />
                          </div>

                          <span className="text-[10px] text-slate-400">
                            Impact: {feat.aiImpactScore}/100
                          </span>
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right pr-6 py-4 align-top">
                        <Link
                          href={`/consultant?q=${encodeURIComponent(
                            `Sentinel, analyze our feature parity gap for "${feat.featureName}" (${feat.category}). Recommended action: ${feat.recommendedAction}. How do we outrank competitors in AI grounding answers?`
                          )}`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs text-purple-700 border-purple-200 bg-purple-50/50 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all font-medium"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Bridge Gap
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
