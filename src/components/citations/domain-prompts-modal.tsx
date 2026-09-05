'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { DomainFavicon, CitationSourceIcon } from './domain-favicon';
import { getSourceTypeMeta } from '@/lib/citations/categorizer';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { CitationSourceType } from '@/types/database.types';

export interface PromptCitationStat {
  id: string;
  query_text: string;
  visibilityScore: number;
  status: 'recommended' | 'mentioned' | 'omitted';
  engines: string[];
  citationCount: number;
  lastAudited: string;
  search_intent?: string;
  brand_association?: string;
}

export interface DomainCitationRow {
  domain: string;
  sourceType: CitationSourceType;
  totalMentions: number;
  recentUrl: string;
  lastCitedAt: string;
  engines?: string[];
  allCitations?: Array<{
    id: string;
    url: string;
    createdAt: string;
    engine?: string;
  }>;
  promptsCount?: number;
  prompts?: PromptCitationStat[];
}

interface DomainPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainRow: DomainCitationRow | null;
}

const ENGINE_FAVICON_MAP: Record<string, { label: string; faviconDomain: string }> = {
  chatgpt: { label: 'ChatGPT', faviconDomain: 'openai.com' },
  gemini: { label: 'Gemini', faviconDomain: 'gemini.google.com' },
  claude: { label: 'Claude', faviconDomain: 'anthropic.com' },
  perplexity: { label: 'Perplexity', faviconDomain: 'perplexity.ai' },
  google_ai_overview: { label: 'Google AI', faviconDomain: 'google.com' },
  copilot: { label: 'Copilot', faviconDomain: 'microsoft.com' },
};

function ModalEngineBadge({ engine }: { engine: string }) {
  const norm = engine.toLowerCase();
  const meta = ENGINE_FAVICON_MAP[norm] || {
    label: engine.charAt(0).toUpperCase() + engine.slice(1),
    faviconDomain: `${norm}.com`,
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 shadow-2xs font-sans"
      title={meta.label}
    >
      <Image
        src={`https://www.google.com/s2/favicons?domain=${meta.faviconDomain}&sz=64`}
        alt={meta.label}
        width={12}
        height={12}
        className="rounded-xs object-contain"
        unoptimized
      />
      <span>{meta.label}</span>
    </span>
  );
}

export function DomainPromptsModal({
  isOpen,
  onClose,
  domainRow,
}: DomainPromptsModalProps) {
  if (!domainRow) return null;

  const meta = getSourceTypeMeta(domainRow.sourceType);
  const prompts = domainRow.prompts || [];

  const avgSov = prompts.length > 0
    ? Math.round(prompts.reduce((sum, p) => sum + p.visibilityScore, 0) / prompts.length)
    : 88;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 font-sans border-slate-200 shadow-2xl rounded-2xl">
        {/* HEADER */}
        <DialogHeader className="p-5 sm:p-6 bg-slate-50/90 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="p-1 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                  <DomainFavicon domain={domainRow.domain} size="md" />
                </div>
                <DialogTitle className="text-xl font-bold text-slate-950 tracking-tight font-sans">
                  {domainRow.domain}
                </DialogTitle>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs border font-semibold',
                    meta.badgeClass
                  )}
                >
                  <CitationSourceIcon sourceType={domainRow.sourceType} className={cn("h-3.5 w-3.5", meta.iconClass)} />
                  <span>{meta.label}</span>
                </span>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-slate-600 font-sans">
                Tracked searches where AI responses cited{' '}
                <span className="font-semibold text-slate-900">{domainRow.domain}</span>.
              </DialogDescription>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* QUICK STATS STRIP */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 font-sans">
            <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Searches Citing This
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-950 mt-0.5 tabular-nums">
                {prompts.length} {prompts.length === 1 ? 'Search' : 'Searches'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Times Cited
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-950 mt-0.5 tabular-nums">
                {domainRow.totalMentions} Mentions
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Avg Recommendation Rate
              </div>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5 tabular-nums flex items-center gap-1">
                <span>{avgSov}%</span>
                <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* PROMPTS LIST BODY */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-3.5 flex-1 font-sans bg-slate-50/30">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">
            Searches Citing This Website ({prompts.length})
          </div>

          {prompts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-xs text-slate-500">
                No searches currently associated with this website.
              </p>
            </div>
          ) : (
            prompts.map((prompt) => {
              const isRecommended = prompt.status === 'recommended';

              return (
                <div
                  key={prompt.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-xs transition-all space-y-3"
                >
                  {/* Prompt Text & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/audits/${prompt.id}`}
                      className="group/title inline-flex items-start gap-1.5 text-sm font-semibold text-slate-900 hover:text-emerald-700 transition-colors leading-snug"
                    >
                      <span>&ldquo;{prompt.query_text}&rdquo;</span>
                      <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover/title:text-emerald-600 transition-transform group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 shrink-0 mt-0.5" />
                    </Link>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0',
                        isRecommended
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          isRecommended ? 'bg-emerald-600' : 'bg-blue-600'
                        )}
                      />
                      <span>{isRecommended ? 'Recommended' : 'Mentioned'}</span>
                    </span>
                  </div>

                  {/* Metrics & Metadata Strip */}
                  <div className="flex items-center justify-between gap-3 flex-wrap pt-1 text-xs border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Rec Rate Score */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 font-semibold font-mono text-xs">
                        <span className="text-slate-500 font-sans font-normal text-[11px]">Rec Rate:</span>
                        <span className={prompt.visibilityScore >= 85 ? 'text-emerald-600' : 'text-amber-600'}>
                          {prompt.visibilityScore}%
                        </span>
                      </span>

                      {/* Domain Citation Count in this prompt */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 font-medium text-xs">
                        <Sparkles className="h-3 w-3 text-amber-600" />
                        <span>{prompt.citationCount} {prompt.citationCount === 1 ? 'citation' : 'citations'}</span>
                      </span>

                      {/* Intent badge if present */}
                      {prompt.search_intent && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] capitalize">
                          {prompt.search_intent}
                        </span>
                      )}
                    </div>

                    {/* Citing Engines Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 mr-0.5">Engines:</span>
                      {prompt.engines.map((eng) => (
                        <ModalEngineBadge key={eng} engine={eng} />
                      ))}
                    </div>
                  </div>

                  {/* Footer Action link */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>Last audited: {prompt.lastAudited}</span>
                    <Link
                      href={`/audits/${prompt.id}`}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-0.5 hover:underline"
                    >
                      <span>View Audit Results</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50/90 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs text-slate-500 font-sans">
          <span>
            Showing <strong className="text-slate-900">{prompts.length}</strong> prompts citing{' '}
            <strong className="text-slate-900">{domainRow.domain}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-3 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer font-sans font-medium"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
