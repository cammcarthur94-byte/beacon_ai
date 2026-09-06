'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export interface AuthActionResult {
  error?: string;
  success?: string;
}

const DEFAULT_DEMO_PROJECT = {
  id: 'demo-project-lululemon',
  name: 'Lululemon',
  domain: 'lululemon.com',
  tier: 'enterprise' as const,
  audit_limit: 100,
  brand_kit: {
    industry: 'Premium Athleisure & Athletic Apparel',
    industry_taxonomy: {
      sector: 'Apparel & Fashion',
      category: 'Athleisure & Sporting Goods',
    },
    target_audience: 'Mindful movement practitioners, yoga & Pilates enthusiasts, runners, gym-goers, and fitness lifestyle consumers',
    core_offerings: 'Align Pant (Nulu fabric), Define Jacket, Wunder Train tights, ABC Joggers, Everywhere Belt Bag & technical athleisure',
    competitors: [
      { name: 'Alo Yoga', domain: 'aloyoga.com' },
      { name: 'Vuori', domain: 'vuoriclothing.com' },
      { name: 'Athleta', domain: 'athleta.gap.com' },
    ],
    tone_of_voice: 'Empowering, Mindful, Elevated, Performance-Driven',
    messaging_pillars: [
      'Innovation & Material Superiority',
      'Data-Driven Fit & Athletic Performance',
      'Community & Holistic Wellness',
    ],
  },
  created_at: new Date().toISOString(),
};

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
    const cookieStore = await cookies();
    const userPayload = JSON.stringify({
      email,
      fullName: email.split('@')[0],
      id: 'user-' + Buffer.from(email).toString('hex').slice(0, 10),
    });
    cookieStore.set('beacon_demo_user', userPayload, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set('beacon_auth_user', userPayload, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Ensure active project exists so dashboard loads smoothly
    const activeProject = cookieStore.get('beacon_active_project');
    if (!activeProject) {
      cookieStore.set('beacon_active_project', JSON.stringify(DEFAULT_DEMO_PROJECT), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
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
    const cookieStore = await cookies();
    const userPayload = JSON.stringify({
      email,
      fullName: fullName || email.split('@')[0],
      id: 'user-' + Date.now(),
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
    const cookieStore = await cookies();
    const userPayload = JSON.stringify({
      email: 'demo.founder@company.ai',
      fullName: 'Demo Founder',
      id: 'demo-user-id',
    });
    cookieStore.set('beacon_demo_user', userPayload, { path: '/', maxAge: 60 * 60 * 24 * 7 });
    cookieStore.set('beacon_auth_user', userPayload, { path: '/', maxAge: 60 * 60 * 24 * 7 });

    const activeProject = cookieStore.get('beacon_active_project');
    if (!activeProject) {
      cookieStore.set('beacon_active_project', JSON.stringify(DEFAULT_DEMO_PROJECT), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
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
  cookieStore.set('beacon_active_project', JSON.stringify(DEFAULT_DEMO_PROJECT), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  const demoUser = JSON.stringify({
    email: 'demo@lululemon.com',
    fullName: 'Lululemon Brand Director',
    id: 'demo-user-id',
  });
  cookieStore.set('beacon_demo_user', demoUser, { path: '/', maxAge: 60 * 60 * 24 * 7 });
  cookieStore.set('beacon_auth_user', demoUser, { path: '/', maxAge: 60 * 60 * 24 * 7 });

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

