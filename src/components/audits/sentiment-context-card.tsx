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
import type { RemediationContext } from './sentinel-remediation-drawer';

export interface SentimentContextCardProps {
  runs: AuditRunDetail[];
  brandName: string;
  domain?: string;
  competitors?: string[];
  queryText?: string;
  onOpenSentinel?: (context: RemediationContext) => void;
}

export function extractEngineQuote(rawText: string, brandName: string): string {
  if (!rawText || !rawText.trim()) {
    return 'No textual answer returned by engine for this query.';
  }

  const lines = rawText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const lowerBrand = (brandName || '').toLowerCase();

  // Find a line that mentions the brand
  let candidateText = '';
  const brandLine = lowerBrand
    ? lines.find((line) => line.toLowerCase().includes(lowerBrand))
    : undefined;

  if (brandLine) {
    const sentences = brandLine.split(/(?<=[.!?])\s+/);
    const brandSentence = sentences.find((s) => s.toLowerCase().includes(lowerBrand));
    candidateText = brandSentence || brandLine;
  } else {
    // If brand not found, look for first descriptive line
    const descriptiveLine = lines.find(
      (l) =>
        !l.startsWith('#') &&
        l.length > 25 &&
        !l.toLowerCase().includes('here is') &&
        !l.toLowerCase().includes('here are')
    );
    candidateText = descriptiveLine || lines[0] || '';
  }

  // Clean markdown formatting: leading numbers/bullets, bold markers, links
  let cleaned = candidateText
    .replace(/^(\d+[\.\)]\s*|[-*•]\s*|\*\*|\*|#+\s*)+/, '')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

  if (cleaned.length > 240) {
    const truncated = cleaned.slice(0, 230);
    const lastSpace = truncated.lastIndexOf(' ');
    cleaned = (lastSpace > 160 ? truncated.slice(0, lastSpace) : truncated) + '...';
  }

  return cleaned || 'Direct response synthesis returned by search model.';
}

export function formatGroundingSources(citedUrls: string[], engineLabel: string): string {
  if (!citedUrls || citedUrls.length === 0) {
    return `${engineLabel} Search Index`;
  }

  const domains = citedUrls
    .map((u) => {
      try {
        const parsed = new URL(u);
        return parsed.hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    })
    .filter(Boolean);

  const unique = Array.from(new Set(domains));
  if (unique.length === 0) {
    return `${engineLabel} Search Index`;
  }

  if (unique.length === 1) {
    return unique[0];
  }

  return `${unique[0]} & ${unique[1]}`;
}

export function SentimentContextCard({
  runs,
  brandName,
  domain,
  competitors,
  queryText,
  onOpenSentinel,
}: SentimentContextCardProps) {
  const [expanded, setExpanded] = useState(true);

  // Compute aggregate visibility and dynamic sentiment distribution from actual runs
  const totalRuns = runs.length;
  const avgVisibility =
    totalRuns > 0
      ? Math.round(runs.reduce((acc, r) => acc + r.visibilityScore, 0) / totalRuns)
      : 0;

  const positiveRuns = runs.filter(
    (r) => r.sentiment === 'positive' || (r.sentimentScore != null && r.sentimentScore >= 0.7)
  );
  const cautionaryRuns = runs.filter(
    (r) => r.sentiment === 'negative' || (r.sentimentScore != null && r.sentimentScore < 0.4)
  );
  const neutralRuns = runs.filter(
    (r) => !positiveRuns.includes(r) && !cautionaryRuns.includes(r)
  );

  const positivePercent =
    totalRuns > 0 ? Math.round((positiveRuns.length / totalRuns) * 100) : 0;
  const criticalPercent =
    totalRuns > 0 ? Math.round((cautionaryRuns.length / totalRuns) * 100) : 0;
  const neutralPercent =
    totalRuns > 0 ? Math.max(0, 100 - positivePercent - criticalPercent) : 0;

  // Extract dynamic excerpts for each actual responding engine
  const excerpts = runs.map((run) => {
    const meta = getEngineMeta(run.engine);
    const isPositive =
      run.sentiment === 'positive' || (run.sentimentScore != null && run.sentimentScore >= 0.7);
    const isCautionary =
      run.sentiment === 'negative' || (run.sentimentScore != null && run.sentimentScore < 0.4);

    const type: 'positive' | 'cautionary' | 'neutral' = isPositive
      ? 'positive'
      : isCautionary
      ? 'cautionary'
      : 'neutral';

    return {
      engine: run.engine,
      engineLabel: meta.label,
      type,
      quote: extractEngineQuote(run.rawText, brandName),
      source: formatGroundingSources(run.citedUrls, meta.label),
    };
  });

  const underperformingEngines = runs
    .filter((r) => r.visibilityScore < 70)
    .map((r) => r.engine);

  const hasFriction = criticalPercent > 0 || avgVisibility < 75;

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
              <Badge
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5',
                  positivePercent >= 60
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : criticalPercent >= 35
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                )}
              >
                {positivePercent >= 60
                  ? `${positivePercent}% Positive Polarity`
                  : criticalPercent >= 35
                  ? `${criticalPercent}% Cautionary Risk`
                  : `${neutralPercent}% Balanced / Factual Tone`}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Overall tone and customer perception extracted from AI search answers
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
                {positiveRuns.length > 0
                  ? `Endorsed favorably as a top recommendation in ${positiveRuns.length} of ${totalRuns} responding AI engine${totalRuns > 1 ? 's' : ''}.`
                  : `No explicitly positive endorsements detected across scanned models for this query.`}
              </p>
              <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${positivePercent}%` }}
                />
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
                {neutralRuns.length > 0
                  ? `Objective citations referencing product specifications, feature comparisons, and directory references in ${neutralRuns.length} model${neutralRuns.length > 1 ? 's' : ''}.`
                  : `Direct recommendation answers with minimal purely neutral or factual-only framing.`}
              </p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-slate-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${neutralPercent}%` }}
                />
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
                {cautionaryRuns.length > 0
                  ? `Competitor alternatives prioritized or points of friction cited in ${cautionaryRuns.length} engine response${cautionaryRuns.length > 1 ? 's' : ''}.`
                  : `Zero friction points or cautionary flags detected across active model responses.`}
              </p>
              <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${criticalPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Model Sentiment Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Quote className="h-3.5 w-3.5 text-slate-400" />
              Extracted Answer Context &amp; Key Quotes
            </h4>

            {excerpts.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500 bg-slate-50/50">
                No engine runs recorded yet for this prompt. Trigger an audit run to generate multi-model sentiment analysis.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {excerpts.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <EngineIcon engine={item.engine} size={16} />
                        <span className="text-xs font-bold text-slate-800">{item.engineLabel}</span>
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
                        {item.type === 'positive'
                          ? 'Positive Context'
                          : item.type === 'cautionary'
                          ? 'Cautionary Context'
                          : 'Factual Context'}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200/60">
                      &ldquo;{item.quote}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Source: {item.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sentinel Recommendation Footer */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Recommendation Improvement Plan
              </span>
              <p className="text-xs text-slate-600 max-w-2xl">
                {hasFriction
                  ? `Address competitor advantages in AI search results for "${brandName}" by publishing clear FAQs, product comparisons, and verified customer reviews.`
                  : `Maintain positive sentiment for "${brandName}" with regularly updated product facts and clear website information.`}
              </p>
            </div>

            {onOpenSentinel && (
              <Button
                size="sm"
                onClick={() =>
                  onOpenSentinel({
                    strategyTitle: hasFriction
                      ? `Brand Sentiment & Authority Guide for ${brandName}`
                      : `Brand Trust & Reputation Guide for ${brandName}`,
                    strategyCategory: 'Sentiment & Value Framing',
                    queryText: queryText || `Sentiment optimization for ${brandName}`,
                    brandName: brandName,
                    domain: domain || 'yourbrand.com',
                    competitors: competitors && competitors.length > 0 ? competitors : ['Category Competitors'],
                    underperformingEngines: underperformingEngines,
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
