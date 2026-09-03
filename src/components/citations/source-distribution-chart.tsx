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
import { Badge } from '@/components/ui/badge';
import { PieChart as PieIcon, X } from 'lucide-react';
import type { CitationSourceType } from '@/types/database.types';
import { getSourceTypeMeta } from '@/lib/citations/categorizer';
import { cn } from '@/lib/utils';
import { chartTooltipContainerClass } from '@/lib/chart-theme';
import { CitationSourceIcon } from './domain-favicon';

export interface SourceDistributionDataPoint {
  sourceType: CitationSourceType;
  count: number;
  percentage: number;
}

export interface SourceDistributionFilterOptions {
  /** Source types currently filtering the Citations page (empty = all). */
  activeSourceTypes?: CitationSourceType[];
  /** Toggles a source type in/out of the multi-selection set. */
  onToggleSourceType?: (sourceType: CitationSourceType) => void;
  /** Clears all active source filters. */
  onClearAll?: () => void;
}

export interface SourceDistributionChartProps {
  data?: SourceDistributionDataPoint[];
  totalCitations?: number;
  /** Options for source type filtering and multi-selection. */
  filterOptions?: SourceDistributionFilterOptions;
  /** Deprecated: use `filterOptions.activeSourceTypes` instead. */
  activeSourceTypes?: CitationSourceType[];
  /** Deprecated: use `filterOptions.onToggleSourceType` instead. */
  onToggleSourceType?: (sourceType: CitationSourceType) => void;
  /** Deprecated: use `filterOptions.onClearAll` instead. */
  onClearAll?: () => void;
}

interface DonutTooltipPayload {
  payload: SourceDistributionDataPoint;
}

function CustomDonutTooltip({
  active,
  payload,
  activeSourceTypes,
}: {
  active?: boolean;
  payload?: DonutTooltipPayload[];
  activeSourceTypes: CitationSourceType[];
}) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const meta = getSourceTypeMeta(item.sourceType);
    const isCurrentActive = activeSourceTypes.includes(item.sourceType);

    return (
      <div className={cn(chartTooltipContainerClass, 'shadow-xl')}>
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="h-4 w-4 rounded flex items-center justify-center text-white"
            style={{ backgroundColor: meta.color }}
          >
            <CitationSourceIcon sourceType={item.sourceType} className="h-2.5 w-2.5" />
          </div>
          <span className="font-semibold text-slate-900">{meta.label}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600 text-xs">
          <span>Total Citations:</span>
          <span className="font-bold text-slate-900 font-mono">
            {item.count} ({item.percentage}%)
          </span>
        </div>
        <p className="text-[10px] text-emerald-700 font-semibold mt-1.5 pt-1 border-t border-slate-100 flex items-center gap-1">
          <span>
            {isCurrentActive
              ? '👆 Click to remove from filter'
              : `👆 Click to add ${meta.label} to filter`}
          </span>
        </p>
      </div>
    );
  }
  return null;
}

