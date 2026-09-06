import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { CompetitorMappingClient } from '@/components/competitor-mapping/competitor-mapping-client';
import type { BrandKit } from '@/types/database.types';

export const metadata = {
  title: 'Competitor Comparison | Beacon',
  description: 'Monitor rival product catalogs, feature claims, and pricing tiers to see where AI models favor competing brands over yours.',
};

export default async function CompetitorMappingPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: { id: string; name: string; domain: string; tier: string; brand_kit?: BrandKit } | null = null;

  // 1. Fetch from Supabase
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

  // 2. Cookie fallback
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

  // 3. Demo fallback
  if (!project) {
    redirect('/onboarding');
  }

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto">
        <CompetitorMappingClient />
      </div>
    </AppSidebarLayout>
  );
}
