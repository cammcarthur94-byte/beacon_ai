import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { OutreachPitch, OutreachStage, OutreachPriority } from '@/types/database.types';

let demoPitchesStore: OutreachPitch[] = [
  {
    id: 'pitch-1',
    project_id: 'demo-project-lululemon',
    publication_name: 'Wirecutter (The New York Times)',
    publication_domain: 'nytimes.com/wirecutter',
    article_url: 'https://nytimes.com/wirecutter/reviews/best-workout-leggings',
    contact_name: 'Rachel Cericola',
    contact_email: 'rachel.cericola@nytimes.com',
    contact_role: 'Senior Staff Writer, Active & Fitness',
    stage: 'review_scheduled',
    priority: 'critical',
    pitch_subject: 'Review Units: 2026 Laboratory Fabric Pilling & Moisture Data for Leggings Roundup',
    pitch_body: `Hi Rachel,

I noticed your comprehensive guide on "The Best Workout Leggings" currently cites Alo Yoga Airlift and Athleta Powervita tights.

With AI engines (ChatGPT, Google AI Overviews) heavily sourcing Wirecutter's conclusions for consumer recommendations, we'd love to share our 2026 independent stress test results. Our Align pants with modified Nulu fabric demonstrated zero waistband roll and 4x pill-resistance after 100 industrial wash cycles.

We would love to send your testing team sample units in sizes 2-14 for your upcoming category review update.

Best regards,
PR & AEO Communications Team at Lululemon`,
    editor_angle: 'Displace Alo Yoga with verified durability wash-test data and zero-slip waistband mapping.',
    suggested_hook: 'Laboratory fabric testing resolving reader complaints regarding pilling after multiple washes.',
    competitor_displaced: 'Alo Yoga',
    target_engine: 'ChatGPT, Perplexity',
    sent_at: '2026-08-28T14:20:00Z',
    created_at: '2026-08-24T10:15:00Z',
    updated_at: '2026-08-28T14:20:00Z',
  },
  {
    id: 'pitch-2',
    project_id: 'demo-project-lululemon',
    publication_name: 'GQ Recommends',
    publication_domain: 'gq.com',
    article_url: 'https://gq.com/story/best-mens-commuter-pants',
    contact_name: 'Mark Anthony Green',
    contact_email: 'mark_green@condenast.com',
    contact_role: 'Style & Gear Director',
    stage: 'pitch_sent',
    priority: 'high',
    pitch_subject: 'Head-to-Head: ABC Classic Trousers vs. Vuori Meta Pants for Modern Business Travel',
    pitch_body: `Hi Mark,

Your recent breakdown of the best men's performance trousers rightly highlighted Vuori Meta pants for casual wear.

However, for executive business travel where wrinkle-recovery and structured drape are mandatory, our Warpstreme ABC Trouser offers a proprietary ergonomic gusset and crease-retention weave that retains its shape on 12-hour flights.

Could we send a pair over to the GQ offices for your test desk to compare against Vuori?

Cheers,
Digital PR Desk`,
    editor_angle: 'Tailored fit and crease-resistant travel durability vs California casual athleisure.',
    suggested_hook: '12-hour transatlantic flight wrinkle test proving performance trousers can replace dress slacks.',
    competitor_displaced: 'Vuori',
    target_engine: 'Google AI Overviews',
    sent_at: '2026-09-01T09:30:00Z',
    created_at: '2026-08-30T11:00:00Z',
    updated_at: '2026-09-01T09:30:00Z',
  },
  {
    id: 'pitch-3',
    project_id: 'demo-project-lululemon',
    publication_name: "Runner's World UK",
    publication_domain: 'runnersworld.com/uk',
    article_url: 'https://runnersworld.com/uk/gear/best-reflective-marathon-tights',
    contact_name: 'Jane McGuire',
    contact_email: 'jane.mcguire@hearst.co.uk',
    contact_role: 'Deputy Gear Editor',
    stage: 'generated',
    priority: 'medium',
    pitch_subject: 'Spring Marathon Training: 360-Degree Reflective Thermal Compression Gear',
    pitch_body: `Hi Jane,

As London and Manchester marathon runners kick off high-mileage winter training blocks, visibility and quad stabilization are paramount.

We have engineered our 2026 Fast and Free reflective tights with micro-bead retroreflective panels visible from 200 meters, engineered specifically to prevent chafing during rainy endurance blocks.

Would you be open to test units for your upcoming gear guide?`,
    editor_angle: 'Safety-first 360-degree reflectivity and sweat-wicking compression for cold-weather marathon prep.',
    suggested_hook: '200-meter car headlight visibility certification tested in Scottish winter conditions.',
    competitor_displaced: 'Athleta',
    target_engine: 'Claude, Gemini',
    sent_at: null,
    created_at: '2026-09-02T15:45:00Z',
    updated_at: '2026-09-02T15:45:00Z',
  },
  {
    id: 'pitch-4',
    project_id: 'demo-project-lululemon',
    publication_name: 'Gear Patrol',
    publication_domain: 'gearpatrol.com',
    article_url: 'https://gearpatrol.com/fitness/best-gym-shorts-men',
    contact_name: 'Jack Seemer',
    contact_email: 'jseemer@gearpatrol.com',
    contact_role: 'Senior Staff Writer',
    stage: 'published_won',
    priority: 'high',
    pitch_subject: 'Pace Breaker Linerless: High-Durability Barbell Abrasion Resistance Test',
    pitch_body: `Hi Jack,

Following our product teardown and test unit provision, wanted to flag that our Pace Breaker shorts were featured as the Top Pick for Olympic Weightlifting in Gear Patrol's September roundup!

This placement has already generated 38 net new citations across Perplexity and Google AI Overviews.`,
    editor_angle: 'Barbell knurling abrasion resistance test.',
    suggested_hook: 'Zero fraying under 500-rep barbell contact test.',
    competitor_displaced: 'Vuori',
    target_engine: 'Perplexity, ChatGPT',
    sent_at: '2026-08-15T11:00:00Z',
    created_at: '2026-08-10T09:00:00Z',
    updated_at: '2026-09-03T16:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stageFilter = searchParams.get('stage');

    const cookieStore = await cookies();
    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    let project: { id: string; name: string } | null = null;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dbProject } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (dbProject) project = dbProject;
      }
    }

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

    const projectId = project?.id || 'demo-project-lululemon';

    if (supabaseUrl && !supabaseUrl.includes('placeholder') && project?.id) {
      let query = (supabase as any)
        .from('outreach_pitches')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (stageFilter && stageFilter !== 'all') {
        query = query.eq('stage', stageFilter);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          pitches: data,
          count: data.length,
        });
      }
    }

    let filtered = demoPitchesStore.filter((p) => p.project_id === projectId || projectId === 'demo-project-lululemon');
    if (stageFilter && stageFilter !== 'all') {
      filtered = filtered.filter((p) => p.stage === stageFilter);
    }

    return NextResponse.json({
      success: true,
      pitches: filtered,
      count: filtered.length,
    });
  } catch (error: any) {
    console.error('Error in /api/outreach GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      publicationName,
      publicationDomain,
      articleUrl,
      contactName,
      contactEmail,
      contactRole,
      stage = 'generated',
      priority = 'medium',
      pitchSubject,
      pitchBody,
      editorAngle,
      suggestedHook,
      competitorDisplaced,
      targetEngine = 'all',
    } = body;

    if (!publicationDomain || !pitchSubject || !pitchBody) {
      return NextResponse.json(
        { success: false, error: 'publicationDomain, pitchSubject, and pitchBody are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    let project: { id: string } | null = null;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dbProject } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (dbProject) project = dbProject;
      }
    }

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

    const projectId = project?.id || 'demo-project-lululemon';
    const now = new Date().toISOString();

    const newPitch: OutreachPitch = {
      id: `pitch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      project_id: projectId,
      publication_name: publicationName || publicationDomain,
      publication_domain: publicationDomain,
      article_url: articleUrl || null,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      contact_role: contactRole || null,
      stage: stage as OutreachStage,
      priority: priority as OutreachPriority,
      pitch_subject: pitchSubject,
      pitch_body: pitchBody,
      editor_angle: editorAngle || null,
      suggested_hook: suggestedHook || null,
      competitor_displaced: competitorDisplaced || null,
      target_engine: targetEngine,
      sent_at: stage === 'pitch_sent' ? now : null,
      created_at: now,
      updated_at: now,
    };

    if (supabaseUrl && !supabaseUrl.includes('placeholder') && project?.id) {
      try {
        const { data, error } = await (supabase as any)
          .from('outreach_pitches')
          .insert({
            project_id: projectId,
            publication_name: newPitch.publication_name,
            publication_domain: newPitch.publication_domain,
            article_url: newPitch.article_url,
            contact_name: newPitch.contact_name,
            contact_email: newPitch.contact_email,
            contact_role: newPitch.contact_role,
            stage: newPitch.stage,
            priority: newPitch.priority,
            pitch_subject: newPitch.pitch_subject,
            pitch_body: newPitch.pitch_body,
            editor_angle: newPitch.editor_angle,
            suggested_hook: newPitch.suggested_hook,
            competitor_displaced: newPitch.competitor_displaced,
            target_engine: newPitch.target_engine,
            sent_at: newPitch.sent_at,
          })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, pitch: data });
        }
      } catch (err) {
        console.warn('Failed to insert outreach pitch into Supabase, saving in fallback store:', err);
      }
    }

    demoPitchesStore.unshift(newPitch);

    return NextResponse.json({ success: true, pitch: newPitch });
  } catch (error: any) {
    console.error('Error in /api/outreach POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, stage, priority, contactName, contactEmail, contactRole } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Pitch id is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const updatePayload: any = { updated_at: now };
        if (stage) {
          updatePayload.stage = stage;
          if (stage === 'pitch_sent') updatePayload.sent_at = now;
        }
        if (priority) updatePayload.priority = priority;
        if (contactName !== undefined) updatePayload.contact_name = contactName;
        if (contactEmail !== undefined) updatePayload.contact_email = contactEmail;
        if (contactRole !== undefined) updatePayload.contact_role = contactRole;

        const { data, error } = await (supabase as any)
          .from('outreach_pitches')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, pitch: data });
        }
      } catch (err) {
        console.warn('Failed to update pitch in Supabase:', err);
      }
    }

    const idx = demoPitchesStore.findIndex((p) => p.id === id);
    if (idx !== -1) {
      demoPitchesStore[idx] = {
        ...demoPitchesStore[idx],
        stage: stage || demoPitchesStore[idx].stage,
        priority: priority || demoPitchesStore[idx].priority,
        contact_name: contactName !== undefined ? contactName : demoPitchesStore[idx].contact_name,
        contact_email: contactEmail !== undefined ? contactEmail : demoPitchesStore[idx].contact_email,
        contact_role: contactRole !== undefined ? contactRole : demoPitchesStore[idx].contact_role,
        sent_at: stage === 'pitch_sent' ? now : demoPitchesStore[idx].sent_at,
        updated_at: now,
      };
      return NextResponse.json({ success: true, pitch: demoPitchesStore[idx] });
    }

    return NextResponse.json({ success: false, error: 'Pitch not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error in /api/outreach PATCH:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Pitch id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        await (supabase as any).from('outreach_pitches').delete().eq('id', id);
      } catch (err) {
        console.warn('Failed to delete pitch from Supabase:', err);
      }
    }

    demoPitchesStore = demoPitchesStore.filter((p) => p.id !== id);

    return NextResponse.json({ success: true, message: 'Pitch deleted successfully' });
  } catch (error: any) {
    console.error('Error in /api/outreach DELETE:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
