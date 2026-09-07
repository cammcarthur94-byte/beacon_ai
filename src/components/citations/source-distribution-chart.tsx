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
import { ChartExpandButton, ExpandableChartModal } from '@/components/charts/expandable-chart-modal';

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
  const [isModalOpen, setIsModalOpen] = React.useState(false);
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

  if (!data || data.length === 0 || totalCitations === 0) {
    return (
      <Card className="flex flex-col justify-between shadow-2xs border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 font-sans tracking-tight">
                Source Type Breakdown
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200 font-sans">
                0 Citations
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs text-slate-500 font-sans">
            Distribution of answer references across news, forums, blogs, and documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[240px] flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs font-sans">
          <PieIcon className="h-8 w-8 mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700">No citations indexed yet</p>
          <p className="text-slate-400 mt-1 max-w-xs">Run audit prompts to discover which authority domain categories citation answers reference.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedData = data.filter((d) => safeActiveSourceTypes.includes(d.sourceType));
  const activeCategoryCount = isFiltered
    ? selectedData.reduce((acc, curr) => acc + curr.count, 0)
    : totalCitations;
  const activePercentage = isFiltered
    ? Math.round(selectedData.reduce((acc, curr) => acc + curr.percentage, 0))
    : 100;

  const renderContent = (isExpanded = false) => (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
      {/* DONUT CHART */}
      <div className={cn('w-full md:w-1/2 relative flex items-center justify-center', isExpanded ? 'h-[360px]' : 'h-[240px]')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomDonutTooltip activeSourceTypes={activeSourceTypes} />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="sourceType"
              innerRadius={isExpanded ? 90 : 65}
              outerRadius={isExpanded ? 135 : 92}
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
          <span className={cn('font-bold font-mono text-slate-900 tracking-tight', isExpanded ? 'text-3xl' : 'text-2xl')}>
            {activeCategoryCount}
          </span>
          <span
            className={cn(
              'font-sans uppercase tracking-wider max-w-[130px] truncate',
              isExpanded ? 'text-xs' : 'text-[10px]',
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
      <div className="w-full md:w-1/2 space-y-2">
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
                'flex w-full items-center justify-between text-xs py-2 px-3 rounded-lg transition-all duration-150 cursor-pointer text-left',
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
  );

  return (
    <>
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-slate-500" />
              Source Type Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Categorization breakdown of websites cited in AI answers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-sans text-xs border-slate-200 bg-slate-50 text-slate-700 rounded-full">
              Source Breakdown
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
            <ChartExpandButton onClick={() => setIsModalOpen(true)} />
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {renderContent(false)}
        </CardContent>
      </Card>

      <ExpandableChartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Source Type Distribution"
        description="Categorization breakdown of websites cited in AI answers."
        exportFilename="source-type-distribution"
        csvData={data.map((d) => ({
          SourceType: d.sourceType,
          Label: getSourceTypeMeta(d.sourceType).label,
          Count: d.count,
          Percentage: `${d.percentage}%`,
        }))}
      >
        <div className="w-full h-full flex flex-col justify-center">
          {renderContent(true)}
        </div>
      </ExpandableChartModal>
    </>
  );
}