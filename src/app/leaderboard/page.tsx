import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { LeaderboardClient } from '@/components/leaderboard/leaderboard-client';
import type { BrandKit } from '@/types/database.types';

export const metadata = {
  title: 'Share of Voice (SOV) Leaderboard | Beacon',
  description: 'AI Engine Market Dominance and Competitor SOV Tracking across ChatGPT, Gemini, Claude, and Perplexity.',
};

export default async function LeaderboardPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: { id: string; name: string; domain: string; tier: string; brand_kit?: BrandKit } | null = null;

  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: dbProject } = await supabase
        .from('projects')
        .select('id, name, domain, tier, brand_kit')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (dbProject) {
        project = dbProject as any;
      }
    }
  }

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

  const finalProject = project || {
    id: 'demo-project-lululemon',
    name: 'Lululemon',
    domain: 'lululemon.com',
    tier: 'enterprise',
    brand_kit: {
      industry: 'Premium Athleisure & Athletic Apparel',
      target_audience: 'Fitness enthusiasts and premium athletic apparel shoppers',
      core_offerings: 'Yoga pants, activewear, technical athletic apparel',
      tone_of_voice: 'Inspiring, active, technical, mindful',
      competitors: [
        { name: 'Alo Yoga', domain: 'aloyoga.com' },
        { name: 'Vuori', domain: 'vuoriclothing.com' },
        { name: 'Athleta', domain: 'athleta.gap.com' },
      ],
    },
  };

  return (
    <AppSidebarLayout project={finalProject}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto">
        <LeaderboardClient />
      </div>
    </AppSidebarLayout>
  );
}
