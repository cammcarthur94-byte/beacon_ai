'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, AlertTriangle, Cpu, Users } from 'lucide-react';
import { EngineFavicon } from '@/components/ui/engine-badge';
import type { ExecutiveReportData } from '@/lib/schemas/executive-report';

interface ModelComparisonCardProps {
  modelComparison: ExecutiveReportData['modelComparison'];
  competitorBenchmark: ExecutiveReportData['competitorBenchmark'];
  brandName: string;
}

export function ModelComparisonCard({
  modelComparison,
  competitorBenchmark,
  brandName,
}: ModelComparisonCardProps) {
  return (
    <div className="space-y-6">
      {/* 1. BEST VS LAGGING ENGINE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Best Engine */}
        <Card className="border-emerald-200 bg-emerald-50/25 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                Best Performing Engine
              </span>
              <Badge variant="outline" className="font-mono text-xs border-emerald-300 bg-emerald-100 text-emerald-800">
                {modelComparison.bestEngine.sov}% SOV
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold text-zinc-950 font-mono pt-1 flex items-center gap-2">
              <EngineFavicon engine={modelComparison.bestEngine.name} size={16} />
              <span>{modelComparison.bestEngine.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-zinc-600 leading-relaxed">
              {modelComparison.bestEngine.reason}
            </p>
          </CardContent>
        </Card>

        {/* Lagging Engine */}
        <Card className="border-amber-200 bg-amber-50/25 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Lagging Engine
              </span>
              <Badge variant="outline" className="font-mono text-xs border-amber-300 bg-amber-100 text-amber-800">
                {modelComparison.laggingEngine.sov}% SOV
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold text-zinc-950 font-mono pt-1 flex items-center gap-2">
              <EngineFavicon engine={modelComparison.laggingEngine.name} size={16} />
              <span>{modelComparison.laggingEngine.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-zinc-600 leading-relaxed">
              {modelComparison.laggingEngine.reason}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. DISCREPANCY ANALYSIS & COMPETITOR BENCHMARK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Discrepancy Explanation */}
        <Card className="border-zinc-200 bg-white shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-950 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-zinc-500" />
              Engine Retrieval Discrepancy Analysis
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Technical reasoning for why specific engines favor {brandName} while others show latency
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50/60 p-3.5 rounded-lg border border-zinc-200/80">
              {modelComparison.discrepancyAnalysis}
            </p>
          </CardContent>
        </Card>

        {/* Competitor Benchmark Progress Bars */}
        <Card className="border-zinc-200 bg-white shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-zinc-950 flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-500" />
                Competitor Share of Voice Benchmark
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Estimated mention prominence across tracked industry rivals
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs border-zinc-200 bg-zinc-50 text-zinc-700">
              Benchmark
            </Badge>
          </CardHeader>

          <CardContent className="pt-3 space-y-3">
            {/* Brand Itself */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-950 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#1a73e8]" />
                  {brandName} (Your Brand)
                </span>
                <span className="font-mono font-bold text-blue-600">
                  {modelComparison.bestEngine.sov}% SOV
                </span>
              </div>
              <Progress value={modelComparison.bestEngine.sov} className="h-2 bg-zinc-100" />
            </div>

            {/* Competitors */}
            {competitorBenchmark.map((comp, idx) => (
              <div key={idx} className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs text-zinc-700">
                  <span className="font-mono text-zinc-800">{comp.competitorName}</span>
                  <span className="font-mono text-zinc-600 font-semibold">{comp.estimatedSov}% SOV</span>
                </div>
                <Progress value={comp.estimatedSov} className="h-1.5 bg-zinc-100" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
