'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquareQuote, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import type { ExecutiveReportData } from '@/lib/schemas/executive-report';

interface PromptConsensusTableProps {
  promptConsensusList: ExecutiveReportData['promptConsensusList'];
  brandName: string;
}

export function PromptConsensusTable({ promptConsensusList, brandName }: PromptConsensusTableProps) {
  const getPositionBadge = (pos: 'primary_recommendation' | 'alternative' | 'omitted') => {
    switch (pos) {
      case 'primary_recommendation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono border font-medium border-emerald-200 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Primary Rec
          </span>
        );
      case 'alternative':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono border font-medium border-blue-200 bg-blue-50 text-blue-800">
            <HelpCircle className="h-3 w-3 text-blue-600" /> Alternative
          </span>
        );
      case 'omitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono border font-medium border-red-200 bg-red-50 text-red-800">
            <XCircle className="h-3 w-3 text-red-600" /> Omitted
          </span>
        );
    }
  };

  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-zinc-950 flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-zinc-500" />
            Prompt-by-Prompt Consensus Matrix
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Detailed breakdown of how answer engines categorize and recommend {brandName} across tracked search intents
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-mono text-xs border-zinc-200 bg-zinc-50 text-zinc-700">
          {promptConsensusList.length} Prompts Audited
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t border-zinc-200 overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/75">
              <TableRow>
                <TableHead className="font-semibold text-xs text-zinc-700 w-[240px]">
                  Tracked Query Phrase
                </TableHead>
                <TableHead className="font-semibold text-xs text-zinc-700 w-[140px]">
                  Brand Stature
                </TableHead>
                <TableHead className="font-semibold text-xs text-zinc-700">
                  Multi-Engine Consensus Summary
                </TableHead>
                <TableHead className="font-semibold text-xs text-zinc-700 w-[160px] text-right">
                  Top Competitor Cited
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {promptConsensusList.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-zinc-50/60">
                  {/* Prompt Text */}
                  <TableCell className="font-mono text-xs font-semibold text-zinc-950 py-3.5">
                    &ldquo;{item.promptText}&rdquo;
                  </TableCell>

                  {/* Brand Position Badge */}
                  <TableCell>
                    {getPositionBadge(item.brandPosition)}
                  </TableCell>

                  {/* Consensus Summary */}
                  <TableCell className="text-xs text-zinc-700 leading-relaxed max-w-md">
                    {item.consensusSummary}
                  </TableCell>

                  {/* Top Competitor Cited */}
                  <TableCell className="text-right font-mono text-xs text-zinc-600">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px]">
                      {item.topCompetitorCited}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
