import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { BrandKitView } from '@/components/brand-kit/brand-kit-view';
import type { BrandKit } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function BrandKitPage() {
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

  // 3. Fallback to default demo project (Lululemon)
  if (!project) {
    project = {
      id: 'demo-project-lululemon',
      name: 'Lululemon',
      domain: 'lululemon.com',
      tier: 'enterprise',
      audit_limit: 100,
      brand_kit: {
        industry: 'Retail, Apparel & Consumer Goods > Activewear & Athleisure',
        industry_taxonomy: {
          sector: 'Retail, Apparel & Consumer Goods',
          category: 'Activewear & Athleisure',
        },
        target_audience: 'Mindful movement practitioners, yoga & Pilates enthusiasts, and fitness lifestyle consumers',
        core_offerings: 'Premium Performance Activewear, Technical Outerwear, Everyday Movement Essentials',
        competitors: [
          { name: 'Alo Yoga', domain: 'aloyoga.com' },
          { name: 'Vuori', domain: 'vuoriclothing.com' },
          { name: 'Athleta', domain: 'athleta.gap.com' },
        ],
        target_regions: ['Global / Worldwide', 'North America (US & Canada)'],
        negative_keywords: ['fast fashion', 'cheap dupes', 'discount outlet', 'drop-shipping'],
        messaging_pillars: [
          'Proprietary Technical Fabric Innovation',
          'Mindful Movement & Wellness Community',
          'Elevated Performance Luxury',
          'Sustainable Longevity & Durability',
        ],
        tone_dimensions: {
          formal_casual: 45,
          technical_accessible: 70,
          bold_understated: 40,
          analytical_inspiring: 80,
        },
        tone_tags: ['Empowering', 'Mindful', 'Technical', 'Elevated'],
        tone_of_voice: 'Inspiring, elevated, technical, and mindful',
      },
    };
  }

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-8">
        {/* Page Header */}
        <div className="border-b border-zinc-200 pb-6 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              BRAND PROFILE CALIBRATION
            </span>
            <span className="text-zinc-300">&bull;</span>
            <span className="text-xs font-mono text-emerald-600 font-medium">Account Secured</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
            Brand Profile &amp; Identity
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Configure brand messaging, product categories, target regions, and tone guidelines used across all AI models.
          </p>
        </div>

        {/* Brand Kit Dedicated Studio */}
        <BrandKitView project={project} />
      </div>
    </AppSidebarLayout>
  );
}
