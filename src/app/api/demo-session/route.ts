import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const demoProject = {
    id: 'demo-project-lululemon',
    name: 'Lululemon',
    domain: 'lululemon.com',
    tier: 'enterprise',
    audit_limit: 100,
    brand_kit: {
      industry: 'Premium Athleisure & Athletic Apparel',
      target_audience: 'Mindful movement practitioners, yoga & Pilates enthusiasts, runners, gym-goers, and fitness lifestyle consumers',
      core_offerings: 'Align Pant (Nulu fabric), Define Jacket, Wunder Train tights, ABC Joggers, Everywhere Belt Bag & technical athleisure',
      competitors: [
        { name: 'Alo Yoga', domain: 'aloyoga.com' },
        { name: 'Vuori', domain: 'vuoriclothing.com' },
        { name: 'Athleta', domain: 'athleta.gap.com' },
      ],
      tone_of_voice: 'Empowering, Mindful, Elevated, Performance-Driven',
    },
    created_at: new Date().toISOString(),
  };

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  response.cookies.set('beacon_active_project', JSON.stringify(demoProject), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  response.cookies.set('beacon_demo_user', JSON.stringify({ email: 'demo@lululemon.com', id: 'demo-user-id' }), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  return response;
}
