import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has an existing project
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!projects || projects.length === 0) {
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
        }
      }

      if (next) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    }
  }

  // Return the user to login with an error message
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth-code-exchange-failed`);
}
