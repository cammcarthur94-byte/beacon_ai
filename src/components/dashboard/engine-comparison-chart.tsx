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
              Brand Visibility:
            </span>
            <span className="font-bold text-zinc-950">{item.brandScore}%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-600 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Competitor Benchmark:
            </span>
            <span className="text-zinc-700 font-medium">{item.competitorAvg}%</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-800 font-semibold mt-1.5 pt-1 border-t border-zinc-100 flex items-center gap-1">
          👉 Click to isolate {item.engine} across telemetry
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
}: EngineComparisonChartProps) {
  const isAnyFiltered = selectedEngines.length > 0 && selectedEngines.length < data.length;

  const handleBarClick = (entry: EngineVisibilityScore) => {
    onToggleEngine?.(entry.engineId);
  };

  return (
    <Card className="border-zinc-200 bg-white shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-emerald-600" />
            Engine Visibility Benchmark
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Comparing <span className="text-zinc-900 font-medium">{brandName}</span> mention prominence across answer engines
          </CardDescription>
        </div>
        {isAnyFiltered ? (
          <Badge variant="outline" className="font-mono text-xs border-zinc-200 text-zinc-700 bg-zinc-50 rounded-full">
            {selectedEngines.length} Filtered
          </Badge>
        ) : (
          <Badge variant="outline" className="font-mono text-xs border-zinc-200 text-zinc-600 bg-zinc-50 rounded-full">
            {data.length} Engines
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-2 flex flex-col justify-between flex-1">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="engine" {...chartXAxisProps} />
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
      </CardContent>
    </Card>
  );
}
