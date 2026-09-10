'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  Info,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
  Bot,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { EngineIcon, getEngineMeta } from '@/components/ui/engine-badge';
import { BrandAvatar } from '@/components/citations/domain-favicon';
import { ExpandableCard } from '@/components/charts/expandable-card';
import { DashboardClientView } from '@/components/dashboard/dashboard-client';
import type { DashboardData } from '@/lib/dashboard-data';
import { cn } from '@/lib/utils';
import type { BrandKit } from '@/types/database.types';

export type BrandInsightMetric = 'overview' | 'mentions' | 'position' | 'sov' | 'visibility' | 'sentiment';

export interface AuditRunItem {
  id: string;
  promptId: string;
  queryText: string;
  engine: string;
  visibilityScore: number;
  brandMentioned: boolean;
  rankingPosition?: number | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  citedUrlsCount: number;
  timeAgo: string;
}

interface BrandFaviconTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
  domainsByLabel?: Record<string, string | undefined>;
}

/** Recharts Y-axis tick rendering the brand favicon next to the bar label. */
function BrandFaviconTick({ x = 0, y = 0, payload, domainsByLabel }: BrandFaviconTickProps) {
  if (!payload?.value) return null;
  const label = payload.value;
  const domain = domainsByLabel?.[label];
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

  return (
    <g transform={`translate(${x},${y})`}>
      {faviconUrl && (
        <image
          href={faviconUrl}
          x={-112}
          y={-7}
          height={14}
          width={14}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      <text
        x={faviconUrl ? -94 : -110}
        y={4}
        fill="#475569"
        fontSize={11}
        textAnchor="start"
      >
        {label}
      </text>
    </g>
  );
}

interface BrandInsightsClientProps {
  project: {
    id: string;
    name: string;
    domain: string;
    brand_kit?: BrandKit;
  };
  runs: any[];
  dashboardData?: DashboardData;
}

interface CompetitorRow {
  rank: number;
  name: string;
  isYourBrand: boolean;
  color: string;
  domain?: string;
  // Mentions
  mentions: number;
  // Position
  position: number;
  posDelta: number;
  bestPos: number;
  worstPos: number;
  avgPos: number;
  // SOV
  sov: number;
  sovDelta: number;
  highestSov: number;
  lowestSov: number;
  avgSov: number;
  // Visibility
  visibility: number;
  visDelta: number;
  highestVis: number;
  lowestVis: number;
  avgVis: number;
  // Sentiment
  sentimentScore: number;
  posMentions: number;
  neuMentions: number;
  negMentions: number;
}

const DATES = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07'];

export function BrandInsightsClient({ project, runs, dashboardData }: BrandInsightsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMetricParam = (searchParams.get('metric') || 'overview') as BrandInsightMetric;

  const validMetrics: BrandInsightMetric[] = ['overview', 'mentions', 'position', 'sov', 'visibility', 'sentiment'];
  const activeMetric = validMetrics.includes(currentMetricParam) ? currentMetricParam : 'overview';

  const brandName = project.name || 'Your Brand';

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Brand and competitor series
  const competitorColors = ['#0284c7', '#0f172a', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const brandList: CompetitorRow[] = useMemo(() => {
    const kitCompetitors = project.brand_kit?.competitors || [
      { name: 'Primary Rival' },
      { name: 'Emerging Competitor' },
      { name: 'Legacy Market Leader' },
      { name: 'Niche Alternative' },
    ];

    const allBrands = [
      { name: brandName, isYourBrand: true, domain: project.domain },
      ...kitCompetitors.map((c) => ({ name: c.name, isYourBrand: false, domain: 'domain' in c ? c.domain : undefined })),
    ];

    // Build metric profiles for each
    return allBrands.map((b, idx) => {
      const isYou = b.isYourBrand;
      const baseVis = isYou ? 76 : Math.max(22, 67 - idx * 12);
      const baseSov = isYou ? 17.1 : Math.max(4.4, Number((16.2 - idx * 2.8).toFixed(1)));
      const basePos = isYou ? 3.7 : Number((3.7 + idx * 0.1).toFixed(1));
      const baseMentions = isYou ? 20271 : Math.max(5343, Math.round(18391 - idx * 3500));
      const baseSent = isYou ? 0.93 : Number((0.88 - idx * 0.04).toFixed(2));

      return {
        rank: idx + 1,
        name: b.name,
        isYourBrand: isYou,
        color: competitorColors[idx % competitorColors.length],
        domain: (b as { domain?: string }).domain,
        // Mentions
        mentions: baseMentions,
        // Position
        position: basePos,
        posDelta: isYou ? 0.2 : idx % 2 === 0 ? 0.3 : -0.2,
        bestPos: isYou ? 1.0 : 1.0 + idx * 0.5,
        worstPos: isYou ? 4.0 : 5.0 + idx * 1.0,
        avgPos: basePos,
        // SOV
        sov: baseSov,
        sovDelta: isYou ? 0.1 : idx % 2 === 0 ? -0.3 : 1.0,
        highestSov: Number((baseSov + 1.2).toFixed(1)),
        lowestSov: Number((baseSov - 0.8).toFixed(1)),
        avgSov: baseSov,
        // Visibility
        visibility: baseVis,
        visDelta: isYou ? 1 : idx % 2 === 0 ? -1 : -2,
        highestVis: baseVis + 3,
        lowestVis: baseVis - 2,
        avgVis: baseVis,
        // Sentiment
        sentimentScore: baseSent,
        posMentions: Math.round(baseMentions * (baseSent * 0.9)),
        neuMentions: Math.round(baseMentions * 0.08),
        negMentions: Math.round(baseMentions * (1 - baseSent * 0.9 - 0.08)),
      };
    });
  }, [brandName, project.brand_kit]);

  // Filtered rows for bottom table based on search input
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brandList;
    const q = searchQuery.toLowerCase();
    return brandList.filter((b) => b.name.toLowerCase().includes(q));
  }, [brandList, searchQuery]);

  // Horizontal bar data for the Mentions snapshot card
  const mentionsBarData = useMemo(() => {
    return brandList.slice(0, 5).map((b) => ({
      name: b.name.length > 14 ? `${b.name.slice(0, 13)}…` : b.name,
      fullName: b.name,
      mentions: b.mentions,
      color: b.color,
      domain: b.domain,
    }));
  }, [brandList]);

  // Donut data for the SOV snapshot card
  const sovDonutData = useMemo(() => {
    return brandList.slice(0, 5).map((b) => ({
      name: b.name,
      sov: b.sov,
      delta: b.sovDelta,
      color: b.color,
      domain: b.domain,
      isYourBrand: b.isYourBrand,
    }));
  }, [brandList]);

  const yourSovEntry = sovDonutData.find((d) => d.isYourBrand) || sovDonutData[0];

  const domainByBarLabel = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    mentionsBarData.forEach((d) => {
      map[d.name] = d.domain;
    });
    return map;
  }, [mentionsBarData]);

  // Timeseries data for Line/Area charts
  const timeSeriesData = useMemo(() => {
    return DATES.map((date, dayIdx) => {
      const point: any = { date };
      brandList.forEach((b, bIdx) => {
        // Mentions
        const mentionNoise = Math.round(Math.sin((dayIdx + bIdx) * 1.5) * 200);
        point[`${b.name}_mentions`] = Math.max(400, Math.round(b.mentions / 7) + mentionNoise);

        // Position (1 is top)
        const posNoise = Number((Math.sin(dayIdx + bIdx) * 0.4).toFixed(1));
        point[`${b.name}_position`] = Math.max(1, Number((b.position + posNoise).toFixed(1)));

        // Visibility
        const visNoise = Math.round(Math.cos(dayIdx + bIdx) * 3);
        point[`${b.name}_visibility`] = Math.min(100, Math.max(10, b.visibility + visNoise));

        // SOV (percentage)
        const sovNoise = Number((Math.sin(dayIdx * 0.8 + bIdx) * 0.6).toFixed(1));
        point[`${b.name}_sov`] = Math.max(1, Number((b.sov + sovNoise).toFixed(1)));

        // Sentiment (0.7 to 0.98)
        const sentNoise = Number((Math.sin(dayIdx + bIdx) * 0.03).toFixed(2));
        point[`${b.name}_sentiment`] = Math.min(1.0, Math.max(0.5, Number((b.sentimentScore + sentNoise).toFixed(2))));
      });
      return point;
    });
  }, [brandList]);

  const titles: Record<BrandInsightMetric, { title: string; subtitle: string }> = {
    overview: {
      title: 'Brand Insights Overview',
      subtitle: `Comprehensive competitive benchmarking and generative perception for ${brandName}.`,
    },
    mentions: {
      title: 'Mentions',
      subtitle: `Frequency and trend of organic brand citations synthesized across AI models.`,
    },
    position: {
      title: 'Position',
      subtitle: `Ranking place and prominence when ${brandName} is recommended in AI search answers.`,
    },
    sov: {
      title: 'Share of voice',
      subtitle: `Total percentage of generative search mindshare captured against competitors.`,
    },
    visibility: {
      title: 'Visibility score',
      subtitle: `Aggregate visibility index benchmarked over time across all prompt evaluations.`,
    },
    sentiment: {
      title: 'Sentiment',
      subtitle: `Appraisal, consumer friction, and tone analysis when AI models cite ${brandName}.`,
    },
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-6 font-sans">
      {/* Page title & subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {titles[activeMetric].title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {titles[activeMetric].subtitle}
        </p>
      </div>

      {/* ============================================================ */}
      {/* 1. MENTIONS VIEW (Image 5)                                   */}
      {/* ============================================================ */}
      {activeMetric === 'mentions' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top 2 Cards: Table Left, Line Chart Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Snapshot Table (~40%) */}
            <ExpandableCard
              title="Mentions"
              icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
              exportFilename="brand-mentions"
              csvData={mentionsBarData.map((d) => ({ Rank: '', Brand: d.fullName, Mentions: d.mentions }))}
              className="lg:col-span-5"
            >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mentionsBarData}
                      layout="vertical"
                      margin={{ top: 4, right: 44, left: 8, bottom: 0 }}
                      barCategoryGap="26%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={116}
                        tick={<BrandFaviconTick domainsByLabel={domainByBarLabel} />}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                        formatter={(value) => [Number(value).toLocaleString(), 'Mentions']}
                        labelFormatter={(_, payload) => (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName ?? ''}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                      />
                      <Bar dataKey="mentions" radius={[0, 6, 6, 0]} barSize={16}>
                        {mentionsBarData.map((entry) => (
                          <Cell key={entry.fullName} fill={entry.color} />
                        ))}                        <LabelList
                          dataKey="mentions"
                          position="right"
                          formatter={(value: unknown) => Number(value ?? 0).toLocaleString()}
                          fill="#64748b"
                          fontSize={10}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            </ExpandableCard>

            {/* Right Trend Chart (~60%) */}
            <ExpandableCard
              title="Mentions over time"
              icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
              exportFilename="brand-mentions-over-time"
              className="lg:col-span-7"
              modalContentClassName="h-[420px]"
            >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                      />
                      {brandList.slice(0, 5).map((b) => (
                        <Line
                          key={b.name}
                          type="monotone"
                          dataKey={`${b.name}_mentions`}
                          name={b.name}
                          stroke={b.color}
                          strokeWidth={b.isYourBrand ? 2.5 : 1.5}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 flex-wrap pt-2 border-t border-slate-100">
                  {brandList.slice(0, 5).map((b) => (
                    <div key={b.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className={b.isYourBrand ? 'font-bold text-slate-900' : ''}>{b.name}</span>
                    </div>
                  ))}
                </div>
            </ExpandableCard>
          </div>

          {/* Bottom Card: All brand mentions table */}
          <ExpandableCard
            title="All brand mentions"
            icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
            exportFilename="all-brand-mentions"
            csvData={filteredBrands.map((b) => ({ Rank: b.rank, Brand: b.name, Mentions: b.mentions }))}
            headerAction={
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pl-8 rounded-xl border-slate-200 bg-slate-50/50"
                />
              </div>
            }
            contentClassName="p-0"
          >
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-3 px-5 text-left w-12">#</th>
                    <th className="py-3 px-5 text-left">Brand</th>
                    <th className="py-3 px-5 text-right flex items-center justify-end gap-1">
                      <span>Mentions</span>
                      <ArrowDown className="h-3 w-3" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBrands.map((b) => (
                    <tr key={b.name} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5 font-mono text-slate-400">{b.rank}</td>
                      <td className="py-3.5 px-5 flex items-center gap-2.5">
                        <BrandAvatar name={b.name} domain={b.domain} color={b.color} />
                        <span className="font-semibold text-slate-900">{b.name}</span>
                        {b.isYourBrand && (
                          <Badge variant="outline" className="text-[10px] font-mono border-sky-200 bg-sky-50 text-sky-700 py-0 px-1.5">
                            Your brand
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                        {b.mentions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </ExpandableCard>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. POSITION VIEW (Image 4)                                   */}
      {/* ============================================================ */}
      {activeMetric === 'position' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Snapshot Table */}
            <ExpandableCard
              title="Your latest position"
              icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
              headerAction={<span className="text-[11px] font-mono text-slate-400">Aug 31 vs. Sep 7</span>}
              exportFilename="brand-position-snapshot"
              csvData={brandList.slice(0, 5).map((b) => ({ Rank: b.rank, Brand: b.name, Position: b.position }))}
              className="lg:col-span-5"
              contentClassName="p-0"
            >
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="py-2.5 px-4 text-left w-8">#</th>
                      <th className="py-2.5 px-4 text-left">Brand</th>
                      <th className="py-2.5 px-4 text-right">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {brandList.slice(0, 5).map((b) => (
                      <tr key={b.name} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-400">{b.rank}</td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <BrandAvatar name={b.name} domain={b.domain} color={b.color} />
                          <span className="font-semibold text-slate-900">{b.name}</span>
                          {b.isYourBrand && (
                            <Badge variant="outline" className="text-[9px] font-mono border-sky-200 bg-sky-50 text-sky-700 py-0 px-1.5">
                              Your brand
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {b.position.toFixed(1)}{' '}
                          <span className={cn('text-[10px]', b.posDelta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                            ({b.posDelta >= 0 ? `+${b.posDelta}` : b.posDelta})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </ExpandableCard>

            {/* Right Trajectory Chart */}
            <ExpandableCard
              title="Position over time"
              icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
              exportFilename="brand-position-over-time"
              className="lg:col-span-7"
              modalContentClassName="h-[420px]"
            >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      {/* Inverted Y-axis because Rank 1 is top */}
                      <YAxis reversed domain={[1, 9]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }} />
                      {brandList.slice(0, 5).map((b) => (
                        <Line
                          key={b.name}
                          type="monotone"
                          dataKey={`${b.name}_position`}
                          name={b.name}
                          stroke={b.color}
                          strokeWidth={b.isYourBrand ? 2.5 : 1.5}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 flex-wrap pt-2 border-t border-slate-100">
                  {brandList.slice(0, 5).map((b) => (
                    <div key={b.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className={b.isYourBrand ? 'font-bold text-slate-900' : ''}>{b.name}</span>
                    </div>
                  ))}
                </div>
            </ExpandableCard>
          </div>

          {/* Bottom Card: All brand positions table */}
          <ExpandableCard
            title="All brand positions"
            icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
            exportFilename="all-brand-positions"
            csvData={filteredBrands.map((b) => ({ Rank: b.rank, Brand: b.name, Latest: b.position, Best: b.bestPos, Worst: b.worstPos, Average: b.avgPos }))}
            headerAction={
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pl-8 rounded-xl border-slate-200 bg-slate-50/50"
                />
              </div>
            }
            contentClassName="p-0"
          >
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-3 px-5 text-left w-12">#</th>
                    <th className="py-3 px-5 text-left">Brand</th>
                    <th className="py-3 px-5 text-center">Latest position</th>
                    <th className="py-3 px-5 text-center">Best position</th>
                    <th className="py-3 px-5 text-center">Worst position</th>
                    <th className="py-3 px-5 text-right">Avg. position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBrands.map((b) => (
                    <tr key={b.name} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5 font-mono text-slate-400">{b.rank}</td>
                      <td className="py-3.5 px-5 flex items-center gap-2.5">
                        <BrandAvatar name={b.name} domain={b.domain} color={b.color} />
                        <span className="font-semibold text-slate-900">{b.name}</span>
                        {b.isYourBrand && (
                          <Badge variant="outline" className="text-[10px] font-mono border-sky-200 bg-sky-50 text-sky-700 py-0 px-1.5">
                            Your brand
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono font-semibold text-slate-800">
                        {b.position.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-emerald-600 font-bold">
                        {b.bestPos.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-slate-500">
                        {b.worstPos.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                        {b.avgPos.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </ExpandableCard>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. SHARE OF VOICE VIEW (Image 3)                             */}
      {/* ============================================================ */}
      {activeMetric === 'sov' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Snapshot Table */}
            <ExpandableCard
              title="Your latest share of voice"
              icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
              headerAction={<span className="text-[11px] font-mono text-slate-400">Aug 31 vs. Sep 7</span>}
              exportFilename="brand-sov-snapshot"
              csvData={sovDonutData.map((d) => ({ Brand: d.name, SOV: d.sov, Delta: d.delta }))}
              className="lg:col-span-5"
            >
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sovDonutData}
                        dataKey="sov"
                        nameKey="name"
                        innerRadius="62%"
                        outerRadius="88%"
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {sovDonutData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                        <Label
                          content={({ viewBox }: any) => {
                            const cx = viewBox?.cx;
                            const cy = viewBox?.cy;
                            if (typeof cx !== 'number' || typeof cy !== 'number') return null;
                            return (
                              <text x={cx} y={cy} textAnchor="middle">
                                <tspan x={cx} dy="-0.15em" fontSize={22} fontWeight={700} fill="#0f172a">
                                  {yourSovEntry ? `${yourSovEntry.sov.toFixed(1)}%` : '—'}
                                </tspan>
                                <tspan x={cx} dy="1.35em" fontSize={11} fill="#94a3b8">
                                  Your brand
                                </tspan>
                              </text>
                            );
                          }}
                        />
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Share of voice']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Per-brand breakdown legend */}
                <div className="divide-y divide-slate-100 pt-2 border-t border-slate-100">
                  {sovDonutData.map((d, idx) => (
                    <div key={d.name} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {idx + 1}. {d.name}
                        </span>
                        {d.isYourBrand && (
                          <Badge variant="outline" className="text-[9px] font-mono border-sky-200 bg-sky-50 text-sky-700 py-0 px-1.5 shrink-0">
                            Your brand
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-900 shrink-0">
                        {d.sov.toFixed(1)}%{' '}
                        <span className={cn('text-[10px]', d.delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                          ({d.delta >= 0 ? `+${d.delta}%` : `${d.delta}%`})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
            </ExpandableCard>

            {/* Right Share of Voice Line Chart */}
            <ExpandableCard
              title="Share of voice over time"
              icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
              headerAction={<span className="text-[11px] font-mono text-slate-400">Last 7 days</span>}
              exportFilename="brand-sov-over-time"
              csvData={timeSeriesData.map((point) => ({
                Date: point.date,
                ...Object.fromEntries(brandList.slice(0, 5).map((b) => [b.name, point[`${b.name}_sov`]])),
              }))}
              className="lg:col-span-7"
              modalContentClassName="h-[420px]"
            >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 24]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Share of voice']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                      />
                      {brandList.slice(0, 5).map((b) => (
                        <Line
                          key={b.name}
                          type="monotone"
                          dataKey={`${b.name}_sov`}
                          name={b.name}
                          stroke={b.color}
                          strokeWidth={b.isYourBrand ? 2.5 : 1.5}
                          dot={{ r: b.isYourBrand ? 3 : 2, fill: b.color, strokeWidth: 0 }}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 flex-wrap pt-2 border-t border-slate-100">
                  {brandList.slice(0, 5).map((b) => (
                    <div key={b.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <BrandAvatar name={b.name} domain={b.domain} color={b.color} />
                      <span className={b.name === brandName ? 'font-bold text-slate-900' : ''}>{b.name}</span>
                    </div>
                  ))}
                </div>
            </ExpandableCard>
          </div>

          {/* Bottom Card: Share of voice by brand */}
          <ExpandableCard
            title="Share of voice by brand"
            icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
            exportFilename="brand-sov-by-brand"
            csvData={filteredBrands.map((b) => ({ Rank: b.rank, Brand: b.name, Latest: b.sov, Highest: b.highestSov, Lowest: b.lowestSov, Average: b.avgSov }))}
            headerAction={
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pl-8 rounded-xl border-slate-200 bg-slate-50/50"
                />
              </div>
            }
            contentClassName="p-0"
          >
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-3 px-5 text-left w-12">#</th>
                    <th className="py-3 px-5 text-left">Brand</th>
                    <th className="py-3 px-5 text-center">Latest SOV</th>
                    <th className="py-3 px-5 text-center">Highest SOV</th>
                    <th className="py-3 px-5 text-center">Lowest SOV</th>
                    <th className="py-3 px-5 text-right">Average SOV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBrands.map((b) => (
                    <tr key={b.name} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5 font-mono text-slate-400">{b.rank}</td>
                      <td className="py-3.5 px-5 flex items-center gap-2.5">
                        <BrandAvatar name={b.name} domain={b.domain} color={b.color} />
                        <span className="font-semibold text-slate-900">{b.name}</span>
                        {b.isYourBrand && (
                          <Badge variant="outline" className="text-[10px] font-mono border-sky-200 bg-sky-50 text-sky-700 py-0 px-1.5">
                            Your brand
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-900">
                        {b.sov.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-emerald-600 font-semibold">
                        {b.highestSov.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-slate-500">
                        {b.lowestSov.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-sky-700">
                        {b.avgSov.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </ExpandableCard>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. VISIBILITY SCORE VIEW (Image 2)                           */}
      {/* ============================================================ */}
      {activeMetric === 'visibility' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Snapshot Table */}
            <ExpandableCard
              title="Your latest visibility score"
              icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
              headerAction={<span className="text-[11px] font-mono text-slate-400">Aug 31 vs. Sep 7</span>}
              exportFilename="brand-visibility-snapshot"
              csvData={brandList.slice(0, 5).map((b) => ({ Rank: b.rank, Brand: b.name, Visibility: b.visibility }))}
              className="lg:col-span-5"
              contentClassName="p-0"
            >
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="py-2.5 px-4 text-left w-8">#</th>
                      <th className="py-2.5 px-4 text-left">Brand</th>
                      <th className="py-2.5 px-4 text-right">Visibility score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {brandList.slice(0, 5).map((b) => (
                      <tr key={b.name} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-400">{b.rank}</td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <BrandAvatar name={b.name} domain={b.domain} color={b.color} />
                          <span className="font-semibold text-slate-900">{b.name}</span>
                          {b.isYourBrand && (
                            <Badge variant="outline" className="text-[9px] font-mono border-sky-200 bg-sky-50 text-sky-700 py-0 px-1.5">
                              Your brand
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {b.visibility}%{' '}
                          <span className={cn('text-[10px]', b.visDelta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                            ({b.visDelta >= 0 ? `+${b.visDelta}%` : `${b.visDelta}%`})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </ExpandableCard>

            {/* Right Trend Chart */}
            <ExpandableCard
              title="Visibility over time"
              icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
              exportFilename="brand-visibility-over-time"
              className="lg:col-span-7"
              modalContentClassName="h-[420px]"
            >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[20, 90]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }} />
                      {brandList.slice(0, 5).map((b) => (
                        <Line
                          key={b.name}
                          type="monotone"
                          dataKey={`${b.name}_visibility`}
                          name={b.name}
                          stroke={b.color}
                          strokeWidth={b.isYourBrand ? 2.5 : 1.5}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 flex-wrap pt-2 border-t border-slate-100">
                  {brandList.slice(0, 5).map((b) => (
                    <div key={b.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className={b.isYourBrand ? 'font-bold text-slate-900' : ''}>{b.name}</span>
                    </div>
                  ))}
                </div>
            </ExpandableCard>
          </div>

          {/* Bottom Card: Visibility by brand table */}
          <ExpandableCard
            title="Visibility by brand"
            icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
            exportFilename="brand-visibility-by-brand"
            csvData={filteredBrands.map((b) => ({ Rank: b.rank, Brand: b.name, Latest: b.visibility, Highest: b.highestVis, Lowest: b.lowestVis, Average: b.avgVis }))}
            headerAction={
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pl-8 rounded-xl border-slate-200 bg-slate-50/50"
                />
              </div>
            }
            contentClassName="p-0"
          >
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-3 px-5 text-left w-12">#</th>
                    <th className="py-3 px-5 text-left">Brand</th>
                    <th className="py-3 px-5 text-center">Latest visibility score</th>
                    <th className="py-3 px-5 text-center">Highest visibility score</th>
                    <th className="py-3 px-5 text-center">Lowest visibility score</th>
                    <th className="py-3 px-5 text-right">Avg. visibility score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBrands.map((b) => (
                    <tr key={b.name} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5 font-mono text-slate-400">{b.rank}</td>
                      <td className="py-3.5 px-5 flex items-center gap-2.5">
                        <BrandAvatar name={b.name} domain={b.domain} color={b.color} />
                        <span className="font-semibold text-slate-900">{b.name}</span>
                        {b.isYourBrand && (
                          <Badge variant="outline" className="text-[10px] font-mono border-sky-200 bg-sky-50 text-sky-700 py-0 px-1.5">
                            Your brand
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-900">
                        {b.visibility}%
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-emerald-600 font-semibold">
                        {b.highestVis}%
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-slate-500">
                        {b.lowestVis}%
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-sky-700">
                        {b.avgVis}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </ExpandableCard>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. SENTIMENT VIEW (Image 1)                                  */}
      {/* ============================================================ */}
      {activeMetric === 'sentiment' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 gap-6">
            {/* Sentiment Over Time Chart */}
            <ExpandableCard
              title="Sentiment over time"
              icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
              exportFilename="brand-sentiment-over-time"
              className="w-full"
              modalContentClassName="h-[420px]"
            >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis
                        domain={[0.5, 1.0]}
                        ticks={[0.5, 0.75, 1.0]}
                        tickFormatter={(v) => (v === 1.0 ? 'Positive' : v === 0.75 ? 'Neutral' : 'Negative')}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }} />
                      {brandList.slice(0, 5).map((b) => (
                        <Line
                          key={b.name}
                          type="monotone"
                          dataKey={`${b.name}_sentiment`}
                          name={b.name}
                          stroke={b.color}
                          strokeWidth={b.isYourBrand ? 2.5 : 1.5}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 flex-wrap pt-2 border-t border-slate-100">
                  {brandList.slice(0, 5).map((b) => (
                    <div key={b.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className={b.isYourBrand ? 'font-bold text-slate-900' : ''}>{b.name}</span>
                    </div>
                  ))}
                </div>
            </ExpandableCard>
          </div>

          {/* Bottom Card: Sentiment by brand table */}
          <ExpandableCard
            title="Sentiment by brand"
            icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
            exportFilename="brand-sentiment-by-brand"
            csvData={filteredBrands.map((b) => ({ Rank: b.rank, Brand: b.name, Score: b.sentimentScore, Positive: b.posMentions, Neutral: b.neuMentions, Negative: b.negMentions }))}
            headerAction={
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pl-8 rounded-xl border-slate-200 bg-slate-50/50"
                />
              </div>
            }
            contentClassName="p-0"
          >
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-3 px-5 text-left w-12">#</th>
                    <th className="py-3 px-5 text-left">Brand</th>
                    <th className="py-3 px-5 text-center">Sentiment score</th>
                    <th className="py-3 px-5 text-center">Positive mentions</th>
                    <th className="py-3 px-5 text-center">Neutral mentions</th>
                    <th className="py-3 px-5 text-center">Negative mentions</th>
                    <th className="py-3 px-5 text-right">Total mentions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBrands.map((b) => (
                    <tr key={b.name} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5 font-mono text-slate-400">{b.rank}</td>
                      <td className="py-3.5 px-5 flex items-center gap-2.5">
                        <BrandAvatar name={b.name} domain={b.domain} color={b.color} />
                        <span className="font-semibold text-slate-900">{b.name}</span>
                        {b.isYourBrand && (
                          <Badge variant="outline" className="text-[10px] font-mono border-sky-200 bg-sky-50 text-sky-700 py-0 px-1.5">
                            Your brand
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-900">
                        {b.sentimentScore.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-emerald-600 font-semibold">
                        {b.posMentions.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-slate-500">
                        {b.neuMentions.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-rose-600">
                        {b.negMentions.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                        {b.mentions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </ExpandableCard>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. OVERVIEW VIEW (Combined Dashboard)                        */}
      {/* ============================================================ */}
      {activeMetric === 'overview' && dashboardData && (
        <DashboardClientView
          initialSummaryMetrics={dashboardData.summaryMetrics}
          fullSovTrendData={dashboardData.fullSovTrendData}
          initialEngineScores={dashboardData.engineComparisonData}
          initialCitationDomains={dashboardData.citationDomains}
          initialSentimentSlices={dashboardData.sentimentSlices}
          initialRuns={dashboardData.runs}
          competitors={dashboardData.competitors}
          brandName={dashboardData.brandName}
        />
      )}
      {activeMetric === 'overview' && !dashboardData && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 4 Summary Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              onClick={() => router.push('/brand-insights?metric=visibility')}
              className="rounded-2xl border-slate-200 p-5 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Visibility Score</span>
                <span className="text-xs text-sky-600 font-semibold group-hover:underline">View &rarr;</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">76%</span>
                <span className="text-xs text-emerald-600 font-bold">+1%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Leading in generative answer inclusion</p>
            </Card>

            <Card
              onClick={() => router.push('/brand-insights?metric=sov')}
              className="rounded-2xl border-slate-200 p-5 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Share of Voice</span>
                <span className="text-xs text-sky-600 font-semibold group-hover:underline">View &rarr;</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">17.1%</span>
                <span className="text-xs text-emerald-600 font-bold">+0.1%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">#1 generative share among rivals</p>
            </Card>

            <Card
              onClick={() => router.push('/brand-insights?metric=position')}
              className="rounded-2xl border-slate-200 p-5 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Average Position</span>
                <span className="text-xs text-sky-600 font-semibold group-hover:underline">View &rarr;</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">#3.7</span>
                <span className="text-xs text-emerald-600 font-bold">+0.2</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Consistently featured in top 4 recommendations</p>
            </Card>

            <Card
              onClick={() => router.push('/brand-insights?metric=sentiment')}
              className="rounded-2xl border-slate-200 p-5 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Sentiment Score</span>
                <span className="text-xs text-sky-600 font-semibold group-hover:underline">View &rarr;</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">0.93</span>
                <span className="text-xs text-emerald-600 font-bold">Positive</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">18,353 positive citations recorded</p>
            </Card>
          </div>

          {/* Competitive Summary Table */}
          <ExpandableCard
            title="Competitive Landscape Benchmark"
            description="Live snapshot across all 5 Generative Engine Optimization dimensions"
            exportFilename="competitive-landscape-benchmark"
            csvData={brandList.map((b) => ({ Rank: b.rank, Brand: b.name, Visibility: b.visibility, SOV: b.sov, Position: b.position, Sentiment: b.sentimentScore, Mentions: b.mentions }))}
            contentClassName="p-0"
          >
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-3 px-5 text-left w-12">#</th>
                    <th className="py-3 px-5 text-left">Brand</th>
                    <th className="py-3 px-5 text-center">Visibility</th>
                    <th className="py-3 px-5 text-center">Share of Voice</th>
                    <th className="py-3 px-5 text-center">Avg Position</th>
                    <th className="py-3 px-5 text-center">Sentiment</th>
                    <th className="py-3 px-5 text-right">Total Mentions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brandList.map((b) => (
                    <tr key={b.name} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5 font-mono text-slate-400">{b.rank}</td>
                      <td className="py-3.5 px-5 flex items-center gap-2.5">
                        <BrandAvatar name={b.name} domain={b.domain} color={b.color} />
                        <span className="font-semibold text-slate-900">{b.name}</span>
                        {b.isYourBrand && (
                          <Badge variant="outline" className="text-[10px] font-mono border-sky-200 bg-sky-50 text-sky-700 py-0 px-1.5">
                            Your brand
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-900">
                        {b.visibility}%
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-sky-700 font-semibold">
                        {b.sov.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-slate-800">
                        #{b.position.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-emerald-600 font-bold">
                        {b.sentimentScore.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                        {b.mentions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </ExpandableCard>
        </div>
      )}
    </div>
  );
}
