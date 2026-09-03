'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CitationSourcesChart, type CitationDomainItem } from './citation-sources-chart';
import { EngineComparisonChart, type EngineVisibilityScore } from './engine-comparison-chart';
import { SentimentDonutChart, type SentimentSliceData } from './sentiment-donut-chart';
import { Link2, Cpu, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopRightAnalyticsCardProps {
  citationDomains: CitationDomainItem[];
  selectedDomain: string | null;
  onSelectDomain: (domain: string | null) => void;

  engineComparisonData: EngineVisibilityScore[];
  selectedEngines: string[];
  onToggleEngine: (engineId: string) => void;

  sentimentData: SentimentSliceData[];
  selectedSentimentCategory: 'all' | 'positive' | 'neutral' | 'negative';
  onSelectSentimentCategory: (cat: 'all' | 'positive' | 'neutral' | 'negative') => void;
  netSentimentScore: number;

  brandName: string;
}

export function TopRightAnalyticsCard({
  citationDomains,
  selectedDomain,
  onSelectDomain,
  engineComparisonData,
  selectedEngines,
  onToggleEngine,
  sentimentData,
  selectedSentimentCategory,
  onSelectSentimentCategory,
  netSentimentScore,
  brandName,
}: TopRightAnalyticsCardProps) {
  const [activeTab, setActiveTab] = useState<string>('citations');

  const isCitationFiltered = Boolean(selectedDomain);
  const isEngineFiltered = selectedEngines.length > 0 && selectedEngines.length < 4;
  const isSentimentFiltered = selectedSentimentCategory !== 'all';

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
                data={citationDomains}
                selectedDomain={selectedDomain}
                onSelectDomain={onSelectDomain}
                brandName={brandName}
              />
            </TabsContent>

            {/* View 2: Engine Visibility Benchmark */}
            <TabsContent value="engines" className="mt-0 focus-visible:outline-hidden">
              <EngineComparisonChart
                data={engineComparisonData}
                brandName={brandName}
                selectedEngines={selectedEngines}
                onToggleEngine={onToggleEngine}
              />
            </TabsContent>

            {/* View 3: Sentiment Donut Chart */}
            <TabsContent value="sentiment" className="mt-0 focus-visible:outline-hidden">
              <SentimentDonutChart
                data={sentimentData}
                selectedCategory={selectedSentimentCategory}
                onSelectCategory={onSelectSentimentCategory}
                netScore={netSentimentScore}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
