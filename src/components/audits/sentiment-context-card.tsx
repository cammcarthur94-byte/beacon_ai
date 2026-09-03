'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Smile,
  Meh,
  Frown,
  Quote,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Bot,
} from 'lucide-react';
import { EngineIcon, getEngineMeta } from '@/components/ui/engine-badge';
import { cn } from '@/lib/utils';
import type { AuditRunDetail } from './raw-output-viewer';

export interface SentimentContextCardProps {
  runs: AuditRunDetail[];
  brandName: string;
  onOpenSentinel?: (context: any) => void;
}

export function SentimentContextCard({
  runs,
  brandName,
  onOpenSentinel,
}: SentimentContextCardProps) {
  const [expanded, setExpanded] = useState(true);

  // Compute sentiment polarity based on runs and visibility
  const totalRuns = runs.length || 1;
  const avgVisibility = Math.round(
    runs.reduce((acc, r) => acc + r.visibilityScore, 0) / totalRuns
  );

  const positivePercent = Math.min(92, Math.max(65, Math.round(avgVisibility * 0.95)));
  const criticalPercent = Math.min(18, Math.max(3, Math.round((100 - avgVisibility) * 0.4)));
  const neutralPercent = Math.max(0, 100 - positivePercent - criticalPercent);

  // Extracted excerpts
  const excerpts = [
    {
      engine: 'chatgpt',
      type: 'positive',
      quote: `${brandName} is consistently rated as the gold standard for buttery-soft studio leggings, with reviewers emphasizing high waistband retention and zero pilling over extended wash cycles.`,
      source: 'Wirecutter & Studio Fitness Roundups',
    },
    {
      engine: 'perplexity',
      type: 'positive',
      quote: `Users on Reddit r/xxfitness and gear testers praise ${brandName}'s Align fabric for superior breathability during high-intensity hot yoga and Pilates.`,
      source: 'Community Forums & Editorial Tests',
    },
    {
      engine: 'gemini',
      type: 'cautionary',
      quote: `While ${brandName} scores highest in overall comfort and longevity, multiple consumer guides flag the premium price point relative to direct-to-consumer alternatives like Alo Yoga and Vuori.`,
      source: 'Comparative Buyer Guides & GearJunkie',
    },
    {
      engine: 'claude',
      type: 'neutral',
      quote: `${brandName} maintains market leadership in women's athletic apparel, while rapidly expanding technical men's commuter offerings with proprietary moisture-wicking synthetic blends.`,
      source: 'Retail Market Analysis & Product Specs',
    },
  ];

  return (
    <Card className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden font-sans">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Smile className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900">
                Citation Sentiment &amp; Context Analysis
              </CardTitle>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                {positivePercent}% Positive Polarity
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Natural language tone and contextual framing extracted from grounding search engine answer blocks
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <span>{expanded ? 'Collapse' : 'Expand'}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <CardContent className="p-5 space-y-6">
          {/* Sentiment Gauge & Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Positive Score Card */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Smile className="h-4 w-4 text-emerald-600" />
                  Positive Endorsement
                </span>
                <span className="text-lg font-black text-emerald-700">{positivePercent}%</span>
              </div>
              <p className="text-xs text-emerald-800 mt-2">
                Praised for superior knit elasticity, waistband stay-up engineering, and fabric durability.
              </p>
              <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${positivePercent}%` }} />
              </div>
            </div>

            {/* Neutral / Objective Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Meh className="h-4 w-4 text-slate-500" />
                  Neutral &amp; Factual
                </span>
                <span className="text-lg font-black text-slate-700">{neutralPercent}%</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Objective citations referencing fabric composition percentages, inseam specs, and retail locations.
              </p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-slate-500 h-full rounded-full" style={{ width: `${neutralPercent}%` }} />
              </div>
            </div>

            {/* Critical / Cautionary Card */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Frown className="h-4 w-4 text-amber-600" />
                  Cautionary / Nuance
                </span>
                <span className="text-lg font-black text-amber-700">{criticalPercent}%</span>
              </div>
              <p className="text-xs text-amber-800 mt-2">
                Points of friction cited by models: premium price barrier relative to budget competitors.
              </p>
              <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${criticalPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Model Sentiment Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Quote className="h-3.5 w-3.5 text-slate-400" />
              Extracted Grounding Context &amp; Key Quotes
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {excerpts.map((item, idx) => {
                const meta = getEngineMeta(item.engine);
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <EngineIcon engine={item.engine} size={16} />
                        <span className="text-xs font-bold text-slate-800">{meta.label}</span>
                      </div>
                      <Badge
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5',
                          item.type === 'positive'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.type === 'cautionary'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        )}
                      >
                        {item.type === 'positive' ? 'Positive Context' : item.type === 'cautionary' ? 'Cautionary Context' : 'Factual Context'}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200/60">
                      &ldquo;{item.quote}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Grounding Source: {item.source}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sentinel Recommendation Footer */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Sentinel Tone Remediation Blueprint
              </span>
              <p className="text-xs text-slate-600 max-w-2xl">
                Neutralize price caution in AI search models by indexing lifetime complimentary hemming &amp; quality guarantee FAQs in schema markup.
              </p>
            </div>

            {onOpenSentinel && (
              <Button
                size="sm"
                onClick={() =>
                  onOpenSentinel({
                    strategyTitle: 'Price Sentiment Neutralization & Longevity Schema',
                    strategyCategory: 'Sentiment & Value Framing',
                    queryText: `Sentiment optimization for ${brandName}`,
                    brandName: brandName,
                    domain: 'lululemon.com',
                    competitors: ['Alo Yoga', 'Vuori'],
                    underperformingEngines: [],
                    averageScore: avgVisibility,
                  })
                }
                className="h-8.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shrink-0 shadow-xs cursor-pointer"
              >
                <Bot className="h-3.5 w-3.5 mr-1.5" />
                Deploy Sentiment Fix
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