export function SourceDistributionChart({
  data = [],
  totalCitations = 0,
  filterOptions,
  activeSourceTypes: flatActiveSourceTypes,
  onToggleSourceType: flatOnToggleSourceType,
  onClearAll: flatOnClearAll,
}: SourceDistributionChartProps) {
  const activeSourceTypes = filterOptions?.activeSourceTypes ?? flatActiveSourceTypes ?? [];
  const onToggleSourceType = filterOptions?.onToggleSourceType ?? flatOnToggleSourceType;
  const onClearAll = filterOptions?.onClearAll ?? flatOnClearAll;
  const safeActiveSourceTypes = activeSourceTypes;
  const isFiltered = safeActiveSourceTypes.length > 0;
  const singleActiveMeta =
    safeActiveSourceTypes.length === 1 ? getSourceTypeMeta(safeActiveSourceTypes[0]) : null;

  const handleSliceClick = (entryOrIndex: unknown, secondArg?: unknown) => {
    const entry =
      typeof entryOrIndex === 'object' && entryOrIndex !== null
        ? (entryOrIndex as { sourceType?: CitationSourceType; payload?: { sourceType?: CitationSourceType }; name?: CitationSourceType })
        : undefined;

    const resolvedType: CitationSourceType | undefined =
      entry?.sourceType ||
      entry?.payload?.sourceType ||
      entry?.name ||
      (typeof secondArg === 'number' ? data[secondArg]?.sourceType : undefined) ||
      (typeof entryOrIndex === 'number' ? data[entryOrIndex]?.sourceType : undefined);

    if (resolvedType) {
      onToggleSourceType?.(resolvedType);
    }
  };

  const selectedData = data.filter((d) => safeActiveSourceTypes.includes(d.sourceType));
  const activeCategoryCount = isFiltered
    ? selectedData.reduce((acc, curr) => acc + curr.count, 0)
    : totalCitations;
  const activePercentage = isFiltered
    ? Math.round(selectedData.reduce((acc, curr) => acc + curr.percentage, 0))
    : 100;

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-slate-500" />
            Source Type Distribution
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Categorization breakdown of citations grounding LLM responses
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-sans text-xs border-slate-200 bg-slate-50 text-slate-700 rounded-full">
            AEO Grounding Mix
          </Badge>
          {isFiltered && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-900 text-white font-medium px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
              {singleActiveMeta && (
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: singleActiveMeta.color }}
                />
              )}
              <span className="max-w-[150px] truncate">
                {singleActiveMeta
                  ? singleActiveMeta.label
                  : `${activeSourceTypes.length} Categories`}
              </span>
              <button
                type="button"
                onClick={onClearAll}
                className="text-slate-300 hover:text-white cursor-pointer transition-colors ml-0.5"
                aria-label="Clear all source type filters"
                title="Clear all filters"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* DONUT CHART */}
          <div className="h-[240px] w-full md:w-1/2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomDonutTooltip activeSourceTypes={activeSourceTypes} />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="sourceType"
                  innerRadius={65}
                  outerRadius={92}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={2}
                  cursor="pointer"
                  onClick={(entry, index) => handleSliceClick(entry, index)}
                >
                  {data.map((entry) => {
                    const meta = getSourceTypeMeta(entry.sourceType);
                    const isSelected = activeSourceTypes.includes(entry.sourceType);
                    return (
                      <Cell
                        key={entry.sourceType}
                        fill={meta.color}
                        opacity={isFiltered ? (isSelected ? 1 : 0.25) : 1}
                        stroke={isSelected ? '#0f172a' : '#ffffff'}
                        strokeWidth={isSelected ? 3.5 : 2}
                        className="cursor-pointer transition-all duration-200 outline-hidden hover:opacity-100"
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e?.stopPropagation?.();
                          onToggleSourceType?.(entry.sourceType);
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Central Donut Total Overlay */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center px-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {activeCategoryCount}
              </span>
              <span
                className={cn(
                  'text-[10px] font-sans uppercase tracking-wider max-w-[130px] truncate',
                  isFiltered ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'
                )}
                style={singleActiveMeta ? { color: singleActiveMeta.color } : undefined}
              >
                {isFiltered
                  ? singleActiveMeta
                    ? singleActiveMeta.label
                    : `${activeSourceTypes.length} Selected (${activePercentage}%)`
                  : 'Citations'}
              </span>
            </div>
          </div>

          {/* LEGEND & BREAKDOWN (clickable rows for multi-select) */}
          <div className="w-full md:w-1/2 space-y-1.5">
            {data.map((item) => {
              const meta = getSourceTypeMeta(item.sourceType);
              const isSelected = activeSourceTypes.includes(item.sourceType);
              return (
                <button
                  key={item.sourceType}
                  type="button"
                  onClick={() => onToggleSourceType?.(item.sourceType)}
                  title={`${isSelected ? 'Remove' : 'Add'} ${meta.label} ${isSelected ? 'from' : 'to'} filter`}
                  style={isSelected ? { borderWidth: 2, borderColor: meta.color } : undefined}
                  className={cn(
                    'flex w-full items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-all duration-150 cursor-pointer text-left',
                    isSelected
                      ? 'bg-slate-50 font-bold shadow-xs'
                      : 'hover:bg-slate-50 border-2 border-transparent hover:border-slate-200',
                    isFiltered && !isSelected && 'opacity-40'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-4 w-4 rounded flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: meta.color }}
                    >
                      <CitationSourceIcon sourceType={item.sourceType} className="h-2.5 w-2.5" />
                    </div>
                    <span className={cn('font-medium text-slate-800 truncate', isSelected && 'font-bold text-slate-950')}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-sans">
                    <span className="font-semibold text-slate-900 w-10 text-right text-xs">
                      {item.percentage}%
                    </span>
                    {isSelected ? (
                      <X className="h-3.5 w-3.5 text-slate-600 ml-0.5" />
                    ) : (
                      <span className="w-4" />
                    )}
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