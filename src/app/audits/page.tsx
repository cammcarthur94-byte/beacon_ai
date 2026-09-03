import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { Search, Clock, Cpu, TrendingUp } from 'lucide-react';
import { AuditsClientView, type AuditPromptItem } from './audits-client';
import type { BrandKit } from '@/types/database.types';

export default async function AuditsPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: { id: string; name: string; domain: string; tier: string; brand_kit?: BrandKit } | null = null;
  let prompts: AuditPromptItem[] = [];

  // 1. Fetch from Supabase cloud
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, domain, tier, brand_kit')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (projects && projects.length > 0) {
        project = projects[0] as any;

        const { data: dbPrompts } = await supabase
          .from('prompts')
          .select('id, query_text, frequency, target_engines, search_intent, brand_association, is_active, last_run_at, next_run_at')
          .eq('project_id', project!.id)
          .order('created_at', { ascending: false });

        if (dbPrompts) {
          prompts = dbPrompts as any[];
        }
      }
    }
  }

  // 2. Fallback to active project cookie / demo prompts
  if (!project) {
    const projectCookie = cookieStore.get('beacon_active_project');
    if (projectCookie?.value) {
      try {
        project = JSON.parse(projectCookie.value);
      } catch {
        project = null;
      }
    }
  }

  if (!project) {
    project = {
      id: 'demo-project-lululemon',
      name: 'Lululemon',
      domain: 'lululemon.com',
      tier: 'enterprise',
      brand_kit: {
        industry: 'Premium Athleisure & Athletic Apparel',
        target_audience: 'Mindful movement practitioners, yoga & Pilates enthusiasts, runners, gym-goers, and fitness lifestyle consumers',
        core_offerings: 'Align Pant (Nulu fabric), Define Jacket, Wunder Train tights, ABC Joggers, Everywhere Belt Bag & technical athleisure',
        competitors: [
          { name: 'Alo Yoga', domain: 'aloyoga.com' },
          { name: 'Vuori', domain: 'vuoriclothing.com' },
          { name: 'Athleta', domain: 'athleta.gap.com' },
        ],
        tone_of_voice: 'Empowering, Mindful, Elevated, Performance-Driven',
      },
    };
  }

  const rawIndustry = (project.brand_kit?.industry || '').toLowerCase();
  const isConsumer =
    rawIndustry.includes('retail') ||
    rawIndustry.includes('commerce') ||
    rawIndustry.includes('apparel') ||
    rawIndustry.includes('footwear') ||
    rawIndustry.includes('fashion') ||
    rawIndustry.includes('sport') ||
    rawIndustry.includes('fitness') ||
    rawIndustry.includes('athleisure') ||
    project.name.toLowerCase().includes('nike') ||
    project.name.toLowerCase().includes('lululemon');

  if (prompts.length === 0) {
    const demoPromptsCookie = cookieStore.get('beacon_demo_prompts');
    if (demoPromptsCookie?.value) {
      try {
        prompts = JSON.parse(demoPromptsCookie.value);
      } catch {
        // ignore
      }
    }

    if (prompts.length === 0) {
      // Default initial prompts aligned with industry
      if (isConsumer) {
        prompts = [
          {
            id: 'prompt-seed-1',
            query_text: `Best buttery-soft yoga leggings for Pilates and studio workouts in 2026`,
            frequency: 'daily',
            target_engines: ['chatgpt', 'gemini', 'claude', 'perplexity'],
            search_intent: 'commercial',
            brand_association: 'unbranded',
            is_active: true,
            last_run_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
            latest_score: 94,
          },
          {
            id: 'prompt-seed-2',
            query_text: `${project.name} Align vs Alo Yoga Airbrush: durability, pilling, and squat test review`,
            frequency: 'weekly',
            target_engines: ['chatgpt', 'perplexity'],
            search_intent: 'commercial',
            brand_association: 'branded',
            is_active: true,
            last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 144).toISOString(),
            latest_score: 89,
          },
          {
            id: 'prompt-seed-3',
            query_text: `Best men's commuter pants and workout joggers: ${project.name} ABC vs Vuori Meta`,
            frequency: 'daily',
            target_engines: ['gemini', 'perplexity'],
            search_intent: 'commercial',
            brand_association: 'branded',
            is_active: true,
            last_run_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
            next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 16).toISOString(),
            latest_score: 86,
          },
          {
            id: 'prompt-seed-4',
            query_text: `Where to buy authentic ${project.name} Align leggings and Everywhere Belt Bags online`,
            frequency: 'daily',
            target_engines: ['gemini', 'perplexity', 'chatgpt'],
            search_intent: 'transactional',
            brand_association: 'branded',
            is_active: true,
            last_run_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
            next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
            latest_score: 92,
          },
          {
            id: 'prompt-seed-5',
            query_text: `Top moisture-wicking athletic wear brands for hot yoga and HIIT training`,
            frequency: 'weekly',
            target_engines: ['claude', 'perplexity'],
            search_intent: 'informational',
            brand_association: 'unbranded',
            is_active: true,
            last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
            latest_score: 81,
          },
        ];
      } else {
        prompts = [
          {
            id: 'prompt-seed-1',
            query_text: `What are the best platforms for ${project.name || 'enterprise intelligence'} in 2026?`,
            frequency: 'daily',
            target_engines: ['chatgpt', 'gemini', 'claude', 'perplexity'],
            search_intent: 'commercial',
            brand_association: 'unbranded',
            is_active: true,
            last_run_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
            latest_score: 92,
          },
          {
            id: 'prompt-seed-2',
            query_text: `Top alternatives to legacy market incumbents for ${project.domain}`,
            frequency: 'weekly',
            target_engines: ['chatgpt', 'perplexity'],
            search_intent: 'commercial',
            brand_association: 'branded',
            is_active: true,
            last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 144).toISOString(),
            latest_score: 84,
          },
          {
            id: 'prompt-seed-3',
            query_text: `How to implement generative engine optimization workflows`,
            frequency: 'daily',
            target_engines: ['claude', 'perplexity'],
            search_intent: 'informational',
            brand_association: 'unbranded',
            is_active: true,
            last_run_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
            next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
            latest_score: 78,
          },
        ];
      }
    }
  }

  const activeCount = prompts.filter((p) => p.is_active).length;
  const dailyCount = prompts.filter((p) => p.frequency === 'daily').length;
  const weeklyCount = prompts.filter((p) => p.frequency === 'weekly' || p.frequency === 'biweekly').length || Math.max(0, prompts.length - dailyCount);

  // Overall Visibility (Avg SOV across prompts)
  const totalScore = prompts.reduce((acc, p) => acc + (p.latest_score || 84.2), 0);
  const avgSov = prompts.length > 0 ? (totalScore / prompts.length).toFixed(1) : '84.2';

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-8">
        {/* Page Title & Executive Subtitle */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Audits &amp; Monitoring Engine
            </span>
            <span className="text-slate-300">&bull;</span>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Automated Telemetry Active</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Prompt &amp; Query Intelligence
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-4xl font-normal">
            Manage and schedule the exact questions your buyers ask AI search engines. Beacon continuously monitors your brand visibility, tracks rank placement, and alerts you instantly when competitors steal your citations.
          </p>
        </div>

        {/* ── 4-COLUMN EXECUTIVE KPI METRIC CARD GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Query Trackers */}
          <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Active Query Trackers
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                <Search className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {activeCount} / {prompts.length}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                {Math.round((activeCount / Math.max(prompts.length, 1)) * 100)}% Seat Capacity
              </p>
            </div>
          </Card>

          {/* Card 2: Overall Visibility (Avg SOV) */}
          <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Overall Visibility (Avg SOV)
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {avgSov}%
              </div>
              <p className="text-xs font-semibold text-emerald-600 mt-1 font-sans flex items-center gap-1">
                <span>▲ +4.1% vs last week</span>
              </p>
            </div>
          </Card>

          {/* Card 3: Active Monitoring Cadence */}
          <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Active Monitoring Cadence
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {dailyCount} Daily · {weeklyCount} Weekly
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Automated telemetry schedule
              </p>
            </div>
          </Card>

          {/* Card 4: Connected AI Engines & Coverage */}
          <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Connected AI Engines
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
                <Cpu className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                6 Engines Active
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans truncate" title="ChatGPT, Claude, Gemini, Perplexity, AI Mode, AI Overviews">
                ChatGPT, Claude, Gemini, Perplexity &amp; Google AI
              </p>
            </div>
          </Card>
        </div>

        {/* INTERACTIVE AUDITS CLIENT */}
        <AuditsClientView initialPrompts={prompts} project={project} />
      </div>
    </AppSidebarLayout>
  );
}
