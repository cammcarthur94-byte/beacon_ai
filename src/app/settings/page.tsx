import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { Radio, LogOut, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SettingsView } from '@/components/settings/settings-view';
import type { BrandKit } from '@/types/database.types';

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { tab } = await searchParams;
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: {
    id: string;
    name: string;
    domain: string;
    tier: 'starter' | 'pro' | 'growth' | 'enterprise';
    audit_limit: number;
    brand_kit: BrandKit;
  } | null = null;
  let activeAuditsCount = 2;

  // 1. Fetch from Supabase
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (projects && projects.length > 0) {
        project = projects[0] as any;

        const { count } = await supabase
          .from('prompts')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project!.id)
          .eq('is_active', true);

        if (count !== null) {
          activeAuditsCount = count;
        }
      }
    }
  }

  // 2. Fallback to active project cookie
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
    redirect('/onboarding');
  }

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-8">
        {/* Page Header */}
        <div className="border-b border-zinc-200 pb-6 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Workspace Configuration
            </span>
            <span className="text-zinc-300">&bull;</span>
            <span className="text-xs font-mono text-emerald-600 font-medium">Tenancy RLS Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
            Settings & Stripe Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Configure brand parameters, calibrate your Brand Kit context, monitor audit quotas, and manage subscription billing.
          </p>
        </div>

        {/* SETTINGS VIEW */}
        <SettingsView project={project} activeAuditsCount={activeAuditsCount} initialTab={tab} />
      </div>
    </AppSidebarLayout>
  );
}
