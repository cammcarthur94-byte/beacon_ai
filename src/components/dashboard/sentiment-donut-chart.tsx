'use client';

import * as React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { HeartHandshake } from 'lucide-react';
import {
  chartTooltipContainerClass,
  CHART_THEME_COLORS,
} from '@/lib/chart-theme';

export interface SentimentSliceData {
  name: string;
  category: 'positive' | 'neutral' | 'negative';
  value: number;
  color: string;
}

interface SentimentDonutChartProps {
  data: SentimentSliceData[];
  selectedCategory?: 'all' | 'positive' | 'neutral' | 'negative';
  onSelectCategory: (cat: 'all' | 'positive' | 'neutral' | 'negative') => void;
  netScore?: number;
  brandName?: string;
}

interface TooltipPayloadItem {
  payload: SentimentSliceData;
}

function CustomDonutTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const label =
      item.category === 'positive'
        ? 'Positive'
        : item.category === 'neutral'
        ? 'Neutral'
        : 'Critical';
    return (
      <div className={cn(chartTooltipContainerClass, 'max-w-xs shadow-xl')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="font-semibold text-zinc-900">{label} Tone</span>
        </div>
        <p className="text-zinc-600 font-medium">{item.value}% of AI responses</p>
        <p className="text-[10px] text-zinc-400 font-mono mt-1 pt-1 border-t border-zinc-100 flex items-center gap-1">
          Click slice to filter searches
        </p>
      </div>
    );
  }
  return null;
}

export function SentimentDonutChart(props: SentimentDonutChartProps) {
  const {
    data,
    selectedCategory = 'all',
    onSelectCategory,
    netScore = 87,
  } = props;
  // Reference image color palette:
  // Green (#84C373) for Positive, Sky Blue (#4FA3E3) for Neutral, Warm Orange (#EE8A30) for Critical
  const normalizedData = React.useMemo(() => {
    return data.map((d) => {
      let color = d.color;
      if (d.category === 'positive') color = '#84C373'; // Reference Soft Green
      else if (d.category === 'neutral') color = '#4FA3E3'; // Reference Sky Blue
      else if (d.category === 'negative') color = '#EE8A30'; // Reference Warm Orange
      return { ...d, color };
    });
  }, [data]);

  const handleSliceClick = (entry: SentimentSliceData) => {
    if (selectedCategory === entry.category) {
      onSelectCategory('all');
    } else {
      onSelectCategory(entry.category);
    }
  };

  return (
    <Card className="border-zinc-200 bg-white shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-emerald-600" />
              How AI Speaks About Your Brand
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Score <span className="font-mono font-semibold text-emerald-600">+{netScore}</span> • Overall tone across AI recommendations
            </CardDescription>
          </div>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="text-xs font-mono text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 flex-1 flex items-center">
        {/* SIDE-BY-SIDE LAYOUT: Donut Chart on Left, Vertical Square Legend on Right (Matching Reference) */}
        <div className="grid grid-cols-12 gap-4 items-center w-full">
          {/* Donut Chart (Chunky Ring with White Borders) */}
          <div className="col-span-12 sm:col-span-7 h-[220px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomDonutTooltip />} />
                <Pie
                  data={normalizedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={1.5}
                  dataKey="value"
                  cursor="pointer"
                  onClick={(_, index) => handleSliceClick(normalizedData[index])}
                >
                  {normalizedData.map((entry) => {
                    const isSelected = selectedCategory === entry.category;
                    const isAnySelected = selectedCategory !== 'all';
                    const opacity = isAnySelected ? (isSelected ? 1 : 0.28) : 1;
                    return (
                      <Cell
                        key={entry.category}
                        fill={entry.color}
                        opacity={opacity}
                        stroke="#ffffff"
                        strokeWidth={2.5}
                        className="transition-all duration-200 hover:opacity-95"
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Reference Image Style Right-Side Legend with Solid Square Swatches */}
          <div className="col-span-12 sm:col-span-5 flex flex-col justify-center space-y-3.5 pl-2 sm:pl-4 border-t sm:border-t-0 sm:border-l border-zinc-100 pt-3 sm:pt-0">
            {normalizedData.map((item) => {
              const isSelected = selectedCategory === item.category;
              const isAnySelected = selectedCategory !== 'all';
              const label =
                item.category === 'positive'
                  ? 'Positive'
                  : item.category === 'neutral'
                  ? 'Neutral'
                  : 'Critical';

              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => handleSliceClick(item)}
                  className={cn(
                    'flex items-center gap-3 transition-all cursor-pointer text-left focus:outline-hidden group',
                    isSelected
                      ? 'scale-[1.02]'
                      : isAnySelected
                      ? 'opacity-40 hover:opacity-80'
                      : 'opacity-100'
                  )}
                >
                  {/* Solid Square Swatch matching reference image */}
                  <span
                    className={cn(
                      'h-4 w-4 rounded-xs shrink-0 shadow-2xs transition-transform group-hover:scale-110',
                      isSelected ? 'ring-2 ring-zinc-900 ring-offset-2' : ''
                    )}
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex items-baseline justify-between gap-4 flex-1">
                    <span className={cn('text-xs font-medium', isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-700')}>
                      {label}
                    </span>
                    <span className="text-xs font-sans font-bold text-zinc-900">
                      {item.value}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
