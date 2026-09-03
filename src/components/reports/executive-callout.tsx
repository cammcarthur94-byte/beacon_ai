import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShieldCheck, FileText } from 'lucide-react';

interface ExecutiveCalloutProps {
  summary: string;
  brandName: string;
}

export function ExecutiveCallout({ summary, brandName }: ExecutiveCalloutProps) {
  return (
    <Card className="border-zinc-200 bg-gradient-to-br from-white via-zinc-50/50 to-blue-50/20 shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-950">
              Executive Strategic Brief
            </CardTitle>
            <p className="text-[11px] text-zinc-500 font-mono">
              Account-Wide Generative Search Synthesis &bull; {brandName}
            </p>
          </div>
        </div>

        <Badge variant="outline" className="font-mono text-xs border-emerald-200 bg-emerald-50 text-emerald-700">
          <ShieldCheck className="h-3 w-3 mr-1" /> C-Suite Deliverable
        </Badge>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="prose prose-zinc max-w-none text-zinc-800 text-sm leading-relaxed font-sans">
          <p className="first-letter:text-2xl first-letter:font-bold first-letter:text-zinc-950 first-letter:mr-1">
            {summary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
