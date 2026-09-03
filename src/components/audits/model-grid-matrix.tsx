'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Quote,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getEngineMeta, EngineIcon } from '@/components/ui/engine-badge';
import { DomainFavicon } from '@/components/citations/domain-favicon';
import { cn } from '@/lib/utils';
import type { AuditRunDetail } from './raw-output-viewer';

interface ModelGridMatrixProps {
  runs: AuditRunDetail[];
  brandName: string;
}

function EngineFaviconLogo({ engine }: { engine: string }) {
  const meta = getEngineMeta(engine);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      title={meta.label}
      className={cn(
        'h-7 w-7 rounded-lg border border-slate-200/90 bg-white p-1 shadow-2xs flex items-center justify-center shrink-0',
        meta.badgeClass
      )}
    >
      {!hasError ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${meta.domain}&sz=64`}
          alt={meta.label}
          width={18}
          height={18}
          loading="lazy"
          className="h-4 w-4 object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <EngineIcon engine={engine} size={14} className={meta.iconColor} />
      )}
    </div>
  );
}

export function ModelGridMatrix({ runs, brandName }: ModelGridMatrixProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (runs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs font-sans">
        No engine outputs recorded for this audit prompt yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {runs.map((run) => {
        const meta = getEngineMeta(run.engine);
        const isCopied = copiedId === run.id;
        const isExpanded = expandedId === run.id;

        // Determine brand recommendation badge
        const isRecommended = run.brandMentioned && (run.rankingPosition === 1 || run.visibilityScore >= 80);
        const isMentioned = run.brandMentioned && !isRecommended;
        const isOmitted = !run.brandMentioned;

        return (
          <Card
            key={run.id}
            className="border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between font-sans overflow-hidden group"
          >
            {/* Engine Header Bar */}
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <EngineFaviconLogo engine={run.engine} />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
                      {meta.label}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {new Date(run.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Visibility Score Badge */}
                <div
                  className={cn(
                    'px-2.5 py-1 rounded-lg border text-xs font-bold tabular-nums shadow-2xs shrink-0',
                    run.visibilityScore >= 80
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : run.visibilityScore >= 60
                      ? 'border-blue-200 bg-blue-50 text-blue-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  )}
                >
                  {run.visibilityScore}% SOV
                </div>
              </div>

              {/* Status Badges Row */}
              <div className="flex items-center justify-between gap-2 pt-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {isRecommended && (
                    <Badge variant="outline" className="text-[11px] font-sans font-bold border-emerald-300 bg-emerald-100/70 text-emerald-900 shadow-2xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-700" />
                      Recommended
                    </Badge>
                  )}
                  {isMentioned && (
                    <Badge variant="outline" className="text-[11px] font-sans font-bold border-blue-300 bg-blue-100/70 text-blue-900 shadow-2xs">
                      <AlertCircle className="h-3 w-3 mr-1 text-blue-700" />
                      Mentioned
                    </Badge>
                  )}
                  {isOmitted && (
                    <Badge variant="outline" className="text-[11px] font-sans font-bold border-rose-300 bg-rose-100/70 text-rose-900 shadow-2xs">
                      <XCircle className="h-3 w-3 mr-1 text-rose-700" />
                      Omitted
                    </Badge>
                  )}

                  {/* Ranking Position Badge */}
                  {run.rankingPosition && (
                    <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                      Rank #{run.rankingPosition}
                    </span>
                  )}
                </div>

                {/* Copy verbatim snippet */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(run.id, run.rawText)}
                  title="Copy synthesized response"
                  className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardHeader>

            {/* Synthesized Answer Preview */}
            <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Synthesized Answer Snippet
                </span>
                <div
                  className={cn(
                    'rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap transition-all overflow-hidden',
                    isExpanded ? 'max-h-none' : 'max-h-[160px]'
                  )}
                >
                  {run.rawText}
                </div>
                {run.rawText.length > 200 && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : run.id)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <span>{isExpanded ? 'Collapse Snippet' : 'View Full Output'}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>

              {/* Cited Referring Domains */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Citations Grounded ({run.citedUrls?.length || 0})</span>
                </div>
                {run.citedUrls && run.citedUrls.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {run.citedUrls.slice(0, 3).map((url, i) => {
                      try {
                        const parsed = new URL(url);
                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors group/link truncate max-w-[180px]"
                          >
                            <DomainFavicon domain={parsed.hostname} size="sm" />
                            <span className="truncate">{parsed.hostname.replace('www.', '')}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-slate-400 group-hover/link:text-slate-700 shrink-0" />
                          </a>
                        );
                      } catch {
                        return null;
                      }
                    })}
                    {run.citedUrls.length > 3 && (
                      <span className="text-[11px] font-semibold text-slate-500 pl-1">
                        +{run.citedUrls.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No external URLs cited</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
