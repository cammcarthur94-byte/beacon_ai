import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { OutreachPitch, OutreachStage, OutreachPriority } from '@/types/database.types';

let demoPitchesStore: OutreachPitch[] = [];

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

    const projectId = project?.id || 'default-workspace-project';

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

    let filtered = demoPitchesStore.filter((p) => p.project_id === projectId || projectId === 'default-workspace-project');
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

    const projectId = project?.id || 'default-workspace-project';
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
