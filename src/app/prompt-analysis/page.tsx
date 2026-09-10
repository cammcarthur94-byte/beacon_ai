import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { PromptAnalysisClient, type PromptItemDetail } from '@/components/prompt-analysis/prompt-analysis-client';
import type { BrandKit } from '@/types/database.types';
import { parseActiveProjectCookie, isLegacyMockProject } from '@/lib/project-utils';
import { getDemoPrompts } from '@/lib/demo-prompts';
import * as React from 'react';

export const metadata = {
  title: 'Prompt Analysis | Beacon',
  description: 'Track prompt visibility scores, rankings, search intent, and AI-generated follow-up questions across answer engines.',
};

export default async function PromptAnalysisPage() {
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

  let promptItems: PromptItemDetail[] = [];

  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const { data: prompts } = await supabase
      .from('prompts')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    if (prompts && prompts.length > 0) {
      promptItems = prompts.map((p) => ({
        id: p.id,
        queryText: p.query_text,
        searchIntent: p.search_intent as any,
        brandAssociation: p.brand_association as any,
        targetEngines: p.target_engines || ['chatgpt', 'perplexity', 'gemini', 'claude'],
        latestScore: (p as any).latest_score || 85,
        isActive: p.is_active,
        frequency: p.frequency || 'daily',
        sentiment: 'positive',
        rankingPosition: 1,
      }));
    }
  }

  if (promptItems.length === 0 && project) {
    const demoPrompts = getDemoPrompts(cookieStore, project);
    promptItems = demoPrompts.map((dp) => ({
      id: dp.id,
      queryText: dp.query_text,
      searchIntent: dp.search_intent,
      brandAssociation: dp.brand_association,
      targetEngines: dp.target_engines || ['chatgpt', 'gemini'],
      latestScore: dp.latest_score || 84,
      isActive: dp.is_active,
      frequency: dp.frequency || 'daily',
      sentiment: 'positive',
      rankingPosition: 1,
    }));
  }

  return (
    <AppSidebarLayout project={project as any}>
      <React.Suspense fallback={<div className="p-8 animate-pulse text-slate-400">Loading Prompt Analysis...</div>}>
        <PromptAnalysisClient project={project as any} prompts={promptItems} />
      </React.Suspense>
    </AppSidebarLayout>
  );
}
