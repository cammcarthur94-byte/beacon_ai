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
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  chartGridProps,
  chartXAxisProps,
  chartYAxisProps,
  chartTooltipContainerClass,
  CHART_THEME_COLORS,
} from '@/lib/chart-theme';
import { ChartExpandButton, ExpandableChartModal } from '@/components/charts/expandable-chart-modal';

export interface EngineVisibilityScore {
  engine: string;
  engineId: string;
  brandScore: number;
  competitorAvg: number;
}

interface EngineComparisonChartProps {
  data: EngineVisibilityScore[];
  brandName: string;
  selectedEngines?: string[];
  onToggleEngine?: (engineId: string) => void;
  onResetEngines?: () => void;
}

interface TooltipPayloadItem {
  value: number;
  name: string;
  color?: string;
  payload?: EngineVisibilityScore;
}

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as EngineVisibilityScore;
    return (
      <div className={cn(chartTooltipContainerClass, 'max-w-xs shadow-xl')}>
        <p className="text-zinc-500 font-semibold mb-1.5">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-900 flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Your Brand:
            </span>
            <span className="font-bold text-zinc-950">{item.brandScore}%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-900 flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Competitor Avg:
            </span>
            <span className="font-bold text-zinc-950">{item.competitorAvg}%</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2 border-t border-zinc-100 pt-1.5 font-mono">
          👉 Click to filter searches for {item.engine}
        </p>
      </div>
    );
  }
  return null;
}

export function EngineComparisonChart({
  data,
  brandName,
  selectedEngines = [],
  onToggleEngine,
  onResetEngines,
}: EngineComparisonChartProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col justify-between shadow-2xs border-zinc-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-zinc-900">
              Engine Performance
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-zinc-50 text-zinc-600 border-zinc-200 font-sans">
              All Engines
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Visibility comparison across conversational AI engines
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex flex-col items-center justify-center text-center p-6 text-zinc-400 text-sm">
          <Cpu className="h-8 w-8 mb-2 text-zinc-300" />
          <p className="font-medium text-zinc-600">No engine audit results yet</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">Run audits across ChatGPT, Copilot, Gemini, and Claude to compare engine scores.</p>
        </CardContent>
      </Card>
    );
  }

  const isAnyFiltered = selectedEngines.length > 0 && selectedEngines.length < data.length;

  const handleBarClick = (entry: EngineVisibilityScore) => {
    onToggleEngine?.(entry.engineId);
  };

  const renderBars = (heightClass = 'h-[250px]') => (
    <div className={cn(heightClass, 'w-full')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis
            dataKey="engine"
            {...chartXAxisProps}
            interval={0}
            tick={({ x, y, payload }) => {
              const raw = String(payload?.value || '');
              const clean = raw
                .replace('Microsoft ', '')
                .replace('Google AI Overview', 'Google AI');
              return (
                <text
                  x={x}
                  y={Number(y) + 12}
                  textAnchor="middle"
                  fill="var(--chart-axis)"
                  fontSize={10.5}
                  fontFamily="'Google Sans', 'Open Sans', sans-serif"
                >
                  {clean}
                </text>
              );
            }}
          />
          <YAxis
            {...chartYAxisProps}
            domain={[0, 100]}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip content={<CustomBarTooltip />} />

          {/* Brand Bar (Emerald) */}
          <Bar
            dataKey="brandScore"
            name={`${brandName}`}
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(_, index) => handleBarClick(data[index])}
          >
            {data.map((entry) => {
              const isSelected = selectedEngines.length === 0 || selectedEngines.includes(entry.engineId);
              return (
                <Cell
                  key={`brand-${entry.engineId}`}
                  fill="#10b981"
                  opacity={isSelected ? 1 : 0.25}
                  className="transition-all duration-150"
                />
              );
            })}
          </Bar>

          {/* Competitor Benchmark Bar (Amber) */}
          <Bar
            dataKey="competitorAvg"
            name="Competitors"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(_, index) => handleBarClick(data[index])}
          >
            {data.map((entry) => {
              const isSelected = selectedEngines.length === 0 || selectedEngines.includes(entry.engineId);
              return (
                <Cell
                  key={`comp-${entry.engineId}`}
                  fill="#f59e0b"
                  opacity={isSelected ? 0.85 : 0.25}
                  className="transition-all duration-150"
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const badgeElement = isAnyFiltered ? (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className="font-sans text-xs border-zinc-200 text-zinc-700 bg-zinc-50 rounded-full">
        {selectedEngines.length} Filtered
      </Badge>
      {onResetEngines && (
        <button
          type="button"
          onClick={onResetEngines}
          className="text-xs font-sans text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
        >
          Reset Filter
        </button>
      )}
    </div>
  ) : (
    <Badge variant="outline" className="font-sans text-xs border-zinc-200 text-zinc-600 bg-zinc-50 rounded-full">
      {data.length} Platforms
    </Badge>
  );

  return (
    <>
      <Card className="border-zinc-200 bg-white shadow-xs flex flex-col justify-between">
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-emerald-600" />
              AI Platform Comparison
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Comparing how often <span className="text-zinc-900 font-medium">{brandName}</span> is recommended across AI tools
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {badgeElement}
            <ChartExpandButton onClick={() => setIsModalOpen(true)} />
          </div>
        </CardHeader>

        <CardContent className="pt-2 flex flex-col justify-between flex-1">
          {renderBars('h-[250px]')}
        </CardContent>
      </Card>

      <ExpandableChartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="AI Platform Comparison"
        description={`Comparing how often ${brandName} is recommended across AI search tools vs competitor average.`}
        exportFilename="ai-platform-comparison"
        csvData={data}
        badge={badgeElement}
      >
        <div className="w-full h-full flex flex-col justify-center">
          {renderBars('h-[380px] sm:h-[420px]')}
        </div>
      </ExpandableChartModal>
    </>
  );
}
