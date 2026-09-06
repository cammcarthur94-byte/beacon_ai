'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
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
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Filter,
  Layers,
  Award,
  CircleAlert,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { DomainFavicon } from '@/components/citations/domain-favicon';
import { cn } from '@/lib/utils';
import type {
  CompetitorFeatureItem,
  CompetitorMappingData,
} from '@/app/api/competitor-mapping/route';
import { CompetitorComparisonRow } from './competitor-comparison-row';
import {
  CompetitorActionModal,
  type ActionModalType,
} from './competitor-action-modal';

function renderHighlightedDescription(text: string) {
  const highlightTerms = [
    '48% of AI engine recommendations',
    'travel trousers',
    'objective technical spec breakdown',
    'celebrity-endorsed athleisure',
    '3.4x',
    'free lifetime alterations',
    'Meta Pant',
    'ABC Pant',
    'Scuba',
    'Define',
    'lifestyle everyday apparel',
  ];

  const regex = new RegExp(
    `(${highlightTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  );
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isHighlight = highlightTerms.some((t) => t.toLowerCase() === part.toLowerCase());
    if (isHighlight) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export function CompetitorMappingClient() {
  const [data, setData] = useState<CompetitorMappingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('42 mins ago');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    type: ActionModalType | null;
    feat: CompetitorFeatureItem | null;
    topCompetitor: CompetitorFeatureItem['competitors'][0] | null;
  }>({
    isOpen: false,
    type: null,
    feat: null,
    topCompetitor: null,
  });

  const handleOpenActionModal = (
    type: ActionModalType,
    feat: CompetitorFeatureItem,
    topComp: CompetitorFeatureItem['competitors'][0] | null
  ) => {
    setActiveModal({
      isOpen: true,
      type,
      feat,
      topCompetitor: topComp,
    });
  };

  const handleCloseActionModal = () => {
    setActiveModal((prev) => ({ ...prev, isOpen: false }));
  };


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
    <div className="space-y-6 font-sans pb-16">
      {/* ── 1. STREAMLINED PAGE HEADER & PRIMARY ACTION ──────────── */}
      <div className="border-b border-slate-200/80 pb-6 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
            PRODUCT INTELLIGENCE
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Competitor Comparison
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCrawl}
            disabled={crawling}
            className="h-8.5 text-xs font-medium text-slate-700 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-2xs shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5 text-slate-500', crawling && 'animate-spin')} />
            {crawling ? 'Updating Competitor Data...' : 'Refresh Competitor Data'}
          </Button>
        </div>
        <p className="text-sm text-slate-600 max-w-3xl pt-0.5 leading-relaxed">
          Monitor rival product catalogs, feature claims, and pricing tiers to see where AI models favor competing brands over yours.
        </p>
      </div>

      {/* ── 2. KPI OVERVIEW CARDS ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tracked Competitors */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white hover:shadow-xs transition-shadow">
          <CardContent className="px-5 py-6">
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
                Key Rivals
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
              {data?.competitors?.map((c, i) => (
                <span key={c.name} className="inline-flex items-center gap-1">
                  {i > 0 && <span className="text-slate-300 mr-1">•</span>}
                  <span>{c.name}</span>
                  {c.isUnlisted && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                      AI Detected
                    </span>
                  )}
                </span>
              )) || 'Alo Yoga • Vuori • Athleta'}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Parity Score */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white hover:shadow-xs transition-shadow">
          <CardContent className="px-5 py-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Competitive Match Score
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
            <p className="mt-3 text-xs text-slate-500">
              Core athletic performance specs lead peer group
            </p>
          </CardContent>
        </Card>

        {/* Card 3: High Risk Gaps */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white hover:shadow-xs transition-shadow">
          <CardContent className="px-5 py-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Missing Product Features
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data?.summary.highRiskGapsCount ?? 2}
              </span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Needs Attention
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Areas where competitors get recommended more often
            </p>
          </CardContent>
        </Card>

        {/* Card 4: AI Citation Disparity */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white hover:shadow-xs transition-shadow">
          <CardContent className="px-5 py-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Recommendation Advantage
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data?.summary.aiCitationDisparity
                  ? (data.summary.aiCitationDisparity.split(' ')[0] || '+14%')
                  : '+14%'}
              </span>
              <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Overall Advantage
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Last updated: {lastSyncText}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. COLLAPSIBLE "ACTIONABLE INSIGHTS" PANEL ───────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden transition-all">
        <div
          onClick={() => setInsightsExpanded(!insightsExpanded)}
          className="p-4 bg-gradient-to-r from-emerald-50/40 via-white to-slate-50/40 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Key Recommendations &amp; Opportunities
                </h2>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                  {data?.recommendations?.length || 3} Recommendations
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Top opportunities to improve your brand&apos;s recommendations compared to competitors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              {insightsExpanded ? 'Collapse' : 'Expand Insights'}
            </span>
            <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
              {insightsExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>

        {insightsExpanded && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/30">
            {data?.recommendations?.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-start space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {rec.category}
                  </span>
                  <Badge
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 border shadow-2xs',
                      rec.impact === 'Critical'
                        ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                        : 'bg-amber-50 text-amber-700 border-amber-200/80'
                    )}
                  >
                    {rec.impact} Priority
                  </Badge>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">{rec.title}</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {renderHighlightedDescription(rec.description)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. UNIFIED FILTER BAR & SEARCH TOOLBAR ───────────────── */}
      <div className="space-y-3 mb-6">
        {/* Unified gray-backed toolbar container */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search features, specifications, fabrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8.5 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Parity Dropdown & Clear Filters */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8.5 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-sans shadow-2xs',
                    selectedStatus !== 'all' && 'border-emerald-500 text-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-500 font-semibold'
                  )}
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  {selectedStatus === 'all'
                    ? 'All Standings'
                    : `Status: ${selectedStatus.toUpperCase()}`}
                  <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs font-sans">
                <DropdownMenuLabel>Filter by Standing</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                  All Standings
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
                  Even (Matching Competitors)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('gap')}
                  className="font-semibold text-amber-700"
                >
                  Behind (Competitors Ahead)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('missing')}
                  className="font-semibold text-rose-700"
                >
                  Missing (Not Found by AI)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8.5 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium cursor-pointer"
              >
                <X className="h-3 w-3 mr-1" />
                Clear filters ({activeFiltersCount})
              </Button>
            )}

            <span className="text-xs text-slate-400 pl-1 shrink-0">
              ({filteredFeatures.length} matching)
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center shrink-0">
            <Layers className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Category:
          </span>

          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full transition-all border shrink-0 cursor-pointer',
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                  'px-2.5 py-1 text-xs font-medium rounded-full transition-all border shrink-0 cursor-pointer',
                  isSelected
                    ? 'bg-purple-50 text-purple-800 border-purple-600 ring-1 ring-purple-600 font-semibold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. FEATURE COMPARISON MATRIX TABLE ──────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Competitor Comparison Table ({filteredFeatures.length} Tracked Features)
            </h3>
            <p className="text-xs text-slate-500">
              Comparing your products and claims against rivals across major AI platforms
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Green bars show where your brand is recommended more often by AI
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[240px] text-xs font-semibold text-slate-600 py-3.5 pl-6">
                  Feature or Product Spec
                </TableHead>
                <TableHead className="w-[110px] text-xs font-semibold text-slate-600 text-center">
                  Standing
                </TableHead>
                <TableHead className="w-[260px] text-xs font-semibold text-slate-600">
                  {data?.brandName || 'Our Brand'} Details
                </TableHead>
                <TableHead className="min-w-[340px] text-xs font-semibold text-slate-600">
                  Competitor Comparison
                </TableHead>
                <TableHead className="w-[160px] text-xs font-semibold text-slate-600 text-center">
                  AI Recommendation Rate
                </TableHead>
                <TableHead className="w-[170px] min-w-[160px] text-xs font-semibold text-slate-600 text-center pr-6">
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
                filteredFeatures.map((feat) => (
                  <CompetitorComparisonRow
                    key={feat.id}
                    feat={feat}
                    brandName={data?.brandName || 'Our Brand'}
                    onTriggerAction={handleOpenActionModal}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── 6. CLAUDE STREAMING ACTION MODAL ───────────── */}
      <CompetitorActionModal
        isOpen={activeModal.isOpen}
        onClose={handleCloseActionModal}
        actionType={activeModal.type}
        feat={activeModal.feat}
        brandName={data?.brandName || 'Our Brand'}
        topCompetitor={activeModal.topCompetitor}
      />
    </div>
  );
}
