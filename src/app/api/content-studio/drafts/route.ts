import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { ContentDraft } from '@/types/database.types';

// In-memory fallback store for demo mode
let demoDraftsStore: ContentDraft[] = [];

export async function GET(request: NextRequest) {
  try {
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

    // Query Supabase if active
    if (supabaseUrl && !supabaseUrl.includes('placeholder') && project?.id) {
      const { data, error } = await (supabase as any)
        .from('content_drafts')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({
          success: true,
          drafts: data,
          count: data.length,
        });
      }
    }

    // Fallback to in-memory store
    const filtered = demoDraftsStore.filter(
      (d) => d.project_id === projectId || projectId === 'default-workspace-project'
    );

    return NextResponse.json({
      success: true,
      drafts: filtered,
      count: filtered.length,
    });
  } catch (error: any) {
    console.error('Error in /api/content-studio/drafts GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      gapId = null,
      targetDomain,
      targetTopic,
      competitors = [],
      contentType,
      angleTitle,
      content,
    } = body;

    if (!targetDomain || !contentType || !angleTitle || !content) {
      return NextResponse.json(
        { success: false, error: 'targetDomain, contentType, angleTitle, and content are required' },
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

    const newDraft: ContentDraft = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      project_id: projectId,
      gap_id: gapId || null,
      target_domain: targetDomain,
      target_topic: targetTopic,
      competitors: Array.isArray(competitors) ? competitors : [competitors],
      content_type: contentType,
      angle_title: angleTitle,
      content: content,
      created_at: now,
      updated_at: now,
    };

    // Try Supabase insert
    if (supabaseUrl && !supabaseUrl.includes('placeholder') && project?.id) {
      try {
        const { data, error } = await (supabase as any)
          .from('content_drafts')
          .insert({
            project_id: projectId,
            gap_id: newDraft.gap_id,
            target_domain: newDraft.target_domain,
            target_topic: newDraft.target_topic,
            competitors: newDraft.competitors,
            content_type: newDraft.content_type,
            angle_title: newDraft.angle_title,
            content: newDraft.content,
          })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, draft: data });
        }
      } catch (err) {
        console.warn('Failed to insert content draft into Supabase, saving to in-memory store:', err);
      }
    }

    demoDraftsStore.unshift(newDraft);

    return NextResponse.json({ success: true, draft: newDraft });
  } catch (error: any) {
    console.error('Error in /api/content-studio/drafts POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Draft id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        await (supabase as any).from('content_drafts').delete().eq('id', id);
      } catch (err) {
        console.warn('Failed to delete draft from Supabase:', err);
      }
    }

    demoDraftsStore = demoDraftsStore.filter((d) => d.id !== id);

    return NextResponse.json({ success: true, message: 'Draft deleted successfully' });
  } catch (error: any) {
    console.error('Error in /api/content-studio/drafts DELETE:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
