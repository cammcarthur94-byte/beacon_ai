'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Info } from 'lucide-react';
import { EngineIcon, getEngineMeta } from '@/components/ui/engine-badge';
import { ExpandableCard } from '@/components/charts/expandable-card';
import type { BrandKit } from '@/types/database.types';

export type AiModelMetric = 'overview';

export interface ModelMetricData {
  engine: string;
  name: string;
  provider: string;
  visibilityScore: number;
  mentionRate: number;
  avgPosition: number;
  positiveSentimentRate: number;
  sovRate: number;
  summaryQuote: string;
}

interface AiModelsClientProps {
  project: {
    id: string;
    name: string;
    domain: string;
    brand_kit?: BrandKit;
  };
  modelsData: ModelMetricData[];
}

export function AiModelsClient({ project, modelsData }: AiModelsClientProps) {
  const brandName = project.name || 'Your Brand';

  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return modelsData;
    const q = searchQuery.toLowerCase();
    return modelsData.filter((m) => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q));
  }, [modelsData, searchQuery]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-6 font-sans">
      {/* TOP HEADER */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">AI Model Insights Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Benchmark how ChatGPT, Claude, Perplexity, and Gemini evaluate and recommend {brandName}.
          </p>
        </div>
      </div>

      {/* All AI Models Scorecard Table */}
      <ExpandableCard
        title="AI Model Comparative Scorecard"
        icon={<Info className="h-3.5 w-3.5 text-slate-400" />}
        exportFilename="ai-model-comparative-scorecard"
        csvData={filteredModels.map((m, idx) => ({
          Rank: idx + 1,
          Engine: m.name,
          Provider: m.provider,
          Visibility: m.visibilityScore,
          MentionRate: m.mentionRate,
          SOV: m.sovRate,
          AvgRank: m.avgPosition,
          PositiveSentiment: m.positiveSentimentRate,
        }))}
        headerAction={
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 rounded-xl border-slate-200 bg-slate-50/50"
            />
          </div>
        }
        contentClassName="p-0"
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
              <th className="py-3 px-5 text-left w-12">#</th>
              <th className="py-3 px-5 text-left">AI Engine &amp; Provider</th>
              <th className="py-3 px-5 text-center">Visibility</th>
              <th className="py-3 px-5 text-center">Mention Rate</th>
              <th className="py-3 px-5 text-center">Share of Voice</th>
              <th className="py-3 px-5 text-center">Avg Rank</th>
              <th className="py-3 px-5 text-right">Positive Sentiment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredModels.map((m, idx) => {
              const meta = getEngineMeta(m.engine);
              return (
                <tr key={m.engine} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-5 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <EngineIcon engine={m.engine} size={18} className={meta.iconColor} />
                      <div>
                        <span className="font-semibold text-slate-900 block leading-tight">{meta.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{m.provider}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-900">{m.visibilityScore}%</td>
                  <td className="py-3.5 px-5 text-center font-mono text-slate-700">{m.mentionRate}%</td>
                  <td className="py-3.5 px-5 text-center font-mono font-semibold text-sky-700">{m.sovRate}%</td>
                  <td className="py-3.5 px-5 text-center font-mono font-bold text-emerald-700">
                    #{m.avgPosition.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-800 font-semibold">
                    {m.positiveSentimentRate}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ExpandableCard>
    </div>
  );
}
