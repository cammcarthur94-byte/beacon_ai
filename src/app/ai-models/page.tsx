import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { AiModelsClient, type ModelMetricData } from '@/components/ai-models/ai-models-client';
import type { BrandKit } from '@/types/database.types';
import { parseActiveProjectCookie, isLegacyMockProject } from '@/lib/project-utils';
import * as React from 'react';

export const metadata = {
  title: 'AI Model Insights | Beacon',
  description: 'Benchmark how ChatGPT, Claude, Perplexity, and Gemini evaluate and recommend your brand.',
};

export default async function AiModelsPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: {
    id: string;
    name: string;
    domain: string;
    tier: string;
    brand_kit?: BrandKit;
  } | null = null;

  // 1. Fetch from Supabase
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: dbProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (dbProjects && dbProjects.length > 0 && !isLegacyMockProject(dbProjects[0])) {
        project = dbProjects[0] as any;
      }
    }
  }

  // 2. Cookie fallback
  if (!project) {
    const projectCookie = cookieStore.get('beacon_active_project');
    if (projectCookie?.value) {
      project = parseActiveProjectCookie(projectCookie.value) as any;
    }
  }

  if (!project) {
    redirect('/onboarding');
  }

  const brandName = project.name || 'Your Brand';

  const modelsData: ModelMetricData[] = [
    {
      engine: 'chatgpt',
      name: 'ChatGPT Search',
      provider: 'OpenAI (GPT-4o & Search)',
      visibilityScore: 92,
      mentionRate: 88,
      avgPosition: 1.2,
      positiveSentimentRate: 91,
      sovRate: 58,
      summaryQuote: `${brandName} is prominently featured in top recommendation lists with strong emphasis on product durability and quality.`,
    },
    {
      engine: 'perplexity',
      name: 'Perplexity AI',
      provider: 'Perplexity Pro (Sonar & Search)',
      visibilityScore: 89,
      mentionRate: 84,
      avgPosition: 1.4,
      positiveSentimentRate: 87,
      sovRate: 52,
      summaryQuote: `Highly referenced with direct source citations pointing to authentic user reviews and verified feature summaries.`,
    },
    {
      engine: 'claude',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      visibilityScore: 86,
      mentionRate: 82,
      avgPosition: 1.6,
      positiveSentimentRate: 89,
      sovRate: 49,
      summaryQuote: `Presents balanced comparisons highlighting ${brandName}'s core value proposition against leading market alternatives.`,
    },
    {
      engine: 'gemini',
      name: 'Google Gemini',
      provider: 'Google (Gemini 2.5 Flash)',
      visibilityScore: 88,
      mentionRate: 85,
      avgPosition: 1.5,
      positiveSentimentRate: 85,
      sovRate: 51,
      summaryQuote: `Consistently synthesizes ${brandName} within structured product overviews and shopping recommendations.`,
    },
  ];

  return (
    <AppSidebarLayout project={project as any}>
      <React.Suspense fallback={<div className="p-8 animate-pulse text-slate-400">Loading AI Model Insights...</div>}>
        <AiModelsClient project={project as any} modelsData={modelsData} />
      </React.Suspense>
    </AppSidebarLayout>
  );
}
