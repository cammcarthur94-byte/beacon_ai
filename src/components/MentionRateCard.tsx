'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { fetchMentionRateAction } from '@/actions/mention-rate';

export interface MentionRateCardProps {
  tenantId?: string;
  initialRate?: number | string;
  delta?: number;
}

export function MentionRateCard({
  tenantId = 'default',
  initialRate = '74.6',
  delta = 14.8,
}: MentionRateCardProps) {
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [rate, setRate] = useState<string>(String(initialRate));
  const [isPending, startTransition] = useTransition();

  const handleSelectEngine = (engine: string | null) => {
    setSelectedEngine(engine);
    startTransition(async () => {
      try {
        const res = await fetchMentionRateAction(tenantId, engine, 30);
        setRate(res.formattedRate);
      } catch (e) {
        console.error('Failed to fetch mention rate:', e);
      }
    });
  };

  const engines = [
    { label: 'All', id: null },
    { label: 'ChatGPT', id: 'chatgpt' },
    { label: 'Perplexity', id: 'perplexity' },
  ];

  const isPositive = delta >= 0;

  return (
    <Card className="border-zinc-200 bg-white shadow-xs relative overflow-hidden group hover:border-zinc-300 transition-colors">
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 font-sans">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
            <span>AI Mention & Share of Voice</span>
          </div>

          {/* Sleek Minimalist Engine Pills in Google Sans */}
          <div className="flex items-center gap-0.5 bg-zinc-100 p-0.5 rounded-md border border-zinc-200/80">
            {engines.map((eng) => {
              const isActive = selectedEngine === eng.id;
              return (
                <button
                  key={eng.label}
                  type="button"
                  onClick={() => handleSelectEngine(eng.id)}
                  disabled={isPending}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-sans transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-zinc-950 font-medium shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {eng.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-zinc-950 font-sans">
              {rate}%
            </span>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
          </div>
          <Badge
            variant={isPositive ? 'success' : 'destructive'}
            className="text-xs font-sans gap-1 px-2 py-0.5"
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? `+${delta}%` : `${delta}%`}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default MentionRateCard;