import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, Globe, Layers, TrendingUp, Sparkles, Award } from 'lucide-react';
import type { CitationSourceType } from '@/types/database.types';
import { getSourceTypeMeta } from '@/lib/citations/categorizer';
import { CitationSourceIcon } from './domain-favicon';
import { cn } from '@/lib/utils';

export interface CitationSummaryMetrics {
  totalCitations: number;
  citationsDelta: number; // e.g. +18%
  uniqueDomains: number;
  domainsDelta: number; // e.g. +4
  topSourceType: CitationSourceType;
  topSourcePercent: number; // e.g. 46
  averageProminence: number; // e.g. 84
}

interface CitationMetricsCardsProps {
  metrics: CitationSummaryMetrics;
  activeSourceTypes?: CitationSourceType[];
  onClearFilter?: () => void;
}

export function CitationMetricsCards({
  metrics,
  activeSourceTypes,
  onClearFilter,
}: CitationMetricsCardsProps) {
  const isFiltered = Boolean(activeSourceTypes && activeSourceTypes.length > 0);
  const activeCount = activeSourceTypes?.length ?? 0;
  const topMeta = getSourceTypeMeta(metrics.topSourceType);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. TOTAL CITATIONS */}
      <Card className={cn(
        "border-slate-200 bg-white shadow-xs group hover:border-slate-300 transition-colors",
        isFiltered && "border-emerald-300/80 ring-1 ring-emerald-400/20"
      )}>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{isFiltered ? 'Filtered Mentions' : 'Total Times Cited'}</span>
            <Quote className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {metrics.totalCitations}
            </span>
            {isFiltered ? (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold border-emerald-300 bg-emerald-50 text-emerald-800 gap-1 px-2 py-0.5"
              >
                {activeCount === 1 ? topMeta.label : `${activeCount} Categories`}
              </Badge>
            ) : (
              <Badge
                variant="success"
                className="text-[11px] font-medium gap-1 px-2 py-0.5"
              >
                <TrendingUp className="h-3 w-3" /> +{metrics.citationsDelta}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. UNIQUE REFERRING DOMAINS */}
      <Card className={cn(
        "border-slate-200 bg-white shadow-xs group hover:border-slate-300 transition-colors",
        isFiltered && "border-emerald-300/80 ring-1 ring-emerald-400/20"
      )}>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Websites Citing You</span>
            <Globe className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {metrics.uniqueDomains}
            </span>
            <Badge
              variant="outline"
              className="text-[11px] font-medium border-slate-200 bg-slate-50 text-slate-700 px-2 py-0.5"
            >
              {isFiltered
                ? `in ${activeCount === 1 ? topMeta.label : activeCount + ' Categories'}`
                : `+${metrics.domainsDelta} new this mo`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 3. TOP / ACTIVE SOURCE CATEGORY */}
      <Card className={cn(
        "border-slate-200 bg-white shadow-xs group hover:border-slate-300 transition-colors",
        isFiltered && "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30"
      )}>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              {isFiltered
                ? activeCount === 1
                  ? 'Active Category'
                  : 'Leading Active Category'
                : 'Top Source Type'}
            </span>
            <CitationSourceIcon
              sourceType={metrics.topSourceType}
              className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors"
            />
          </div>
          <div className="flex items-baseline justify-between pt-1 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xl font-bold tracking-tight text-slate-900 truncate">
                {topMeta.label}
              </span>
              {isFiltered && activeCount > 1 && (
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                  +{activeCount - 1} more
                </span>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border font-bold shrink-0 ${topMeta.badgeClass}`}
            >
              <CitationSourceIcon sourceType={metrics.topSourceType} className="h-3 w-3" />
              <span>{metrics.topSourcePercent}%</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. AVERAGE PROMINENCE INDEX */}
      <Card className="border-slate-200 bg-white shadow-xs group hover:border-slate-300 transition-colors">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>AI Source Agreement</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {metrics.averageProminence}%
            </span>
            <Badge
              variant="outline"
              className="text-[11px] font-medium border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5"
            >
              {isFiltered ? 'Active Sources' : 'Strong Consensus'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
