'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CitationSourcesChart, type CitationDomainItem } from './citation-sources-chart';
import { EngineComparisonChart, type EngineVisibilityScore } from './engine-comparison-chart';
import { SentimentDonutChart, type SentimentSliceData } from './sentiment-donut-chart';
import { Link2, Cpu, HeartHandshake } from 'lucide-react';

export interface CitationOptions {
  domains: CitationDomainItem[];
  selectedDomain: string | null;
  onSelectDomain: (domain: string | null) => void;
}

export interface EngineOptions {
  comparisonData: EngineVisibilityScore[];
  selectedEngines: string[];
  onToggleEngine: (engineId: string) => void;
}

export interface SentimentOptions {
  data: SentimentSliceData[];
  selectedCategory: 'all' | 'positive' | 'neutral' | 'negative';
  onSelectCategory: (cat: 'all' | 'positive' | 'neutral' | 'negative') => void;
  netScore: number;
}

export interface TopRightAnalyticsCardOptions {
  citation: CitationOptions;
  engine: EngineOptions;
  sentiment: SentimentOptions;
  brandName: string;
}

export interface TopRightAnalyticsCardProps {
  options: TopRightAnalyticsCardOptions;
}

export function TopRightAnalyticsCard({ options }: TopRightAnalyticsCardProps) {
  const { citation, engine, sentiment, brandName } = options;
  const [activeTab, setActiveTab] = useState<string>('citations');

  const isCitationFiltered = Boolean(citation.selectedDomain);
  const isEngineFiltered = engine.selectedEngines.length > 0 && engine.selectedEngines.length < 4;
  const isSentimentFiltered = sentiment.selectedCategory !== 'all';

  return (
    <Card className="border-zinc-200 bg-white shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList className="h-8 p-0.5 bg-zinc-100 border border-zinc-200">
              {/* Tab 1: Citation Sources */}
              <TabsTrigger
                value="citations"
                className="text-xs font-mono px-2.5 py-1 gap-1.5 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs"
              >
                <Link2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Citation Sources</span>
                {isCitationFiltered && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse ml-0.5" />
                )}
              </TabsTrigger>

              {/* Tab 2: Engine Prominence */}
              <TabsTrigger
                value="engines"
                className="text-xs font-mono px-2.5 py-1 gap-1.5 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs"
              >
                <Cpu className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                <span>Engine Prominence</span>
                {isEngineFiltered && (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 animate-pulse ml-0.5" />
                )}
              </TabsTrigger>

              {/* Tab 3: Sentiment Distribution */}
              <TabsTrigger
                value="sentiment"
                className="text-xs font-mono px-2.5 py-1 gap-1.5 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs"
              >
                <HeartHandshake className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Sentiment Donut</span>
                {isSentimentFiltered && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse ml-0.5" />
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-0 pt-4">
            {/* View 1: Citation Sources */}
            <TabsContent value="citations" className="mt-0 focus-visible:outline-hidden">
              <CitationSourcesChart
                data={citation.domains}
                selectedDomain={citation.selectedDomain}
                onSelectDomain={citation.onSelectDomain}
                brandName={brandName}
              />
            </TabsContent>

            {/* View 2: Engine Visibility Benchmark */}
            <TabsContent value="engines" className="mt-0 focus-visible:outline-hidden">
              <EngineComparisonChart
                data={engine.comparisonData}
                brandName={brandName}
                selectedEngines={engine.selectedEngines}
                onToggleEngine={engine.onToggleEngine}
              />
            </TabsContent>

            {/* View 3: Sentiment Donut Chart */}
            <TabsContent value="sentiment" className="mt-0 focus-visible:outline-hidden">
              <SentimentDonutChart
                data={sentiment.data}
                selectedCategory={sentiment.selectedCategory}
                onSelectCategory={sentiment.onSelectCategory}
                netScore={sentiment.netScore}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
