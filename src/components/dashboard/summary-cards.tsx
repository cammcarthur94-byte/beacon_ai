import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EngineIcon, getEngineMeta } from "@/components/ui/engine-badge";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Smile,
  Quote,
  Award,
} from "lucide-react";

export interface DashboardSummaryMetrics {
  totalSov: number;
  sovDelta: number;
  sentimentScore: number;
  sentimentLabel: "Positive" | "Neutral" | "Negative";
  totalCitations: number;
  citationsDelta: number;
  topEngine: {
    name: string;
    score: number;
    winRate: number;
  };
}

export function SummaryCards({ metrics }: { metrics: DashboardSummaryMetrics }) {
  const isSovPositive = metrics.sovDelta >= 0;
  const isCitationsPositive = metrics.citationsDelta >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total AI Share of Voice */}
      <Card className="border-zinc-200 bg-white shadow-xs relative overflow-hidden group hover:border-zinc-300 transition-colors">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Recommendation Rate</span>
            <Sparkles className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-semibold tracking-tight text-zinc-950 font-mono">
              {metrics.totalSov.toFixed(1)}%
            </span>
            <Badge
              variant={isSovPositive ? "success" : "destructive"}
              className="text-[11px] font-mono gap-1 px-2 py-0.5"
            >
              {isSovPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isSovPositive ? `+${metrics.sovDelta}%` : `${metrics.sovDelta}%`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 2. Brand Sentiment */}
      <Card className="border-zinc-200 bg-white shadow-xs relative overflow-hidden group hover:border-zinc-300 transition-colors">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>AI Sentiment</span>
            <Smile className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-semibold tracking-tight text-zinc-950 font-mono">
              {metrics.sentimentScore}%
            </span>
            <Badge
              variant="success"
              className="text-[11px] font-mono px-2 py-0.5"
            >
              {metrics.sentimentLabel}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Citations Extracted */}
      <Card className="border-zinc-200 bg-white shadow-xs relative overflow-hidden group hover:border-zinc-300 transition-colors">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Websites Citing You</span>
            <Quote className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-semibold tracking-tight text-zinc-950 font-mono">
              {metrics.totalCitations}
            </span>
            <Badge
              variant={isCitationsPositive ? "success" : "secondary"}
              className="text-[11px] font-mono gap-1 px-2 py-0.5"
            >
              {isCitationsPositive ? `+${metrics.citationsDelta} this mo` : `${metrics.citationsDelta}`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 4. Top Performing Engine */}
      <Card className="border-zinc-200 bg-white shadow-xs relative overflow-hidden group hover:border-zinc-300 transition-colors">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Best AI Platform</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between pt-1 h-9">
            <div
              className="flex items-center"
              title={metrics.topEngine.name}
              aria-label={`Top performing engine: ${metrics.topEngine.name}`}
            >
              <div
                className={`flex items-center justify-center h-9 w-9 rounded-lg border shadow-2xs ${
                  getEngineMeta(metrics.topEngine.name).containerClass
                }`}
              >
                <EngineIcon
                  engine={metrics.topEngine.name}
                  size={20}
                />
              </div>
              <span className="sr-only">{metrics.topEngine.name}</span>
            </div>
            <Badge
              variant="outline"
              className="text-[11px] font-mono px-2 py-0.5 border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              {metrics.topEngine.winRate}% Recommended
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
