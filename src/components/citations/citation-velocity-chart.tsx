'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  chartGridProps,
  chartXAxisProps,
  chartYAxisProps,
  chartTooltipContainerClass,
  CHART_THEME_COLORS,
} from '@/lib/chart-theme';

import { ChartExpandButton, ExpandableChartModal } from '@/components/charts/expandable-chart-modal';

export interface CitationVelocityDataPoint {
  period: string; // e.g. "Week 1", "Week 2", or "Aug 10", etc.
  newCitations: number;
  newsCitations: number;
  forumCitations: number;
}

interface CitationVelocityChartProps {
  data: CitationVelocityDataPoint[];
}

function CustomVelocityTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className={cn(chartTooltipContainerClass, 'shadow-xl')}>
        <p className="text-zinc-500 font-semibold mb-1.5">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-900 flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              New Citations:
            </span>
            <span className="font-bold text-zinc-950">{payload[0]?.value}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function CitationVelocityChart({ data }: CitationVelocityChartProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col justify-between shadow-2xs border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 font-sans tracking-tight">
                Citation Velocity
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200 font-sans">
                Weekly Citations
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs text-slate-500 font-sans">
            Volume of net-new citations detected over weekly audit intervals
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[240px] flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs font-sans">
          <BarChart3 className="h-8 w-8 mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700">No velocity data yet</p>
          <p className="text-slate-400 mt-1 max-w-xs">Run scheduled prompt audits over time to monitor citation acceleration and indexing momentum.</p>
        </CardContent>
      </Card>
    );
  }

  const totalInPeriod = data.reduce((acc, curr) => acc + curr.newCitations, 0);

  const renderVelocityBars = (heightClass = 'h-[240px]') => (
    <div className={cn(heightClass, 'w-full')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="period" {...chartXAxisProps} />
          <YAxis
            {...chartYAxisProps}
            allowDecimals={false}
          />
          <Tooltip content={<CustomVelocityTooltip />} />
          <Bar
            dataKey="newCitations"
            name="New Citations"
            fill={CHART_THEME_COLORS.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={heightClass.includes('240') ? 36 : 48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const badgeElement = (
    <Badge variant="outline" className="font-sans text-xs border-emerald-200 bg-emerald-50 text-emerald-700 rounded-full">
      <TrendingUp className="h-3 w-3 mr-1" /> +{totalInPeriod} Citations Logged
    </Badge>
  );

  return (
    <>
      <Card className="border-zinc-200 bg-white shadow-xs">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-zinc-500" />
              Citation Discovery Velocity
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Pace of newly indexed backlink citations identified across audit scans
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {badgeElement}
            <ChartExpandButton onClick={() => setIsModalOpen(true)} />
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {renderVelocityBars('h-[240px]')}
        </CardContent>
      </Card>

      <ExpandableChartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Citation Discovery Velocity"
        description="Pace of newly indexed backlink citations identified across audit scans."
        exportFilename="citation-discovery-velocity"
        csvData={data}
        badge={badgeElement}
      >
        <div className="w-full h-full flex flex-col justify-center">
          {renderVelocityBars('h-[380px] sm:h-[420px]')}
        </div>
      </ExpandableChartModal>
    </>
  );
}
