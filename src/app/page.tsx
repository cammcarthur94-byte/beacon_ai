import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. If Supabase configured, check active session
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect('/dashboard');
    }
  } else {
    // 2. Development mode fallback: check auth/demo cookies
    const demoCookie =
      cookieStore.get('beacon_auth_user') || cookieStore.get('beacon_demo_user');
    if (demoCookie?.value) {
      redirect('/dashboard');
    }
  }

  // Unauthenticated users are redirected directly to /login
  redirect('/login');
}
