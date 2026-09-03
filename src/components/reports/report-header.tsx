'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Printer,
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  Smile,
  Globe,
} from 'lucide-react';
import type { ExecutiveReportData } from '@/lib/schemas/executive-report';

interface ReportHeaderProps {
  brandName: string;
  domain: string;
  dateRange: '7d' | '30d' | 'all';
  onDateRangeChange: (range: '7d' | '30d' | 'all') => void;
  onGenerateFresh: () => void;
  isGenerating: boolean;
  generatedAt?: string;
  periodDelta: ExecutiveReportData['periodDelta'];
  bestEngineSov: number;
}

export function ReportHeader({
  brandName,
  domain,
  dateRange,
  onDateRangeChange,
  onGenerateFresh,
  isGenerating,
  generatedAt,
  periodDelta,
  bestEngineSov,
}: ReportHeaderProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isSovPositive = periodDelta.sovChange >= 0;
  const isSentimentPositive = periodDelta.sentimentChange >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Strategic Executive Deliverable
            </span>
            <span className="text-zinc-300">&bull;</span>
            <span className="text-xs font-mono text-emerald-600 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Multi-Model Intelligence Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
            Comprehensive AI Audit & GEO Strategy Report
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600">
            Account-wide generative search prominence and model analysis for{' '}
            <span className="font-semibold text-zinc-900">{brandName}</span> ({domain}).
          </p>

          {generatedAt && (
            <p className="text-[11px] font-mono text-zinc-400 pt-0.5">
              Audited: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Controls (Hidden during print) */}
        <div className="flex flex-wrap items-center gap-2.5 no-print self-start md:self-auto">
          {/* Date Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200 shadow-2xs">
            {(
              [
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={isGenerating}
                onClick={() => onDateRangeChange(item.id)}
                className={`text-xs px-2.5 py-1.5 rounded-md font-mono transition-colors cursor-pointer ${
                  dateRange === item.id
                    ? 'bg-zinc-900 text-white font-medium shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            onClick={onGenerateFresh}
            disabled={isGenerating}
            className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs shadow-xs font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Generate Fresh Audit
              </>
            )}
          </Button>

          {/* Print Button */}
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isGenerating}
            className="border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs shadow-2xs font-medium"
          >
            <Printer className="h-3.5 w-3.5 mr-2 text-zinc-500" />
            Print to PDF / Export
          </Button>
        </div>
      </div>

      {/* TOP-LEVEL METRIC CARDS WITH PERIOD-OVER-PERIOD DELTAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Share of Voice with Delta */}
        <Card className="border-zinc-200 bg-white shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Average Generative SOV</span>
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-semibold tracking-tight text-zinc-950 font-mono">
                {bestEngineSov}%
              </span>
              <Badge
                variant={isSovPositive ? 'success' : 'destructive'}
                className="font-mono text-xs gap-1 px-2 py-0.5"
              >
                {isSovPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isSovPositive ? `+${periodDelta.sovChange}%` : `${periodDelta.sovChange}%`} vs prior
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500">
              Blended cross-engine conversational visibility and recommendation presence
            </p>
          </CardContent>
        </Card>

        {/* 2. Sentiment Shift with Delta */}
        <Card className="border-zinc-200 bg-white shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Sentiment Polarity Index</span>
              <Smile className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-semibold tracking-tight text-zinc-950 font-mono">
                Positive
              </span>
              <Badge
                variant={isSentimentPositive ? 'success' : 'outline'}
                className={`font-mono text-xs gap-1 px-2 py-0.5 ${
                  !isSentimentPositive ? 'border-amber-200 bg-amber-50 text-amber-800' : ''
                }`}
              >
                {isSentimentPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isSentimentPositive ? `+${periodDelta.sentimentChange}%` : `${periodDelta.sentimentChange}%`} shift
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500">
              Evaluated brand reputation and phrasing polarity in answer generation
            </p>
          </CardContent>
        </Card>

        {/* 3. Competitive Posture */}
        <Card className="border-zinc-200 bg-white shadow-xs sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Market Category Footprint</span>
              <Globe className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-semibold tracking-tight text-zinc-950 font-mono">
                Competitive
              </span>
              <Badge
                variant="outline"
                className="font-mono text-xs border-emerald-200 bg-emerald-50 text-emerald-800 px-2 py-0.5"
              >
                Top-Tier Grounding
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500">
              Consistent citation presence across verified industry publication hubs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
