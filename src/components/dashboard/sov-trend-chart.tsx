'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  chartGridProps,
  chartXAxisProps,
  chartYAxisProps,
  chartTooltipContainerClass,
  CHART_THEME_COLORS,
} from '@/lib/chart-theme';

export interface MultiLineSovDataPoint {
  date: string;
  brand: number;
  shiftDriver?: string;
  [competitorKey: string]: any;
}

export interface CompetitorMeta {
  id: string;
  name: string;
  color: string;
}

interface SovTrendChartProps {
  data: MultiLineSovDataPoint[];
  brandName: string;
  competitors: CompetitorMeta[];
  visibleCompetitors?: string[];
  onToggleCompetitor?: (competitorId: string) => void;
  dateRangeLabel?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomMultiLineTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const rawPoint = payload[0]?.payload as MultiLineSovDataPoint;
    const shiftDriver = rawPoint?.shiftDriver;

    return (
      <div className={cn(chartTooltipContainerClass, 'max-w-xs shadow-xl')}>
        <p className="text-zinc-500 font-semibold mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((item: any) => (
            <div key={item.dataKey} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 capitalize text-zinc-800 font-medium">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-bold text-zinc-950">{item.value}%</span>
            </div>
          ))}
        </div>

        {shiftDriver && (
          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-start gap-1.5 text-[11px] text-zinc-600 font-sans leading-tight">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-900">Key Reason: </span>
              <span>{shiftDriver}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export function SovTrendChart({
  data,
  brandName,
  competitors,
  visibleCompetitors = [],
  onToggleCompetitor,
  dateRangeLabel = '30 Days',
}: SovTrendChartProps) {
  const [internalHidden, setInternalHidden] = useState<Record<string, boolean>>({});

  const isBrandHidden = Boolean(internalHidden['brand']);

  const toggleBrand = () => {
    setInternalHidden((prev) => ({ ...prev, brand: !prev.brand }));
  };

  const handleToggleCompetitor = (comp: CompetitorMeta) => {
    if (onToggleCompetitor) {
      onToggleCompetitor(comp.id);
    } else {
      setInternalHidden((prev) => ({ ...prev, [comp.id]: !prev[comp.id] }));
    }
  };

  const isCompVisible = (comp: CompetitorMeta) => {
    if (visibleCompetitors && visibleCompetitors.length > 0) {
      return visibleCompetitors.includes(comp.id);
    }
    return !internalHidden[comp.id];
  };

  const currentBrand = data[data.length - 1]?.brand || 0;
  const initialBrand = data[0]?.brand || 0;
  const growth = (currentBrand - initialBrand).toFixed(1);

  return (
    <Card className="border-zinc-200 bg-white shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            Recommendation Rate Over Time ({dateRangeLabel})
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            How often <span className="text-zinc-900 font-medium">{brandName}</span> is recommended compared to competitors
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-emerald-700 border-emerald-200 bg-emerald-50 self-start sm:self-auto">
          <TrendingUp className="h-3 w-3 mr-1" /> +{growth}% Growth
        </Badge>
      </CardHeader>

      <CardContent className="pt-2 flex flex-col justify-between flex-1">
        {/* Interactive Legend with click-to-toggle pills */}
        <div className="flex items-center gap-2 flex-wrap mb-3 text-xs font-mono">
          <span className="text-zinc-400 text-[11px] font-medium mr-1">Compare:</span>

          {/* Brand Toggle */}
          <button
            type="button"
            onClick={toggleBrand}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all duration-150 cursor-pointer',
              !isBrandHidden
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold'
                : 'bg-zinc-50 text-zinc-400 border-zinc-200 line-through opacity-60'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-white ring-1 ring-emerald-300" />
            <span>{brandName} (You)</span>
          </button>

          {/* Competitor Toggles */}
          {competitors.map((comp) => {
            const visible = isCompVisible(comp);
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => handleToggleCompetitor(comp)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all duration-150 cursor-pointer',
                  visible
                    ? 'bg-white text-zinc-800 border-zinc-300 font-medium shadow-2xs hover:bg-zinc-50'
                    : 'bg-zinc-50 text-zinc-400 border-zinc-200 line-through opacity-50'
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: comp.color || '#8b5cf6' }} />
                <span>{comp.name}</span>
              </button>
            );
          })}
        </div>

        {/* Multi-Line Trend Chart */}
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="date" {...chartXAxisProps} />
              <YAxis
                {...chartYAxisProps}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomMultiLineTooltip />} />

              {/* Primary Brand Line (Vivid Emerald) */}
              {!isBrandHidden && (
                <Line
                  type="monotone"
                  dataKey="brand"
                  name={brandName}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                  animationDuration={700}
                  animationEasing="ease-in-out"
                />
              )}

              {/* Dynamic Competitor Lines (Vibrant Non-Grey) */}
              {competitors.map((comp) => {
                if (!isCompVisible(comp)) return null;
                return (
                  <Line
                    key={comp.id}
                    type="monotone"
                    dataKey={comp.id}
                    name={comp.name}
                    stroke={comp.color || '#8b5cf6'}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={{ r: 2.5, fill: comp.color || '#8b5cf6' }}
                    activeDot={{ r: 4 }}
                    animationDuration={850}
                    animationEasing="ease-in-out"
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
