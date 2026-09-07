'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Globe2,
  Filter,
  CheckCircle2,
  Copy,
  MessageSquare,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Newspaper,
  MessageCircle,
  FileText,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { DomainFavicon } from '@/components/citations/domain-favicon';
import { cn } from '@/lib/utils';
import type { AuthorityGapItem } from '@/app/api/authority-gap/route';

interface AuthorityGapResponse {
  success: boolean;
  brandName: string;
  competitors: Array<{ name: string; domain: string }>;
  gaps: AuthorityGapItem[];
  summary: {
    totalGaps: number;
    avgDomainAuthority: number;
    topCompetitorAdvantage: string;
    estimatedSovOpportunity: string;
  };
}

export function AuthorityGapClient() {
  const router = useRouter();
  const [data, setData] = useState<AuthorityGapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [minDa, setMinDa] = useState<number>(0);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all');

  // Fetch initial gap data
  const fetchGaps = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/authority-gap');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load authority gaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  // Filtered gaps
  const filteredGaps = useMemo(() => {
    if (!data?.gaps) return [];
    return data.gaps.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDomain = item.domain.toLowerCase().includes(q);
        const matchesTopic = item.relevanceTopic.toLowerCase().includes(q);
        const matchesAngle = item.recommendedAngle.toLowerCase().includes(q);
        if (!matchesDomain && !matchesTopic && !matchesAngle) return false;
      }

      // Type filter
      if (selectedType !== 'all') {
        if (item.sourceType !== selectedType) return false;
      }

      // Min DA
      if (minDa > 0 && item.domainAuthority < minDa) return false;

      // Competitor filter
      if (selectedCompetitor !== 'all') {
        const hasComp = item.competitorsCited.some(
          (c) => c.name.toLowerCase() === selectedCompetitor.toLowerCase()
        );
        if (!hasComp) return false;
      }

      return true;
    });
  }, [data?.gaps, searchQuery, selectedType, minDa, selectedCompetitor]);



  const activeFiltersCount =
    (selectedType !== 'all' ? 1 : 0) +
    (minDa > 0 ? 1 : 0) +
    (selectedCompetitor !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setMinDa(0);
    setSelectedCompetitor('all');
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              PR &amp; CITATION GAPS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Missing Authority Targets
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Discover high-authority publisher websites that currently recommend your competitors in AI search results while omitting your brand, and turn those gaps into PR opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGaps}
            disabled={loading}
            className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-2 text-slate-500', loading && 'animate-spin')} />
            Refresh Targets
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="border border-slate-200/90 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Missing Authority Targets
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Globe2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data?.summary.totalGaps ?? 8}
              </span>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                High Priority
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Websites citing competitors where your brand has 0 mentions
            </p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="border border-slate-200/90 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Avg. Target Domain Authority
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data?.summary.avgDomainAuthority ?? 87}
              </span>
              <span className="text-xs font-normal text-slate-500">/ 100 DA</span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Top Tier
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              High search engine trust &amp; AI recommendation authority
            </p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="border border-slate-200/90 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Top Competitor Lead
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl font-bold tracking-tight text-slate-900 block truncate">
                {data?.summary.topCompetitorAdvantage?.split(' (')[0] || 'Alo Yoga'}
              </span>
              <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-block mt-1">
                Dominates 5 target roundups
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Primary brand to displace in editorial roundups
            </p>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="border border-slate-200/90 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Estimated Recommendation Opportunity
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-purple-700">
                {data?.summary.estimatedSovOpportunity ? data.summary.estimatedSovOpportunity.replace('SOV', 'Growth') : '+18.4% Growth'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Projected recommendation rate gain once opportunities are addressed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search target domain, topic, or angle..."
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

          {/* Right dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Minimum DA Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    minDa > 0 && 'border-emerald-500 text-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-500'
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  {minDa === 0 ? 'Min DA: All' : `Min DA: ${minDa}+`}
                  <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-xs font-sans">
                <DropdownMenuLabel>Domain Authority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setMinDa(0)} className={cn(minDa === 0 && 'font-semibold text-emerald-700')}>
                  All Authorities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMinDa(80)} className={cn(minDa === 80 && 'font-semibold text-emerald-700')}>
                  DA 80+ (High Authority)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMinDa(85)} className={cn(minDa === 85 && 'font-semibold text-emerald-700')}>
                  DA 85+ (Tier 1 Authority)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMinDa(90)} className={cn(minDa === 90 && 'font-semibold text-emerald-700')}>
                  DA 90+ (National / Top Pubs)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Competitor Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    selectedCompetitor !== 'all' && 'border-purple-500 text-purple-700 bg-purple-50/50 ring-1 ring-purple-500'
                  )}
                >
                  <Building2 className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  {selectedCompetitor === 'all' ? 'All Competitors' : selectedCompetitor}
                  <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs font-sans">
                <DropdownMenuLabel>Filter by Competitor</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSelectedCompetitor('all')}
                  className={cn(selectedCompetitor === 'all' && 'font-semibold text-purple-700')}
                >
                  All Competitors
                </DropdownMenuItem>
                {(data?.competitors || [
                  { name: 'Alo Yoga', domain: 'aloyoga.com' },
                  { name: 'Vuori', domain: 'vuoriclothing.com' },
                  { name: 'Athleta', domain: 'athleta.gap.com' },
                ]).map((c) => (
                  <DropdownMenuItem
                    key={c.name}
                    onClick={() => setSelectedCompetitor(c.name)}
                    className={cn(selectedCompetitor === c.name && 'font-semibold text-purple-700')}
                  >
                    {c.name}
                  </DropdownMenuItem>
                ))}
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

        {/* Source Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center shrink-0">
            <Filter className="h-3 w-3 mr-1 text-slate-400" />
            Source Type:
          </span>

          <button
            onClick={() => setSelectedType('all')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-all border shrink-0',
              selectedType === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            )}
          >
            All Sources ({data?.gaps?.length || 0})
          </button>

          <button
            onClick={() => setSelectedType('news')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-all border flex items-center gap-1.5 shrink-0',
              selectedType === 'news'
                ? 'bg-blue-50 text-blue-800 border-blue-600 ring-1 ring-blue-600 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            )}
          >
            <Newspaper className="h-3 w-3 text-blue-600" />
            News & Editorial
          </button>

          <button
            onClick={() => setSelectedType('forum')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-all border flex items-center gap-1.5 shrink-0',
              selectedType === 'forum'
                ? 'bg-orange-50 text-orange-800 border-orange-600 ring-1 ring-orange-600 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            )}
          >
            <MessageCircle className="h-3 w-3 text-orange-600" />
            Forums & Communities
          </button>

          <button
            onClick={() => setSelectedType('blog')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-all border flex items-center gap-1.5 shrink-0',
              selectedType === 'blog'
                ? 'bg-purple-50 text-purple-800 border-purple-600 ring-1 ring-purple-600 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            )}
          >
            <FileText className="h-3 w-3 text-purple-600" />
            Industry Blogs
          </button>
        </div>
      </div>

      {/* Prioritized Target Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Prioritized Authority Gaps ({filteredGaps.length} Targets)
            </h3>
            <p className="text-xs text-slate-500">
              Ranked by Growth Opportunity Score (Domain Authority × Competitor Coverage)
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Prioritized by AI recommendation influence
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[260px] text-xs font-semibold text-slate-600 py-3.5 pl-6">
                  Target Publication / Domain
                </TableHead>
                <TableHead className="w-[100px] text-xs font-semibold text-slate-600 text-center">
                  Source Type
                </TableHead>
                <TableHead className="w-[110px] text-xs font-semibold text-slate-600 text-center">
                  Authority (DA)
                </TableHead>
                <TableHead className="w-[200px] text-xs font-semibold text-slate-600">
                  Competitors Cited
                </TableHead>
                <TableHead className="w-[120px] text-xs font-semibold text-slate-600 text-center">
                  Opportunity
                </TableHead>
                <TableHead className="min-w-[280px] text-xs font-semibold text-slate-600 pr-6">
                  Editorial Context & Target Topic
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
                      <span>Scanning AI search answers for competitor opportunities...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredGaps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldCheck className="h-8 w-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">No matching authority gaps found</p>
                      <p className="text-slate-400">Try adjusting your filters or search keywords</p>
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
                filteredGaps.map((item) => {
                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Domain */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <DomainFavicon domain={item.domain} className="h-5 w-5 rounded shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {item.domain}
                            </span>
                            <a
                              href={item.recentCompetitorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-slate-400 hover:text-emerald-600 inline-flex items-center gap-1 transition-colors truncate max-w-[200px]"
                            >
                              <span>Inspect cited article</span>
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </TableCell>

                      {/* Source Type */}
                      <TableCell className="text-center py-4">
                        {item.sourceType === 'news' && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-medium">
                            News
                          </Badge>
                        )}
                        {item.sourceType === 'forum' && (
                          <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[11px] font-medium">
                            Forum
                          </Badge>
                        )}
                        {item.sourceType === 'blog' && (
                          <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-medium">
                            Blog
                          </Badge>
                        )}
                        {item.sourceType === 'documentation' && (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-medium">
                            Docs
                          </Badge>
                        )}
                      </TableCell>

                      {/* Domain Authority */}
                      <TableCell className="text-center py-4">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-900">
                              {item.domainAuthority}
                            </span>
                            <span className="text-[10px] text-slate-400">/100</span>
                          </div>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                item.domainAuthority >= 90
                                  ? 'bg-emerald-500'
                                  : item.domainAuthority >= 80
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              )}
                              style={{ width: `${item.domainAuthority}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Competitors Cited */}
                      <TableCell className="py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {item.competitorsCited.map((comp) => (
                            <span
                              key={comp.name}
                              className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded border border-slate-200/80"
                            >
                              <span>{comp.name}</span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                ({comp.mentions}x)
                              </span>
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      {/* Opportunity Score */}
                      <TableCell className="text-center py-4">
                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full text-xs">
                          <Flame className="h-3 w-3 text-emerald-600" />
                          <span>{item.opportunityScore}/100</span>
                        </div>
                      </TableCell>

                      {/* Editorial Context & Target Topic */}
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1 max-w-sm">
                          <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                            {item.relevanceTopic}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-2">
                            {item.recommendedAngle}
                          </span>
                        </div>
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
