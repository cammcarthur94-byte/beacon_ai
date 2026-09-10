'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { parseActiveProjectCookie } from '@/lib/project-utils';

export interface AuthActionResult {
  error?: string;
  success?: string;
}

export async function signInWithEmail(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please provide both email and password.' };
  }

  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Fallback for local development if Supabase cloud isn't connected yet
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Authentication service is not configured.' };
    }
    const cookieStore = await cookies();
    const demoUserPayload = JSON.stringify({
      email,
      id: 'demo-user-id',
    });
    const authUserPayload = JSON.stringify({
      email,
      fullName: email.split('@')[0],
      id: 'demo-user-id',
    });
    cookieStore.set('beacon_demo_user', demoUserPayload, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set('beacon_auth_user', authUserPayload, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    const norm = (email || '').toLowerCase().trim();

    // Auto-restore Gymshark workspace
    if (norm.includes('gymshark')) {
      const gymsharkProject = {
        id: 'project-gymshark-dtc',
        name: 'Gymshark',
        domain: 'gymshark.com',
        tier: 'starter',
        brand_kit: {
          industry: 'DTC Athletic Apparel & Fitness Wear',
          target_audience:
            'Fitness enthusiasts, weightlifters, and gym-goers seeking functional, high-durability performance activewear and lifting gear.',
          core_offerings:
            'Seamless gym leggings, oversized lifting hoodies, sweat-wicking t-shirts, sports bras, and functional workout accessories.',
          tone_of_voice: 'Authoritative & Direct',
          competitors: [
            { name: 'Lululemon', domain: 'lululemon.com' },
            { name: 'Nike Training', domain: 'nike.com' },
            { name: 'Alo Yoga', domain: 'aloyoga.com' },
          ],
        },
      };
      cookieStore.set('beacon_active_project', JSON.stringify(gymsharkProject), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      const gymsharkPrompts = [
        {
          id: 'prompt-gymshark-1',
          project_id: 'project-gymshark-dtc',
          query_text: 'Is Gymshark seamless legging quality worth the price compared to Lululemon Align?',
          frequency: 'daily',
          target_engines: ['gemini', 'claude'],
          search_intent: 'commercial',
          brand_association: 'branded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 86400000).toISOString(),
          latest_score: 88,
        },
        {
          id: 'prompt-gymshark-2',
          project_id: 'project-gymshark-dtc',
          query_text: "What are the best sweat-wicking t-shirts for heavy lifting sessions that won't show sweat marks?",
          frequency: 'daily',
          target_engines: ['gemini', 'claude'],
          search_intent: 'informational',
          brand_association: 'unbranded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 86400000).toISOString(),
          latest_score: 84,
        },
        {
          id: 'prompt-gymshark-3',
          project_id: 'project-gymshark-dtc',
          query_text: 'Buy Gymshark oversized lifting hoodie for men - best colorways for fall?',
          frequency: 'daily',
          target_engines: ['gemini', 'claude'],
          search_intent: 'transactional',
          brand_association: 'branded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 86400000).toISOString(),
          latest_score: 91,
        },
        {
          id: 'prompt-gymshark-4',
          project_id: 'project-gymshark-dtc',
          query_text: 'How do Gymshark sizes compare to Nike for lifting gear?',
          frequency: 'weekly',
          target_engines: ['gemini', 'claude'],
          search_intent: 'commercial',
          brand_association: 'branded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 604800000).toISOString(),
          latest_score: 86,
        },
        {
          id: 'prompt-gymshark-5',
          project_id: 'project-gymshark-dtc',
          query_text: 'What gym wear brands offer the most durable performance leggings for squats?',
          frequency: 'daily',
          target_engines: ['gemini', 'claude'],
          search_intent: 'informational',
          brand_association: 'unbranded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 86400000).toISOString(),
          latest_score: 89,
        },
      ];
      cookieStore.set('beacon_demo_prompts', JSON.stringify(gymsharkPrompts), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      redirect('/dashboard');
    }

    // Auto-restore Datadog workspace
    if (norm.includes('datadog')) {
      const datadogProject = {
        id: 'project-datadog-saas',
        name: 'Datadog',
        domain: 'datadoghq.com',
        tier: 'starter',
        brand_kit: {
          industry: 'Cloud Observability & APM SaaS',
          target_audience:
            'DevOps leads, Site Reliability Engineers (SREs), platform engineering teams, and CTOs managing scalable multi-cloud infrastructure.',
          core_offerings:
            'Unified cloud infrastructure monitoring, APM distributed tracing, log management, Cloud SIEM, and synthetic monitoring for microservices.',
          tone_of_voice: 'Technical & Precise',
          competitors: [
            { name: 'Dynatrace', domain: 'dynatrace.com' },
            { name: 'New Relic', domain: 'newrelic.com' },
            { name: 'Splunk', domain: 'splunk.com' },
          ],
        },
      };
      cookieStore.set('beacon_active_project', JSON.stringify(datadogProject), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      const datadogPrompts = [
        {
          id: 'prompt-datadog-1',
          project_id: 'project-datadog-saas',
          query_text:
            'Datadog vs New Relic vs Dynatrace for monitoring microservices in a multi-cloud environment',
          frequency: 'daily',
          target_engines: ['gemini', 'claude'],
          search_intent: 'commercial',
          brand_association: 'branded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 86400000).toISOString(),
          latest_score: 92,
        },
        {
          id: 'prompt-datadog-2',
          project_id: 'project-datadog-saas',
          query_text: 'How do I calculate the total cost of ownership for Datadog log management at scale?',
          frequency: 'daily',
          target_engines: ['gemini', 'claude'],
          search_intent: 'informational',
          brand_association: 'branded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 86400000).toISOString(),
          latest_score: 87,
        },
        {
          id: 'prompt-datadog-3',
          project_id: 'project-datadog-saas',
          query_text: 'What are the best observability platforms for Kubernetes-native environments?',
          frequency: 'daily',
          target_engines: ['gemini', 'claude'],
          search_intent: 'commercial',
          brand_association: 'unbranded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 86400000).toISOString(),
          latest_score: 90,
        },
        {
          id: 'prompt-datadog-4',
          project_id: 'project-datadog-saas',
          query_text: 'How to implement Datadog synthetic monitoring for complex user journeys',
          frequency: 'weekly',
          target_engines: ['gemini', 'claude'],
          search_intent: 'transactional',
          brand_association: 'branded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 604800000).toISOString(),
          latest_score: 88,
        },
        {
          id: 'prompt-datadog-5',
          project_id: 'project-datadog-saas',
          query_text: 'Can I replace my SIEM and APM tools with a single unified observability platform?',
          frequency: 'daily',
          target_engines: ['gemini', 'claude'],
          search_intent: 'informational',
          brand_association: 'unbranded',
          is_active: true,
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + 86400000).toISOString(),
          latest_score: 85,
        },
      ];
      cookieStore.set('beacon_demo_prompts', JSON.stringify(datadogPrompts), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      redirect('/dashboard');
    }

    // Default fallback: check active project cookie
    const activeProject = cookieStore.get('beacon_active_project');
    const parsed = parseActiveProjectCookie(activeProject?.value);
    if (!parsed) {
      cookieStore.delete('beacon_active_project');
      redirect('/onboarding');
    }

    redirect('/dashboard');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Check if user has an existing project
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', data.user.id)
      .limit(1);

    if (!projects || projects.length === 0) {
      redirect('/onboarding');
    } else {
      redirect('/dashboard');
    }
  }

  redirect('/dashboard');
}

export async function signUpWithEmail(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Fallback for local development
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Authentication service is not configured.' };
    }
    const cookieStore = await cookies();
    const userPayload = JSON.stringify({
      email,
      fullName: fullName || email.split('@')[0],
      id: 'demo-user-id',
    });
    cookieStore.set('beacon_demo_user', userPayload, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set('beacon_auth_user', userPayload, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Purge any stale active project and mock prompts so user starts with a clean slate
    cookieStore.delete('beacon_active_project');
    cookieStore.delete('beacon_demo_prompts');
    redirect('/onboarding');
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect('/onboarding');
  }

  return {
    success: 'Confirmation link sent! Please check your email to verify your account.',
  };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    if (process.env.NODE_ENV === 'production') {
      redirect(`/login?error=${encodeURIComponent('Authentication service is not configured.')}`);
    }
    const cookieStore = await cookies();
    const userPayload = JSON.stringify({
      email: 'demo.founder@company.ai',
      fullName: 'Demo Founder',
      id: 'demo-user-id',
    });
    cookieStore.set('beacon_demo_user', userPayload, { path: '/', maxAge: 60 * 60 * 24 * 7 });
    cookieStore.set('beacon_auth_user', userPayload, { path: '/', maxAge: 60 * 60 * 24 * 7 });

      const activeProject = cookieStore.get('beacon_active_project');
    const parsed = parseActiveProjectCookie(activeProject?.value);
    if (!parsed) {
      cookieStore.delete('beacon_active_project');
      redirect('/onboarding');
    }

    redirect('/dashboard');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }
}

export async function signInAsDemo() {
  const cookieStore = await cookies();

  const demoUser = JSON.stringify({
    email: 'workspace.director@brand.com',
    fullName: 'Brand Director',
    id: 'user-' + Date.now(),
  });
  cookieStore.set('beacon_demo_user', demoUser, { path: '/', maxAge: 60 * 60 * 24 * 7 });
  cookieStore.set('beacon_auth_user', demoUser, { path: '/', maxAge: 60 * 60 * 24 * 7 });

  const activeProject = cookieStore.get('beacon_active_project');
  const parsed = parseActiveProjectCookie(activeProject?.value);
  if (!parsed) {
    cookieStore.delete('beacon_active_project');
    redirect('/onboarding');
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  cookieStore.delete('beacon_demo_user');
  cookieStore.delete('beacon_auth_user');
  cookieStore.delete('beacon_active_project');
  cookieStore.delete('beacon_demo_prompts');

  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out errors if already unauthenticated
  }

  redirect('/login');
}

