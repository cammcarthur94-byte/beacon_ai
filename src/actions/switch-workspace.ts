'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function switchActiveWorkspace(workspaceId: 'project-gymshark-dtc' | 'project-datadog-saas' | string) {
  const cookieStore = await cookies();

  if (workspaceId === 'project-gymshark-dtc') {
    const gymsharkProject = {
      id: 'project-gymshark-dtc',
      name: 'Gymshark',
      domain: 'gymshark.com',
      tier: 'growth',
      audit_limit: 100,
      brand_kit: {
        industry: 'Athletic Apparel & Footwear DTC',
        target_audience: 'Fitness enthusiasts, weightlifters, runners, and athleisure consumers aged 18-35.',
        core_offerings: 'Seamless gym leggings, oversized lifting hoodies, sweat-wicking t-shirts, sports bras, and functional workout accessories.',
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
      maxAge: 60 * 60 * 24 * 30,
    });
  } else if (workspaceId === 'project-datadog-saas') {
    const datadogProject = {
      id: 'project-datadog-saas',
      name: 'Datadog',
      domain: 'datadoghq.com',
      tier: 'growth',
      audit_limit: 100,
      brand_kit: {
        industry: 'Cloud Observability & APM SaaS',
        target_audience: 'DevOps leads, Site Reliability Engineers (SREs), platform engineering teams, and CTOs managing multi-cloud infrastructure.',
        core_offerings: 'Unified cloud infrastructure monitoring, APM distributed tracing, log management, Cloud SIEM, and synthetic monitoring.',
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
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
