'use client';

import * as React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Terminal, ExternalLink, CheckCircle2, AlertCircle, Quote, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { EngineBadge } from '@/components/ui/engine-badge';
import { DomainFavicon } from '@/components/citations/domain-favicon';

export interface AuditRunDetail {
  id: string;
  engine: string;
  visibilityScore: number;
  brandMentioned: boolean;
  rankingPosition: number | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  rawText: string;
  citedUrls: string[];
  createdAt: string;
}

export function RawOutputViewer({ runs }: { runs: AuditRunDetail[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-zinc-500" />
              Raw AI Answer Engine Telemetry
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Chronological log of full verbatim LLM outputs and reference citations
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-zinc-200 bg-zinc-50 text-zinc-700">
            {runs.length} Recorded Runs
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {runs.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500 font-mono">
            No raw outputs logged yet for this prompt.
          </div>
        ) : (
          <Accordion type="single" defaultValue={runs[0]?.id}>
            {runs.map((run) => (
              <AccordionItem key={run.id} value={run.id}>
                <AccordionTrigger>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full pr-4 text-xs font-mono">
                    <div className="flex items-center gap-2.5">
                      <EngineBadge engine={run.engine} size="xs" />
                      <span className="text-zinc-500">
                        {new Date(run.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {run.brandMentioned ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Rank #{run.rankingPosition || 1} &bull; {run.visibilityScore}% Score
                        </span>
                      ) : (
                        <span className="text-zinc-400 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Brand Omitted
                        </span>
                      )}

                      <Badge
                        variant={
                          run.sentiment === 'positive'
                            ? 'success'
                            : run.sentiment === 'negative'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-[10px] py-0 uppercase"
                      >
                        {run.sentiment}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="space-y-4 pt-3">
                    {/* Actions and Citation count bar */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-100 pb-2">
                      <span className="font-mono text-zinc-500 flex items-center gap-1.5">
                        <Quote className="h-3 w-3" />
                        {run.citedUrls?.length || 0} Citation URLs Extracted
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(run.id, run.rawText, e)}
                        className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                      >
                        {copiedId === run.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy Raw Output
                          </>
                        )}
                      </button>
                    </div>

                    {/* Full Raw Output Text Block */}
                    <div className="p-3.5 rounded-md bg-zinc-50 border border-zinc-200 font-mono text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                      {run.rawText}
                    </div>

                    {/* Cited URLs List */}
                    {run.citedUrls && run.citedUrls.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-semibold">
                          Captured Source Citations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {run.citedUrls.map((url, uidx) => (
                            <a
                              key={uidx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-zinc-200 text-[11px] font-mono text-zinc-700 hover:text-zinc-950 hover:border-zinc-300 transition-colors shadow-2xs group/cit"
                            >
                              <DomainFavicon url={url} size="xs" />
                              <span className="truncate max-w-xs">{url}</span>
                              <ExternalLink className="h-2.5 w-2.5 text-zinc-400 group-hover/cit:text-zinc-700" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
