import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { ConsultantChat } from '@/components/chat/consultant-chat';
import type { BrandKit } from '@/types/database.types';
import {
  loadInitialChatMessages,
  loadUnreadAlerts,
} from '@/lib/consultant/chat-store';

export const metadata = {
  title: 'Beacon Sentinel | AI Co-worker',
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

  let initialMessages: Awaited<ReturnType<typeof loadInitialChatMessages>> = [];
  let unreadAlertCount = 0;

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

    if (project) {
      // Durable thread history + proactive alerts from the audit cron.
      initialMessages = await loadInitialChatMessages(supabase, project.id);
      const alerts = await loadUnreadAlerts(supabase, project.id);
      unreadAlertCount = alerts.length;

      if (alerts.length > 0) {
        // The cron alert is already part of initialMessages; keep it durable and
        // avoid mutating database state during a server render.
        unreadAlertCount = alerts.length;
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
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-6">
        <div className="border-b border-zinc-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                AI Co-worker
              </span>
              <span className="text-zinc-300">&bull;</span>
              <span className="text-xs font-mono text-emerald-600 font-medium">
                Sentinel Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
              Beacon Sentinel
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600">
              Proactive drop alerts, root-cause analytics, and on-demand content generation —
              grounded in the {project.name} brand kit.
            </p>
          </div>
        </div>

        <ConsultantChat
          workspace={{
            projectId: project.id,
            brandName: project.name,
            domain: project.domain,
            tier: project.tier,
          }}
          initialMessages={initialMessages}
          hasUnreadAlerts={unreadAlertCount > 0}
        />
      </div>
    </AppSidebarLayout>
  );
}
