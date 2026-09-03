'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { BrandKit } from '@/types/database.types';

const competitorSchema = z.object({
  name: z.string().min(1, 'Competitor name is required'),
  domain: z.string().min(1, 'Competitor domain is required'),
});

const onboardingSchema = z.object({
  brandName: z.string().min(2, 'Brand name must be at least 2 characters'),
  domain: z
    .string()
    .min(3, 'Domain is required')
    .transform((val) => val.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()),
  industry: z.string().min(2, 'Industry is required'),
  targetAudience: z.string().min(5, 'Target audience description is required'),
  coreOfferings: z.string().min(5, 'Core offerings description is required'),
  toneOfVoice: z.string().min(2, 'Tone of voice is required'),
  competitors: z.array(competitorSchema).min(1, 'Please add at least one competitor'),
});

export type OnboardingFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function createProjectWithBrandKit(
  payload: {
    brandName: string;
    domain: string;
    industry: string;
    targetAudience: string;
    coreOfferings: string;
    toneOfVoice: string;
    competitors: { name: string; domain: string }[];
  }
): Promise<OnboardingFormState> {
  const result = onboardingSchema.safeParse(payload);

  if (!result.success) {
    const errorMap = result.error.flatten().fieldErrors;
    const firstErrorMessage = Object.values(errorMap)[0]?.[0] || 'Please complete all required fields.';
    return {
      error: firstErrorMessage,
      fieldErrors: errorMap,
    };
  }

  const {
    brandName,
    domain,
    industry,
    targetAudience,
    coreOfferings,
    toneOfVoice,
    competitors,
  } = result.data;

  const brandKit: BrandKit = {
    industry,
    target_audience: targetAudience,
    core_offerings: coreOfferings,
    competitors,
    tone_of_voice: toneOfVoice,
  };

  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cookieStore = await cookies();

  // Fallback for local development if live credentials aren't set
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const mockProjectId = 'demo-project-' + Date.now();
    const demoProject = {
      id: mockProjectId,
      name: brandName,
      domain,
      tier: 'starter' as const,
      audit_limit: 20,
      brand_kit: brandKit,
      created_at: new Date().toISOString(),
    };

    cookieStore.set('beacon_active_project', JSON.stringify(demoProject), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect('/dashboard');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication required. Please sign in to create a project.' };
  }

  // Insert project with brand_kit
  const { data: newProject, error: insertError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: brandName,
      domain,
      tier: 'starter',
      audit_limit: 20,
      brand_kit: brandKit,
    })
    .select('id, name, domain, brand_kit')
    .single();

  if (insertError) {
    return { error: `Failed to save project: ${insertError.message}` };
  }

  cookieStore.set(
    'beacon_active_project',
    JSON.stringify({
      id: newProject.id,
      name: newProject.name,
      domain: newProject.domain,
      brand_kit: newProject.brand_kit,
    }),
    { path: '/', maxAge: 60 * 60 * 24 * 7 }
  );

  redirect('/dashboard');
}

export async function skipOnboardingAction(): Promise<OnboardingFormState> {
  const brandName = 'My Brand';
  const domain = 'example.com';
  const brandKit: BrandKit = {
    industry: 'Software & Technology',
    target_audience: 'Enterprise Buyers and Decision Makers',
    core_offerings: 'B2B Software & Cloud Intelligence',
    competitors: [{ name: 'Competitor A', domain: 'competitor.com' }],
    tone_of_voice: 'Authoritative',
  };

  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cookieStore = await cookies();

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    const demoProject = {
      id: 'demo-project-skipped',
      name: brandName,
      domain,
      tier: 'starter' as const,
      audit_limit: 20,
      brand_kit: brandKit,
      created_at: new Date().toISOString(),
    };

    cookieStore.set('beacon_active_project', JSON.stringify(demoProject), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect('/dashboard');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication required. Please sign in.' };
  }

  const { data: newProject, error: insertError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: brandName,
      domain,
      tier: 'starter',
      audit_limit: 20,
      brand_kit: brandKit,
    })
    .select('id, name, domain, brand_kit')
    .single();

  if (insertError) {
    return { error: `Failed to initialize project: ${insertError.message}` };
  }

  cookieStore.set(
    'beacon_active_project',
    JSON.stringify({
      id: newProject.id,
      name: newProject.name,
      domain: newProject.domain,
      brand_kit: newProject.brand_kit,
    }),
    { path: '/', maxAge: 60 * 60 * 24 * 7 }
  );

  redirect('/dashboard');
}
