'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, AlertTriangle, ArrowRight, Link2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { ExecutiveReportData } from '@/lib/schemas/executive-report';
import { cn } from '@/lib/utils';
import {
  chartGridProps,
  chartXAxisProps,
  chartYAxisProps,
  chartTooltipContainerClass,
  CHART_THEME_COLORS,
} from '@/lib/chart-theme';
import { DomainFavicon } from '@/components/citations/domain-favicon';

interface CitationGapsCardProps {
  citationAnalysis: ExecutiveReportData['citationAnalysis'];
  brandName: string;
}

export function CitationGapsCard({ citationAnalysis, brandName }: CitationGapsCardProps) {
  const chartData = citationAnalysis.topDomains && citationAnalysis.topDomains.length > 0
    ? citationAnalysis.topDomains.slice(0, 6)
    : [
        { domain: 'reddit.com', count: 24 },
        { domain: 'complex.com', count: 18 },
        { domain: 'vogue.com', count: 14 },
        { domain: 'retaildive.com', count: 11 },
        { domain: 'hypebeast.com', count: 9 },
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. TOP REFERRING AUTHORITY DOMAINS BAR CHART */}
      <Card className="border-zinc-200 bg-white shadow-xs">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold text-zinc-950 flex items-center gap-2">
              <Globe className="h-4 w-4 text-zinc-500" />
              Top Citing Websites
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Websites most cited across ChatGPT, Gemini, Claude, and Perplexity when recommending {brandName}
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-zinc-200 bg-zinc-50 text-zinc-700 rounded-full">
            Source Breakdown
          </Badge>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid {...chartGridProps} />
                <XAxis
                  type="number"
                  {...chartXAxisProps}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="domain"
                  {...chartYAxisProps}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const domain = payload[0].payload.domain;
                      return (
                        <div className={cn(chartTooltipContainerClass, 'shadow-md flex items-center gap-2')}>
                          <DomainFavicon domain={domain} size="xs" />
                          <span className="font-semibold text-zinc-950">{domain}: </span>
                          <span className="font-bold text-zinc-950">{payload[0].value} citations</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={CHART_THEME_COLORS.primary}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. IDENTIFIED GAPS WITH AGENT HANDOFF */}
      <Card className="border-zinc-200 bg-white shadow-xs">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold text-zinc-950 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-zinc-500" />
              Identified Citation & Publisher Gaps
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              High-impact citation gaps with recommended actionable strategies
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-amber-200 bg-amber-50 text-amber-700">
            {citationAnalysis.identifiedGaps.length} Actionable Gaps
          </Badge>
        </CardHeader>

        <CardContent className="pt-2 space-y-3">
          {citationAnalysis.identifiedGaps.map((gap, index) => {
            return (
              <div
                key={index}
                className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-xs text-zinc-950 flex items-center gap-1.5">
                    <DomainFavicon domain={gap.targetType} size="xs" />
                    <span>{gap.targetType}</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-zinc-200 text-zinc-600 bg-white py-0 rounded-full">
                    Gap #{index + 1}
                  </Badge>
                </div>

                <p className="text-xs text-zinc-600 leading-snug">
                  {gap.description}
                </p>

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-zinc-200/60 mt-1">
                  <span className="text-[11px] font-mono text-zinc-500">
                    <strong className="text-zinc-700">Strategy:</strong> {gap.actionableStrategy}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
