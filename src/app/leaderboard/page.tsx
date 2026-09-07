import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { LeaderboardClient } from '@/components/leaderboard/leaderboard-client';
import type { BrandKit } from '@/types/database.types';
import { parseActiveProjectCookie, isLegacyMockProject } from '@/lib/project-utils';

export const metadata = {
  title: 'Market Share Leaderboard | Beacon',
  description: 'AI Search Visibility and Competitor Recommendation Rate Tracking across ChatGPT, Gemini, Claude, and Perplexity.',
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

      if (dbProject && !isLegacyMockProject(dbProject)) {
        project = dbProject as any;
      }
    }
  }

  if (!project) {
    const projectCookie = cookieStore.get('beacon_active_project');
    if (projectCookie?.value) {
      project = parseActiveProjectCookie(projectCookie.value);
    }
  }

  if (!project) {
    redirect('/onboarding');
  }

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto">
        <LeaderboardClient />
      </div>
    </AppSidebarLayout>
  );
}
