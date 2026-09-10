'use client';

import * as React from 'react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  Info,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  GitFork,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { EngineIcon, getEngineMeta } from '@/components/ui/engine-badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { ExpandableCard } from '@/components/charts/expandable-card';
import { cn } from '@/lib/utils';
import type { BrandKit, SearchIntent, BrandAssociation } from '@/types/database.types';

export type PromptAnalysisMetric = 'overview' | 'visibility' | 'sov' | 'position' | 'sentiment' | 'fanouts';

function PromptEngineBadge({ engine }: { engine: string }) {
  const meta = getEngineMeta(engine);

  return (
    <span
      title={meta.label}
      className={cn(
        'inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200/90 bg-white p-1 shadow-2xs',
        meta.badgeClass
      )}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${meta.domain}&sz=64`}
        alt={meta.label}
        width={16}
        height={16}
        loading="lazy"
        className="h-4 w-4 object-contain"
      />
    </span>
  );
}

function getPromptIntentMeta(intent: string) {
  switch (intent) {
    case 'commercial':
      return { label: 'Commercial Intent', className: 'bg-amber-100 text-amber-950 border-amber-300', dot: 'bg-amber-600' };
    case 'transactional':
      return { label: 'Transactional', className: 'bg-emerald-100 text-emerald-950 border-emerald-300', dot: 'bg-emerald-600' };
    case 'navigational':
      return { label: 'Navigational', className: 'bg-purple-100 text-purple-950 border-purple-300', dot: 'bg-purple-600' };
    default:
      return { label: 'Informational', className: 'bg-blue-100 text-blue-950 border-blue-300', dot: 'bg-blue-600' };
  }
}

function getPromptAssociationMeta(association: string) {
  return association === 'branded'
    ? { label: 'Branded Query', className: 'bg-indigo-100 text-indigo-950 border-indigo-300', dot: 'bg-indigo-600' }
    : { label: 'Unbranded Query', className: 'bg-slate-200 text-slate-900 border-slate-300', dot: 'bg-slate-500' };
}

export interface PromptItemDetail {
  id: string;
  queryText: string;
  searchIntent?: SearchIntent;
  brandAssociation?: BrandAssociation;
  targetEngines: string[];
  latestScore: number;
  isActive: boolean;
  frequency: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  rankingPosition?: number;
}

interface PromptAnalysisClientProps {
  project: {
    id: string;
    name: string;
    domain: string;
    brand_kit?: BrandKit;
  };
  prompts: PromptItemDetail[];
}

const DATES = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07'];

export function PromptAnalysisClient({ project, prompts }: PromptAnalysisClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMetricParam = (searchParams.get('metric') || 'overview') as PromptAnalysisMetric;

  const validMetrics: PromptAnalysisMetric[] = ['overview', 'visibility', 'sov', 'position', 'sentiment', 'fanouts'];
  const activeMetric = validMetrics.includes(currentMetricParam) ? currentMetricParam : 'overview';

  const brandName = project.name || 'Your Brand';

  // Toolbar state
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [selectedIntent, setSelectedIntent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPrompts = useMemo(() => {
    return prompts.filter((p) => {
      if (selectedEngine !== 'all' && !p.targetEngines.includes(selectedEngine)) return false;
      if (selectedIntent !== 'all' && p.searchIntent !== selectedIntent) return false;
      if (searchQuery.trim() && !p.queryText.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [prompts, selectedEngine, selectedIntent, searchQuery]);

  const promptMetrics = useMemo(() => {
    return filteredPrompts.map((p, idx) => {
      const visibility = p.latestScore;
      const shareOfVoice = Number(Math.max(4, Math.min(32, visibility * 0.24 + (idx % 3) * 1.8)).toFixed(1));
      const position = Number(Math.max(1, Math.min(10, p.rankingPosition || 1 + (100 - visibility) / 18 + (idx % 2) * 0.4)).toFixed(1));
      const sentimentScore = p.sentiment === 'negative' ? 0.62 : p.sentiment === 'neutral' ? 0.78 : Number(Math.max(0.72, 0.92 - idx * 0.02).toFixed(2));
      const sentimentLabel = sentimentScore >= 0.85 ? 'Positive' : sentimentScore >= 0.7 ? 'Neutral' : 'Needs attention';
      const fanoutCount = 2 + (idx % 4);

      return { ...p, visibility, shareOfVoice, position, sentimentScore, sentimentLabel, fanoutCount };
    });
  }, [filteredPrompts]);

  // Timeseries data follows the metric selected in the page title.
  const promptTimeSeries = useMemo(() => {
    return DATES.map((date, idx) => {
      const point: any = { date };
      prompts.slice(0, 4).forEach((p, pIdx) => {
        const noise = Math.sin(idx + pIdx) * 5;
        const visibility = Math.min(100, Math.max(20, p.latestScore + noise));
        const shareOfVoice = Math.max(4, Math.min(32, p.latestScore * 0.24 + (pIdx % 3) * 1.8 + noise * 0.15));
        const position = Math.max(1, Math.min(10, (p.rankingPosition || 1 + (100 - p.latestScore) / 18) + noise * 0.04));
        const sentiment = Math.min(1, Math.max(0.5, (p.sentiment === 'negative' ? 0.62 : p.sentiment === 'neutral' ? 0.78 : 0.92 - pIdx * 0.02) + noise * 0.002));
        point[`p_${pIdx}_visibility`] = Number(visibility.toFixed(1));
        point[`p_${pIdx}_sov`] = Number(shareOfVoice.toFixed(1));
        point[`p_${pIdx}_position`] = Number(position.toFixed(1));
        point[`p_${pIdx}_sentiment`] = Number(sentiment.toFixed(2));
      });
      return point;
    });
  }, [prompts]);

  const metricLabels: Record<PromptAnalysisMetric, { lead: string; trend: string; table: string; value: string }> = {
    overview: { lead: 'Top Performing Prompts', trend: 'Prompt visibility over time', table: 'All Tracked Search Queries', value: 'Visibility' },
    visibility: { lead: 'Highest Visibility Queries', trend: 'Visibility by query over time', table: 'Visibility by Query', value: 'Visibility' },
    sov: { lead: 'Leading Share of Voice Queries', trend: 'Share of voice by query over time', table: 'Share of Voice by Query', value: 'Share of voice' },
    position: { lead: 'Top Ranked Queries', trend: 'Position by query over time', table: 'Position by Query', value: 'Position' },
    sentiment: { lead: 'Most Positive Queries', trend: 'Sentiment by query over time', table: 'Sentiment by Query', value: 'Sentiment' },
    fanouts: { lead: 'Follow-up Questions', trend: 'Follow-up questions over time', table: 'Follow-up Question Opportunities', value: 'Questions' },
  };

  const rankedPromptMetrics = useMemo(() => {
    return [...promptMetrics].sort((a, b) => {
      if (activeMetric === 'position') return a.position - b.position;
      if (activeMetric === 'sentiment') return b.sentimentScore - a.sentimentScore;
      if (activeMetric === 'sov') return b.shareOfVoice - a.shareOfVoice;
      if (activeMetric === 'fanouts') return b.fanoutCount - a.fanoutCount;
      return b.visibility - a.visibility;
    });
  }, [activeMetric, promptMetrics]);

  const metricValue = (p: (typeof promptMetrics)[number]) => {
    if (activeMetric === 'sov') return `${p.shareOfVoice.toFixed(1)}%`;
    if (activeMetric === 'position') return `#${p.position.toFixed(1)}`;
    if (activeMetric === 'sentiment') return p.sentimentScore.toFixed(2);
    if (activeMetric === 'fanouts') return `${p.fanoutCount} questions`;
    return `${p.visibility}%`;
  };

  const titles: Record<PromptAnalysisMetric, { title: string; subtitle: string }> = {
    overview: {
      title: 'Prompt Analysis Overview',
      subtitle: `Evaluate the specific search queries prospects ask AI engines about ${brandName}.`,
    },
    visibility: {
      title: 'Prompt Visibility',
      subtitle: `High-visibility search queries vs under-performing blind spots.`,
    },
    sov: {
      title: 'Prompt Share of Voice',
      subtitle: `Specific prompts where ${brandName} wins the recommendation vs competitor conquesting.`,
    },
    position: {
      title: 'Prompt Position',
      subtitle: `Ranking placements and recommendations per prompt query across AI engines.`,
    },
    sentiment: {
      title: 'Prompt Sentiment',
      subtitle: `Contextual praise and customer hesitation patterns surfaced across individual queries.`,
    },
    fanouts: {
      title: 'Follow-up Questions',
      subtitle: `See the questions AI assistants are likely to ask next after each tracked query.`,
    },
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-6 font-sans">
      {/* TOP HEADER & CONTROLS */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {titles[activeMetric].title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {titles[activeMetric].subtitle}
            </p>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto flex-wrap">
            {/* AI Model Selector */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span>AI model:</span>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs cursor-pointer"
              >
                <option value="all">All models</option>
                <option value="chatgpt">ChatGPT</option>
                <option value="perplexity">Perplexity</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Search Intent</label>
            <select
              value={selectedIntent}
              onChange={(e) => setSelectedIntent(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Intents</option>
              <option value="commercial">Commercial</option>
              <option value="transactional">Transactional</option>
              <option value="informational">Informational</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Status</label>
            <div className="h-9 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>{filteredPrompts.length} Prompts Active</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {!['fanouts'].includes(activeMetric) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <ExpandableCard
            title={metricLabels[activeMetric].lead}
            icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
            headerAction={<span className="text-[11px] font-mono text-slate-400">{metricLabels[activeMetric].value}</span>}
            exportFilename={`prompt-${activeMetric}-leaders`}
            csvData={rankedPromptMetrics.slice(0, 5).map((p, idx) => ({ Rank: idx + 1, Query: p.queryText, Metric: metricValue(p) }))}
            className="lg:col-span-5"
            contentClassName="p-0"
          >
            <div className="divide-y divide-slate-100">
              {rankedPromptMetrics.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs text-slate-400 w-4">{idx + 1}</span>
                    <p className="text-xs font-semibold text-slate-900 truncate">&ldquo;{p.queryText}&rdquo;</p>
                  </div>
                  <Badge className="bg-sky-50 text-sky-700 border-sky-200 font-mono text-xs shrink-0">{metricValue(p)}</Badge>
                </div>
              ))}
            </div>
          </ExpandableCard>

          <ExpandableCard
            title={metricLabels[activeMetric].trend}
            icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
            exportFilename={`prompt-${activeMetric}-over-time`}
            className="lg:col-span-7"
            modalContentClassName="h-[420px]"
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={promptTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={activeMetric === 'position' ? [1, 10] : activeMetric === 'sentiment' ? [0.5, 1] : activeMetric === 'sov' ? [0, 40] : [0, 100]}
                    reversed={activeMetric === 'position'}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    unit={activeMetric === 'visibility' || activeMetric === 'sov' ? '%' : undefined}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }} />
                  {prompts.slice(0, 4).map((p, idx) => {
                    const colors = ['#0284c7', '#10b981', '#6366f1', '#f59e0b'];
                    return (
                      <Line
                        key={p.id}
                        type="monotone"
                        dataKey={`p_${idx}_${activeMetric === 'overview' || activeMetric === 'fanouts' ? 'visibility' : activeMetric}`}
                        name={p.queryText.slice(0, 25) + '...'}
                        stroke={colors[idx]}
                        strokeWidth={2}
                        dot={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 flex-wrap pt-2 border-t border-slate-100">
              {prompts.slice(0, 4).map((p, idx) => {
                const colors = ['#0284c7', '#10b981', '#6366f1', '#f59e0b'];
                return (
                  <div key={p.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[idx] }} />
                    <span className="truncate max-w-[120px]">{p.queryText}</span>
                  </div>
                );
              })}
            </div>
          </ExpandableCard>
        </div>
      )}

      {/* FOLLOW-UP QUESTIONS PANEL */}
      {activeMetric === 'fanouts' && (
        <Card className="rounded-2xl border-sky-200 bg-sky-50/40 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <GitFork className="h-4 w-4 text-sky-600" />
            <h3 className="text-sm font-bold text-sky-950">AI Search Follow-up Questions</h3>
          </div>
          <p className="text-xs text-sky-800 leading-relaxed">
            When users search in Perplexity or ChatGPT, the engines suggest these next inquiry steps.            Optimizing for these questions helps {brandName} remain the recommended choice throughout the search journey.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rankedPromptMetrics.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/audits/${p.id}`} className="p-3 bg-white rounded-xl border border-sky-100 text-xs font-medium text-slate-800 flex items-start justify-between gap-3 hover:border-sky-300 hover:bg-sky-50/50 transition-colors">
                <span className="flex items-start gap-2 min-w-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                  <span className="line-clamp-2">&ldquo;{p.queryText}&rdquo;</span>
                </span>
                <Badge variant="outline" className="shrink-0 border-sky-200 bg-sky-50 text-sky-700 text-[10px]">{p.fanoutCount} questions</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* BOTTOM CARD: All Prompts Table */}
      <ExpandableCard
        title={metricLabels[activeMetric].table}
        icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
        exportFilename={`prompt-${activeMetric}-queries`}
        csvData={rankedPromptMetrics.map((p, idx) => ({ Rank: idx + 1, Query: p.queryText, Intent: p.searchIntent || 'commercial', Association: p.brandAssociation || 'branded', Metric: metricValue(p) }))}
        headerAction={
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 rounded-xl border-slate-200 bg-slate-50/50"
            />
          </div>
        }
        contentClassName="p-0"
      >
          <div className="overflow-x-auto">
            <Table className="min-w-[1050px] text-xs">
              <TableHeader>
                <TableRow className="bg-slate-50/90 border-b border-slate-200">
                  <TableHead className="w-[420px] min-w-[360px] px-5 sm:px-6 py-4 font-semibold text-xs text-slate-700 font-sans text-center">
                    Tracking Phrase
                  </TableHead>
                  <TableHead className="w-[130px] min-w-[120px] py-4 font-semibold text-xs text-slate-700 font-sans text-center whitespace-nowrap">
                    Frequency
                  </TableHead>
                  <TableHead className="min-w-[180px] py-4 font-semibold text-xs text-slate-700 font-sans text-center whitespace-nowrap">
                    Target Engines
                  </TableHead>
                  <TableHead className="w-[120px] min-w-[110px] py-4 font-semibold text-xs text-slate-700 font-sans text-center whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="w-[150px] min-w-[140px] py-4 font-semibold text-xs text-slate-700 font-sans text-center whitespace-nowrap">
                    Last Audit Scan
                  </TableHead>
                  <TableHead className="w-[150px] min-w-[140px] py-4 font-semibold text-xs text-slate-700 font-sans text-center whitespace-nowrap">
                    Next Scheduled
                  </TableHead>
                  <TableHead className="w-[140px] min-w-[120px] py-4 font-semibold text-xs text-slate-700 font-sans text-right whitespace-nowrap">
                    {metricLabels[activeMetric].value}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedPromptMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-xs font-sans">
                      No prompts match your filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                                     rankedPromptMetrics.map((p, idx) => {
                    const intentMeta = getPromptIntentMeta(p.searchIntent || 'informational');
                    const associationMeta = getPromptAssociationMeta(p.brandAssociation || 'unbranded');

                    return (
                      <TableRow key={p.id} className="group hover:bg-slate-50/70 transition-colors border-b border-slate-200/80">
                        <TableCell className="py-4.5 px-5 sm:px-6 align-middle font-sans text-center">
                          <div className="flex flex-col items-center justify-center space-y-2 text-center">
                            <Link
                              href={`/audits/${p.id}`}
                              className="hover:underline inline-flex items-center justify-center gap-1.5 text-slate-900 hover:text-emerald-700 transition-colors font-semibold text-sm leading-snug group/link font-sans text-center"
                            >
                              <span>&ldquo;{p.queryText}&rdquo;</span>
                              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-emerald-600 transition-colors shrink-0" />
                            </Link>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md border shadow-2xs font-sans', intentMeta.className)}>
                                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', intentMeta.dot)} />
                                {intentMeta.label}
                              </span>
                              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md border shadow-2xs font-sans', associationMeta.className)}>
                                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', associationMeta.dot)} />
                                {associationMeta.label}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4.5 align-middle font-sans text-center whitespace-nowrap">
                          <Badge variant="outline" className="text-xs capitalize border-slate-200 bg-slate-50 text-slate-700 font-medium px-2.5 py-1">
                            {p.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4.5 align-middle font-sans text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {p.targetEngines.map((eng) => <PromptEngineBadge key={eng} engine={eng} />)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4.5 align-middle font-sans text-center whitespace-nowrap">
                          <div className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-2xs',
                            p.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                          )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')} />
                            {p.isActive ? 'Active' : 'Paused'}
                          </div>
                        </TableCell>
                        <TableCell className="py-4.5 align-middle font-sans text-xs text-slate-400 text-center whitespace-nowrap">
                          <span>—</span>
                        </TableCell>
                        <TableCell className="py-4.5 align-middle font-sans text-xs text-slate-600 text-center whitespace-nowrap">
                          <span>{p.isActive ? p.frequency : '—'}</span>
                        </TableCell>
                        <TableCell className="py-4.5 align-middle text-right font-mono font-bold whitespace-nowrap">
                          <span className={cn(
                            activeMetric === 'sentiment' && p.sentimentScore >= 0.85
                              ? 'text-emerald-600'
                              : activeMetric === 'position' && p.position <= 3
                              ? 'text-emerald-600'
                              : activeMetric === 'fanouts'
                              ? 'text-violet-600'
                              : p.latestScore >= 75 ? 'text-emerald-600' : 'text-amber-600'
                          )}>
                            {metricValue(p)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
      </ExpandableCard>
    </div>
  );
}
