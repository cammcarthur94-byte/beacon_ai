'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Info, Sparkles, Code2, Share2 } from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/tooltip';
import type { CompetitorFeatureItem } from '@/app/api/competitor-mapping/route';
import type { ActionModalType } from './competitor-action-modal';

interface CompetitorComparisonRowProps {
  feat: CompetitorFeatureItem;
  brandName: string;
  onTriggerAction: (
    actionType: ActionModalType,
    feat: CompetitorFeatureItem,
    topComp: CompetitorFeatureItem['competitors'][0] | null
  ) => void;
}

export function CompetitorComparisonRow({
  feat,
  brandName,
  onTriggerAction,
}: CompetitorComparisonRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort competitors by AI recommendation/citation share descending so the top rival is first
  const sortedCompetitors = useMemo(() => {
    return [...feat.competitors].sort((a, b) => b.citationShare - a.citationShare);
  }, [feat.competitors]);

  const topCompetitor = sortedCompetitors[0];
  const remainingCompetitors = sortedCompetitors.slice(1);
  const isGapRow = feat.brandStatus === 'gap' || feat.brandStatus === 'missing';

  return (
    <TableRow className="hover:bg-slate-50/70 transition-colors group">
      {/* 1. Feature or Product Spec */}
      <TableCell className="pl-6 py-4 align-top">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {feat.category}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {feat.featureName}
          </span>
          <span className="text-[11px] text-slate-500 line-clamp-2">
            {feat.description}
          </span>
        </div>
      </TableCell>

      {/* 2. Standing (Vertically Centered) */}
      <TableCell className="text-center py-4 align-middle">
        <SimpleTooltip content="Leader status is awarded when capturing >40% of AI recommendations.">
          <span className="inline-block cursor-help">
            {feat.brandStatus === 'leader' && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
                Leader
              </Badge>
            )}
            {feat.brandStatus === 'parity' && (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold">
                Parity
              </Badge>
            )}
            {feat.brandStatus === 'gap' && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold">
                Gap
              </Badge>
            )}
            {feat.brandStatus === 'missing' && (
              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-semibold">
                Missing
              </Badge>
            )}
          </span>
        </SimpleTooltip>
      </TableCell>

      {/* 3. Our Brand Details */}
      <TableCell className="py-4 align-top">
        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          {feat.brandDetail}
        </p>
      </TableCell>

      {/* 4. Competitor Comparison: Top Competitor + Accordion */}
      <TableCell className="py-4 align-top">
        <div className="space-y-2">
          {/* Top Competitor Card */}
          {topCompetitor && (
            <div
              className={cn(
                'p-2.5 rounded-lg border space-y-1.5 transition-all',
                isGapRow
                  ? 'bg-amber-50/40 border-amber-300/90 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200/70'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs text-slate-800 shrink-0">
                    {topCompetitor.name}
                  </span>
                  {isGapRow && (
                    <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                      AEO Leader
                    </span>
                  )}
                  {topCompetitor.isUnlisted && (
                    <SimpleTooltip content="Indicates AI engines recently surfaced new product claims for this rival.">
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200 cursor-help">
                        AI Detected
                      </span>
                    </SimpleTooltip>
                  )}
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                  {topCompetitor.citationShare}% share
                </span>
              </div>

              <p
                className={cn(
                  'text-[11px] leading-relaxed',
                  topCompetitor.hasFeature ? 'text-slate-600' : 'text-slate-400 italic'
                )}
              >
                {topCompetitor.detail}
              </p>

              {/* Mini horizontal progress bar */}
              <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    topCompetitor.citationShare >= 45
                      ? 'bg-amber-500'
                      : topCompetitor.citationShare >= 25
                      ? 'bg-indigo-500'
                      : topCompetitor.citationShare > 0
                      ? 'bg-slate-400'
                      : 'bg-transparent'
                  )}
                  style={{ width: `${topCompetitor.citationShare}%` }}
                  title={`${topCompetitor.name} Recommendation Share: ${topCompetitor.citationShare}%`}
                />
              </div>
            </div>
          )}

          {/* Accordion Toggle for Remaining Competitors */}
          {remainingCompetitors.length > 0 && (
            <div className="pt-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="h-7 px-2 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-md gap-1 cursor-pointer transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                      Hide {remainingCompetitors.length} Competitor{remainingCompetitors.length > 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                      + {remainingCompetitors.length} Competitor{remainingCompetitors.length > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </Button>

              {/* Expanded Competitor Cards */}
              {isExpanded && (
                <div className="space-y-2 mt-2 pt-2 border-t border-dashed border-slate-200 animate-in fade-in-50 duration-200">
                  {remainingCompetitors.map((comp) => (
                    <div
                      key={comp.name}
                      className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-800 shrink-0">
                            {comp.name}
                          </span>
                          {comp.isUnlisted && (
                            <SimpleTooltip content="Indicates AI engines recently surfaced new product claims for this rival.">
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200 cursor-help">
                                AI Detected
                              </span>
                            </SimpleTooltip>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                          {comp.citationShare}% share
                        </span>
                      </div>

                      <p
                        className={cn(
                          'text-[11px] leading-relaxed',
                          comp.hasFeature ? 'text-slate-600' : 'text-slate-400 italic'
                        )}
                      >
                        {comp.detail}
                      </p>

                      <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            comp.citationShare >= 45
                              ? 'bg-amber-500'
                              : comp.citationShare >= 25
                              ? 'bg-indigo-500'
                              : comp.citationShare > 0
                              ? 'bg-slate-400'
                              : 'bg-transparent'
                          )}
                          style={{ width: `${comp.citationShare}%` }}
                          title={`${comp.name} Recommendation Share: ${comp.citationShare}%`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </TableCell>

      {/* 5. AI Recommendation Rate (Vertically Centered) */}
      <TableCell className="text-center py-4 align-middle">
        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
            <span className="text-emerald-700">{feat.brandCitationShare}%</span>
            <span className="text-slate-400 text-[10px]">vs rivals</span>
          </div>

          {/* Multi-segment Share bar */}
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${feat.brandCitationShare}%` }}
              title={`${brandName}: ${feat.brandCitationShare}%`}
            />
            <div
              className="h-full bg-amber-400"
              style={{ width: `${100 - feat.brandCitationShare}%` }}
              title={`Competitors: ${100 - feat.brandCitationShare}%`}
            />
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>Impact: {feat.aiImpactScore}/100</span>
            <SimpleTooltip content="A composite score based on feature search volume and commercial intent.">
              <span className="inline-flex cursor-help text-slate-400 hover:text-slate-600 transition-colors">
                <Info className="h-3 w-3" />
              </span>
            </SimpleTooltip>
          </div>
        </div>
      </TableCell>

      {/* 6. Action Column (Vertically Centered) */}
      <TableCell className="text-center pr-6 py-4 align-middle">
        {feat.brandStatus === 'leader' ? (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => onTriggerAction('proof-point', feat, topCompetitor)}
              className="h-7 px-2.5 text-[11px] font-medium bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Share2 className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>Export Proof Point</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 items-center justify-center">
            <button
              type="button"
              onClick={() => onTriggerAction('pr-pitch', feat, topCompetitor)}
              className="w-full h-7 px-2.5 text-[11px] font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-md transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-3 w-3 text-amber-300 shrink-0" />
              <span>Draft PR Pitch</span>
            </button>
            <button
              type="button"
              onClick={() => onTriggerAction('faq-schema', feat, topCompetitor)}
              className="w-full h-7 px-2.5 text-[11px] font-medium bg-slate-800 text-white hover:bg-slate-700 rounded-md transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Code2 className="h-3 w-3 text-blue-300 shrink-0" />
              <span>Generate FAQ</span>
            </button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
