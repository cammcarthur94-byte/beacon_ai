'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  FileText,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateAuditReportAction, type AuditReportData } from '@/app/audits/[promptId]/actions';

interface AiReportViewProps {
  promptId: string;
  initialReport?: AuditReportData | null;
}

export function AiReportView({ promptId, initialReport }: AiReportViewProps) {
  const [report, setReport] = useState<AuditReportData | null>(initialReport || null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const res = await generateAuditReportAction(promptId);
        if (res.error) {
          toast.error(res.error);
        } else if (res.report) {
          setReport(res.report);
          toast.success('AI Audit Strategy Report generated successfully!');
        }
      } catch {
        toast.error('Failed to generate report.');
      }
    });
  };

  return (
    <Card className="border-zinc-200 bg-white shadow-xs overflow-hidden">
      <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <CardTitle className="text-base font-semibold text-zinc-950 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              AI Search Audit Summary
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Synthesized insights based on live AI search results and your Brand Profile
          </CardDescription>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isPending}
          className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium self-start sm:self-auto gap-2 shadow-xs"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing Search Data...
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5 fill-current text-amber-400" />
              {report ? 'Re-Generate AI Report' : 'Generate AI Report'}
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        {!report ? (
          <div className="text-center py-12 space-y-3">
            <div className="h-12 w-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-semibold text-zinc-900">No AI Report Generated Yet</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Click &quot;Generate AI Report&quot; above to analyze your search results and Brand Profile.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-600 font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Executive Summary
                </span>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 font-semibold">
                  Verified Analysis
                </Badge>
              </div>
              <p className="text-sm text-zinc-800 leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>

            {/* Trend Analysis */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-600 font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-zinc-500" /> Competitive Trend Analysis
              </span>
              <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                {report.trendAnalysis}
              </p>
            </div>

            {/* Two Column: What Worked vs Needs Improvement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* What Worked */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase font-mono tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  What Worked (Visibility Wins)
                </div>
                <ul className="space-y-2 text-xs text-zinc-800">
                  {report.whatWorked.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">&bull;</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Needs Improvement */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs uppercase font-mono tracking-wider">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Needs Improvement (Citation Gaps)
                </div>
                <ul className="space-y-2 text-xs text-zinc-800">
                  {report.needsImprovement.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">&bull;</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actionable Solutions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-600 font-semibold flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Recommended Action Plan (To Reclaim Citations)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {report.actionableSolutions.map((solution, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-zinc-200 bg-white text-xs space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                        Action #{idx + 1}
                      </span>
                      <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-[10px] font-mono text-zinc-600">
                        Priority {idx === 0 ? 'High' : 'Medium'}
                      </Badge>
                    </div>
                    <p className="text-zinc-800 leading-relaxed">{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
