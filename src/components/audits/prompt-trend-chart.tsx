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
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  chartGridProps,
  chartXAxisProps,
  chartYAxisProps,
} from '@/lib/chart-theme';

export interface PromptHistoricalDataPoint {
  date: string;
  chatgpt: number;
  gemini: number;
  claude: number;
  perplexity: number;
  google_ai_overview?: number;
  google_ai_mode?: number;
}

interface PromptTrendChartProps {
  data: PromptHistoricalDataPoint[];
  queryText: string;
}

interface EngineDefinition {
  id: 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'google_ai_overview' | 'google_ai_mode';
  name: string;
  shortName: string;
  color: string;
}

const ENGINES: EngineDefinition[] = [
  { id: 'chatgpt', name: 'ChatGPT', shortName: 'ChatGPT', color: '#10b981' },
  { id: 'perplexity', name: 'Perplexity', shortName: 'Perplexity', color: '#06b6d4' },
  { id: 'google_ai_overview', name: 'Google AI Overviews', shortName: 'AI Overviews', color: '#4285F4' },
  // { id: 'google_ai_mode', name: 'Google AI Mode', shortName: 'AI Mode', color: '#7c3aed' },
  { id: 'gemini', name: 'Google Gemini', shortName: 'Gemini', color: '#3b82f6' },
  { id: 'claude', name: 'Anthropic Claude', shortName: 'Claude', color: '#d97706' },
];

type FilterPreset = 'all' | 'google_ai' | 'chatgpt_claude' | 'perplexity';

interface PresetItem {
  id: FilterPreset;
  label: string;
  engines: EngineDefinition['id'][];
}

const PRESETS: PresetItem[] = [
  {
    id: 'all',
    label: 'All Engines',
    engines: ['chatgpt', 'perplexity', 'google_ai_overview', 'gemini', 'claude'],
  },
  {
    id: 'google_ai',
    label: 'Google AI (Overviews & Gemini)',
    engines: ['google_ai_overview', 'gemini'],
  },
  {
    id: 'chatgpt_claude',
    label: 'ChatGPT & Claude',
    engines: ['chatgpt', 'claude'],
  },
  {
    id: 'perplexity',
    label: 'Perplexity Only',
    engines: ['perplexity'],
  },
];

function CustomMultiLineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));
    const avgScore = Math.round(
      payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0) / payload.length
    );

    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md p-3.5 shadow-xl text-xs font-sans text-slate-900 min-w-[230px] space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-semibold text-slate-800 text-xs">{label} Search Data</span>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
            Avg: {avgScore}%
          </span>
        </div>
        <div className="space-y-1.5">
          {sortedPayload.map((item) => (
            <div key={item.dataKey || item.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-700 font-medium">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-slate-950">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function PromptTrendChart({ data, queryText }: PromptTrendChartProps) {
  const [activeEngineIds, setActiveEngineIds] = useState<EngineDefinition['id'][]>([
    'chatgpt',
    'perplexity',
    'google_ai_overview',
    // 'google_ai_mode',
    'gemini',
    'claude',
  ]);

  const currentPreset: FilterPreset | 'custom' = (() => {
    const all = PRESETS.find((p) => p.id === 'all')!;
    if (activeEngineIds.length === all.engines.length && all.engines.every((e) => activeEngineIds.includes(e))) {
      return 'all';
    }
    for (const p of PRESETS) {
      if (
        p.id !== 'all' &&
        activeEngineIds.length === p.engines.length &&
        p.engines.every((e) => activeEngineIds.includes(e))
      ) {
        return p.id;
      }
    }
    return 'custom';
  })();

  const handleSelectPreset = (presetId: FilterPreset) => {
    const target = PRESETS.find((p) => p.id === presetId);
    if (target) {
      setActiveEngineIds(target.engines);
    }
  };

  const handleToggleEngine = (engineId: EngineDefinition['id']) => {
    setActiveEngineIds((prev) => {
      if (prev.includes(engineId)) {
        if (prev.length === 1) return prev; // don't allow 0 lines
        return prev.filter((id) => id !== engineId);
      } else {
        return [...prev, engineId];
      }
    });
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-3 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              AI Visibility Over Time
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Historical recommendation score trends across AI tools for this search
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="self-start sm:self-auto font-mono text-xs border-slate-200 bg-slate-50 text-slate-700 rounded-full"
          >
            Multi-Tool Tracking
          </Badge>
        </div>

        {/* Engine Filter Controls Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" /> Filters:
            </span>
            {PRESETS.map((preset) => {
              const isActive = currentPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none',
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/90 hover:text-slate-900'
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Individual Engine Toggle Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {ENGINES.map((engine) => {
              const isVisible = activeEngineIds.includes(engine.id);
              return (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => handleToggleEngine(engine.id)}
                  title={`Toggle ${engine.name} line`}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer select-none border',
                    isVisible
                      ? 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                      : 'bg-slate-50 border-slate-200/60 text-slate-400 opacity-60 hover:opacity-100'
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full transition-opacity',
                      !isVisible && 'opacity-30'
                    )}
                    style={{ backgroundColor: engine.color }}
                  />
                  <span>{engine.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 20, left: -16, bottom: 0 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="date" {...chartXAxisProps} />
              <YAxis
                {...chartYAxisProps}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomMultiLineTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontFamily: "'Google Sans', sans-serif" }}
              />

              {ENGINES.map((engine) => {
                const isVisible = activeEngineIds.includes(engine.id);
                if (!isVisible) return null;

                return (
                  <Line
                    key={engine.id}
                    type="monotone"
                    dataKey={engine.id}
                    name={engine.name}
                    stroke={engine.color}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: engine.color, strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: engine.color, stroke: '#ffffff', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={300}
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
