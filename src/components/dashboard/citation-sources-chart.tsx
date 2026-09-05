'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link2, Globe } from 'lucide-react';
import {
  chartGridProps,
  chartXAxisProps,
  chartYAxisProps,
  chartTooltipContainerClass,
  CHART_THEME_COLORS,
} from '@/lib/chart-theme';

import { DomainFavicon } from '@/components/citations/domain-favicon';

export interface CitationDomainItem {
  domain: string;
  citations: number;
  percentage: number;
  isBrandDomain?: boolean;
}

interface CitationSourcesChartProps {
  data: CitationDomainItem[];
  selectedDomain?: string | null;
  onSelectDomain: (domain: string | null) => void;
  brandName: string;
}

function CustomCitationTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as CitationDomainItem;
    return (
      <div className={cn(chartTooltipContainerClass, 'max-w-xs shadow-xl')}>
        <div className="flex items-center gap-2 font-semibold text-zinc-950 mb-1">
          <DomainFavicon domain={item.domain} size="xs" />
          <span>{item.domain}</span>
          {item.isBrandDomain && (
            <span className="text-[10px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-mono font-semibold">
              Owned Domain
            </span>
          )}
        </div>
        <div className="space-y-0.5 text-zinc-600">
          <p>
            <span className="font-bold text-zinc-950">{item.citations}</span> cited references
          </p>
          <p className="text-zinc-500">{item.percentage}% of all answer citations</p>
        </div>
        <p className="text-[10px] text-zinc-900 font-semibold mt-1.5 pt-1 border-t border-zinc-100 flex items-center gap-1">
          👉 Click to filter searches referencing this website
        </p>
      </div>
    );
  }
  return null;
}

interface CustomYAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

function CustomDomainYAxisTick({ x = 0, y = 0, payload }: CustomYAxisTickProps) {
  if (!payload?.value) return null;
  const domain = payload.value;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Website Logo Favicon as shown in address bar */}
      <image
        href={faviconUrl}
        x={-140}
        y={-8}
        height={16}
        width={16}
        preserveAspectRatio="xMidYMid meet"
      />
      {/* Domain Text in Google Sans / Open Sans */}
      <text
        x={-118}
        y={4}
        fill="#374151"
        fontSize={12}
        fontFamily="'Google Sans', 'Open Sans', sans-serif"
        textAnchor="start"
      >
        {domain.length > 17 ? domain.slice(0, 15) + '...' : domain}
      </text>
    </g>
  );
}

export function CitationSourcesChart({
  data,
  selectedDomain,
  onSelectDomain,
  brandName,
}: CitationSourcesChartProps) {
  const handleBarClick = (entry: CitationDomainItem) => {
    if (selectedDomain === entry.domain) {
      onSelectDomain(null);
    } else {
      onSelectDomain(entry.domain);
    }
  };

  // Unified single color for all bars per user request
  const UNIFIED_BAR_COLOR = '#10b981';

  return (
    <Card className="border-zinc-200 bg-white shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-1.5 font-sans">
            <Link2 className="h-4 w-4 text-emerald-600" />
            Top Websites Citing Your Brand
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 font-sans">
            Top websites AI tools link to when recommending <span className="text-zinc-900 font-medium">{brandName}</span>
          </CardDescription>
        </div>
        {selectedDomain && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-sans bg-zinc-100 text-zinc-800 border border-zinc-200 px-2.5 py-0.5 rounded-full">
              <DomainFavicon domain={selectedDomain} size="xs" />
              <span>Filtered: {selectedDomain}</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectDomain(null)}
              className="text-xs font-sans text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-2 flex flex-col justify-between flex-1 pb-4">
        <div className="h-[255px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 45, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                vertical={true}
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 60]}
                ticks={[0, 15, 30, 45, 60]}
                {...chartXAxisProps}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                type="category"
                dataKey="domain"
                {...chartYAxisProps}
                width={145}
                tick={<CustomDomainYAxisTick />}
              />
              <Tooltip content={<CustomCitationTooltip />} />
              <Bar
                dataKey="citations"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(_, index) => handleBarClick(data[index])}
              >
                <LabelList
                  dataKey="citations"
                  position="right"
                  fill="#18181b"
                  fontSize={12}
                  fontWeight={600}
                  fontFamily="'Google Sans', 'Open Sans', sans-serif"
                  offset={8}
                />
                {data.map((entry) => {
                  const isSelected = selectedDomain === entry.domain;
                  const isAnySelected = Boolean(selectedDomain);
                  const opacity = isAnySelected ? (isSelected ? 1 : 0.35) : 1;

                  return (
                    <Cell
                      key={entry.domain}
                      fill={UNIFIED_BAR_COLOR}
                      opacity={opacity}
                      stroke={isSelected ? '#059669' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
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
