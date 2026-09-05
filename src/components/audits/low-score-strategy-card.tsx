'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Bot,
  Sparkles,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  FileCode,
  Globe,
  Quote,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RemediationContext } from './sentinel-remediation-drawer';

export interface StrategyRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  expectedLift: string;
  actionLabel: string;
  impactLevel: 'high' | 'medium' | 'critical';
}

interface LowScoreStrategyCardProps {
  queryText: string;
  brandName: string;
  domain: string;
  averageScore: number;
  competitors: string[];
  underperformingEngines: string[];
  onOpenSentinel: (context: RemediationContext) => void;
  forceShow?: boolean;
}

export function LowScoreStrategyCard({
  queryText,
  brandName,
  domain,
  averageScore,
  competitors,
  underperformingEngines,
  onOpenSentinel,
  forceShow = false,
}: LowScoreStrategyCardProps) {
  // Show if average score is < 75% or forced
  const isLowScore = averageScore < 75 || forceShow;

  if (!isLowScore) return null;

  const competitorA = competitors[0] || 'Competitor A';
  const competitorB = competitors[1] || 'Competitor B';

  const recommendations: StrategyRecommendation[] = [
    {
      id: 'entity-coverage',
      category: 'Content Details',
      title: `Add key product details and specifications to counter ${competitorA}`,
      description: `AI search engines recommend competitors for "${queryText}" because competitor pages include specific product specifications, certifications, and details that AI tools look for when answering questions.`,
      expectedLift: '+18% Recommendation Lift',
      actionLabel: 'Generate Content Blueprint',
      impactLevel: 'critical',
    },
    {
      id: 'schema-markup',
      category: 'Website Structure',
      title: 'Add structured FAQ and product information',
      description: `Perplexity and Google AI Overviews prioritize pages with clear, organized information. Adding clear FAQ answers to https://${domain} makes it easy for AI tools to quote your brand directly.`,
      expectedLift: '+14% Recommendation Lift',
      actionLabel: 'Generate Website Code Snippet',
      impactLevel: 'high',
    },
    {
      id: 'referring-domains',
      category: 'Review & Forum Sources',
      title: 'Get featured in buyer guides and product roundups',
      description: `AI tools currently base their recommendations on articles from review blogs, community discussions, and buying guides where ${competitorA} and ${competitorB} are frequently mentioned.`,
      expectedLift: '+12% Recommendation Lift',
      actionLabel: 'Draft PR & Review Pitch',
      impactLevel: 'medium',
    },
  ];

  return (
    <Card className="border-amber-200/90 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-xs overflow-hidden">
      {/* Alert Header Banner */}
      <div className="bg-amber-500/10 border-b border-amber-200/80 px-5 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-amber-950 font-sans">
            Visibility Gap Detected: Average AI Recommendation Score is {Math.round(averageScore)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-300 bg-amber-100/70 text-amber-900 text-[11px] font-sans font-semibold">
            Action Recommended
          </Badge>
        </div>
      </div>

      <CardHeader className="p-5 sm:p-6 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
            <span>Improvement &amp; Discoverability Strategy</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 font-sans leading-relaxed max-w-3xl">
            AI search models evaluate commercial recommendation queries through authority sources and structured semantic entities. Below are prioritized remediation actions to recapture conversational search share.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-3 space-y-4">
        {/* Recommendation Cards List */}
        <div className="grid grid-cols-1 gap-3.5">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-sans font-bold uppercase tracking-wider',
                      rec.impactLevel === 'critical'
                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                        : rec.impactLevel === 'high'
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-blue-200 bg-blue-50 text-blue-800'
                    )}
                  >
                    {rec.category}
                  </Badge>
                  <span className="text-xs font-semibold text-emerald-700">
                    {rec.expectedLift}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              {/* Action Button: Ask Beacon Sentinel to Fix */}
              <div className="shrink-0 flex sm:flex-col items-end justify-center gap-2">
                <Button
                  onClick={() =>
                    onOpenSentinel({
                      strategyTitle: rec.title,
                      strategyCategory: rec.category,
                      queryText,
                      brandName,
                      domain,
                      competitors,
                      underperformingEngines,
                      averageScore,
                    })
                  }
                  className="w-full sm:w-auto inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer group"
                >
                  <Bot className="h-4 w-4" />
                  <span>Ask Beacon Sentinel to Fix</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
