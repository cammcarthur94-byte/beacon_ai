'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Award,
  Users,
  Quote,
  Sparkles,
} from 'lucide-react';
import { getEngineMeta, EngineIcon } from '@/components/ui/engine-badge';
import { DomainFavicon } from '@/components/citations/domain-favicon';
import { cn } from '@/lib/utils';
import type { AuditRunDetail } from './raw-output-viewer';

interface ModelComparisonViewProps {
  runs: AuditRunDetail[];
  brandName: string;
  competitors: string[];
}

function EngineFaviconTab({
  engine,
  isSelected,
  onClick,
  score,
}: {
  engine: string;
  isSelected: boolean;
  onClick: () => void;
  score: number;
}) {
  const meta = getEngineMeta(engine);
  const [hasError, setHasError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none font-sans',
        isSelected
          ? 'bg-white border-emerald-500 ring-1 ring-emerald-500 text-slate-950 shadow-xs'
          : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
      )}
    >
      <div className="h-5 w-5 rounded-md flex items-center justify-center shrink-0">
        {!hasError ? (
          <img
            src={`https://www.google.com/s2/favicons?domain=${meta.domain}&sz=64`}
            alt={meta.label}
            width={16}
            height={16}
            loading="lazy"
            className="h-4 w-4 object-contain"
            onError={() => setHasError(true)}
          />
        ) : (
          <EngineIcon engine={engine} size={14} className={meta.iconColor} />
        )}
      </div>
      <span>{meta.label}</span>
      <span
        className={cn(
          'ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums',
          score >= 80 ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-800'
        )}
      >
        {score}%
      </span>
    </button>
  );
}

export function ModelComparisonView({ runs, brandName, competitors }: ModelComparisonViewProps) {
  const [selectedEngineId, setSelectedEngineId] = useState<string>(runs[0]?.engine || 'perplexity');
  const [copied, setCopied] = useState(false);

  const selectedRun = runs.find((r) => r.engine === selectedEngineId) || runs[0];
  if (!selectedRun) return null;

  const selectedMeta = getEngineMeta(selectedRun.engine);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedRun.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find competitors mentioned in this run's rawText
  const mentionedCompetitors = competitors.filter((c) =>
    selectedRun.rawText.toLowerCase().includes(c.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Horizontal Model Switcher Tabs */}
      <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1">
        {runs.map((r) => (
          <EngineFaviconTab
            key={r.engine}
            engine={r.engine}
            score={r.visibilityScore}
            isSelected={selectedEngineId === r.engine}
            onClick={() => setSelectedEngineId(r.engine)}
          />
        ))}
      </div>

      {/* 2. Split Comparison Matrix Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Full-Width Verbatim Synthesized Output */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs flex items-center justify-center">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${selectedMeta.domain}&sz=64`}
                    alt={selectedMeta.label}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedMeta.label} Synthesized Response
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Verbatim LLM answer captured during live audit scan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-bold px-2.5 py-1',
                    selectedRun.brandMentioned
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-rose-300 bg-rose-50 text-rose-800'
                  )}
                >
                  {selectedRun.brandMentioned ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 inline" />
                      Brand Grounded
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600 inline" />
                      Brand Missing
                    </>
                  )}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 text-xs font-medium cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-6">
              {/* Verbatim Output Text Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap shadow-2xs">
                {selectedRun.rawText}
              </div>

              {/* Citations Grounded in this Answer */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Quote className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Citations Grounded in this Answer ({selectedRun.citedUrls?.length || 0})</span>
                </h4>
                {selectedRun.citedUrls && selectedRun.citedUrls.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRun.citedUrls.map((url, i) => {
                      try {
                        const parsed = new URL(url);
                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs group text-xs text-slate-700"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <DomainFavicon domain={parsed.hostname} size="sm" />
                              <span className="truncate font-medium">{parsed.hostname.replace('www.', '')}</span>
                            </div>
                            <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-slate-900 shrink-0 ml-2" />
                          </a>
                        );
                      } catch {
                        return null;
                      }
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No direct URLs cited by this engine.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Cross-Engine Comparative Intelligence */}
        <div className="space-y-4">
          {/* Key Score Breakdown */}
          <Card className="border-slate-200 bg-white shadow-xs p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <span>{selectedMeta.label} Score Breakdown</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-600 font-medium">Visibility (SOV):</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">
                  {selectedRun.visibilityScore}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-600 font-medium">Ranking Position:</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">
                  {selectedRun.rankingPosition ? `#${selectedRun.rankingPosition}` : 'Unranked'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-600 font-medium">Sentiment:</span>
                <span className="font-bold capitalize text-emerald-700">
                  {selectedRun.sentiment} ({(selectedRun.sentimentScore * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </Card>

          {/* Competitors Named in This Model */}
          <Card className="border-slate-200 bg-white shadow-xs p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Competitors Named in Answer</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI engines compare brands directly in transactional synthesis blocks.
            </p>
            {mentionedCompetitors.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {mentionedCompetitors.map((comp) => (
                  <Badge
                    key={comp}
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-900 text-xs font-semibold px-2.5 py-1"
                  >
                    {comp}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 text-center">
                No direct competitor brand names detected in this answer.
              </div>
            )}
          </Card>

          {/* Multi-Engine Consensus Overview */}
          <Card className="border-slate-200 bg-white shadow-xs p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600" />
              <span>Cross-Engine Consensus</span>
            </h4>
            <div className="space-y-2 text-xs">
              {runs.map((r) => {
                const rMeta = getEngineMeta(r.engine);
                return (
                  <div
                    key={r.engine}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${rMeta.domain}&sz=64`}
                        alt={rMeta.label}
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5 object-contain"
                      />
                      <span className="font-medium text-slate-700">{rMeta.label}</span>
                    </div>
                    <span
                      className={cn(
                        'font-bold text-[11px] tabular-nums',
                        r.visibilityScore >= 80 ? 'text-emerald-700' : 'text-slate-600'
                      )}
                    >
                      {r.visibilityScore}% ({r.rankingPosition ? `#${r.rankingPosition}` : 'Omitted'})
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
