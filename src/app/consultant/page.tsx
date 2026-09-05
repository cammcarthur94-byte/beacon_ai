import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { ContentStudioClient } from '@/components/consultant/content-studio-client';
import type { BrandKit } from '@/types/database.types';

export const metadata = {
  title: 'AI Content Studio | Beacon',
  description: 'AI-powered content creation, 3-angle PR outreach email generator, and competitor positioning matrices.',
};

const DEMO_PROJECT = {
  id: 'demo-project-lululemon',
  name: 'Lululemon',
  domain: 'lululemon.com',
  tier: 'enterprise',
  brand_kit: {
    industry: 'Premium Athleisure & Athletic Apparel',
    target_audience:
      'Mindful movement practitioners, yoga & Pilates enthusiasts, runners, gym-goers, and fitness lifestyle consumers',
    core_offerings:
      'Align Pant (Nulu fabric), Define Jacket, Wunder Train tights, ABC Joggers, Everywhere Belt Bag & technical athleisure',
    competitors: [
      { name: 'Alo Yoga', domain: 'aloyoga.com' },
      { name: 'Vuori', domain: 'vuoriclothing.com' },
      { name: 'Athleta', domain: 'athleta.gap.com' },
    ],
    tone_of_voice: 'Empowering, Mindful, Elevated, Performance-Driven',
  } as BrandKit,
};

export default async function ConsultantPage() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');

  type ConsultantProject = {
    id: string;
    name: string;
    domain: string;
    tier: string;
    brand_kit: BrandKit;
  };

  let project: ConsultantProject | null = null;
  const supabase = supabaseConfigured ? await createClient() : null;

  if (supabase) {
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
        project = projects[0] as ConsultantProject;
      }
    }
  }

  // Demo mode fallback: reuse the shared active-project cookie.
  if (!project) {
    const activeProjectCookie = cookieStore.get('beacon_active_project')?.value;
    if (activeProjectCookie) {
      try {
        const parsed = JSON.parse(activeProjectCookie);
        if (parsed?.id && parsed?.brand_kit) {
          project = {
            id: parsed.id,
            name: parsed.name || 'Lululemon',
            domain: parsed.domain || 'lululemon.com',
            tier: parsed.tier || 'starter',
            brand_kit: parsed.brand_kit as BrandKit,
          };
        }
      } catch {
        project = null;
      }
    }
  }

  if (!project) {
    project = DEMO_PROJECT;
  }

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto">
        <ContentStudioClient
          brandName={project.name}
          brandDomain={project.domain}
          brandKit={project.brand_kit}
        />
      </div>
    </AppSidebarLayout>
  );
}
