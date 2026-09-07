import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Persona } from '@/types/database.types';
import {
  getLocalPersonas,
  saveLocalPersona,
  deleteLocalPersona,
} from '@/lib/personas-store';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { searchParams } = new URL(req.url);
    let projectId = searchParams.get('projectId');

    // Auto-resolve active project from cookie or auth if not explicitly provided
    if (!projectId) {
      const projectCookie = req.cookies.get('beacon_active_project');
      if (projectCookie?.value) {
        try {
          const parsed = JSON.parse(projectCookie.value);
          if (parsed?.id) projectId = parsed.id;
        } catch {}
      }
    }

    if (!projectId && supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: p } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (p?.id) projectId = p.id;
        }
      } catch {}
    }

    if (projectId && supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({ personas: data });
      }
    }

    // Local / fallback store:
    const localList = getLocalPersonas(projectId || undefined);
    return NextResponse.json({ personas: localList });
  } catch (error: any) {
    console.error('Failed to fetch personas:', error);
    return NextResponse.json({ personas: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      id: existingId,
      name,
      roleTitle = '',
      nameTitle = '',
      ageDemographics = '',
      background = '',
      goals = '',
      painPoints = '',
      informationSources = '',
      buyingObjections = '',
      toneTraits = [],
      projectId,
    } = body;

    let cleanName = (name || '').trim();
    let cleanRoleTitle = (roleTitle || '').trim();
    let cleanNameTitle = (nameTitle || '').trim();

    if (cleanNameTitle && !cleanName) {
      const commaIdx = cleanNameTitle.indexOf(',');
      if (commaIdx > -1) {
        cleanName = cleanNameTitle.slice(0, commaIdx).replace(/['"]/g, '').trim();
        cleanRoleTitle = cleanRoleTitle || cleanNameTitle.slice(commaIdx + 1).replace(/['"]/g, '').trim();
      } else {
        cleanName = cleanNameTitle.replace(/['"]/g, '').trim();
      }
    }

    let targetProjectId = projectId;
    if (!targetProjectId) {
      const projectCookie = req.cookies.get('beacon_active_project');
      if (projectCookie?.value) {
        try {
          const parsed = JSON.parse(projectCookie.value);
          if (parsed?.id) targetProjectId = parsed.id;
        } catch {}
      }
    }

    if (!cleanName && !cleanNameTitle) {
      return NextResponse.json(
        { error: 'Name/Title is required.' },
        { status: 400 }
      );
    }

    if (!targetProjectId) {
      targetProjectId = 'default-active-project';
    }

    if (!cleanNameTitle) {
      cleanNameTitle = cleanRoleTitle ? `"${cleanName}," ${cleanRoleTitle}` : cleanName;
    }

    // Auto-construct natural language buyer context
    const parts: string[] = [];
    parts.push(`Name/Title: ${cleanNameTitle}`);
    if (ageDemographics) parts.push(`Age & Demographics: ${ageDemographics}`);
    if (background) parts.push(`Background: ${background}`);
    if (goals) parts.push(`Goals: ${goals}`);
    if (painPoints) parts.push(`Pain Points: ${painPoints}`);
    if (informationSources) parts.push(`Information Sources: ${informationSources}`);
    if (buyingObjections) parts.push(`Buying Objections: ${buyingObjections}`);

    const systemPrompt = parts.join('\n');

    const supabase = createServiceClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const personaId = existingId || 'persona-' + Math.random().toString(36).substring(2, 9);

    const savedPersona: Persona = {
      id: personaId,
      project_id: targetProjectId,
      name: cleanName || cleanNameTitle,
      role_title: cleanRoleTitle,
      name_title: cleanNameTitle,
      age_demographics: ageDemographics,
      background,
      goals,
      pain_points: painPoints,
      information_sources: informationSources,
      buying_objections: buyingObjections,
      system_prompt: systemPrompt,
      tone_traits: toneTraits,
      is_system: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      if (existingId) {
        const { data, error } = await supabase
          .from('personas')
          .update({
            name: cleanName || cleanNameTitle,
            role_title: cleanRoleTitle,
            name_title: cleanNameTitle,
            age_demographics: ageDemographics,
            background,
            goals,
            pain_points: painPoints,
            information_sources: informationSources,
            buying_objections: buyingObjections,
            system_prompt: systemPrompt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingId)
          .eq('project_id', targetProjectId)
          .select('*')
          .single();

        if (error) {
          console.error('Supabase update persona error:', error);
          return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
        }
        if (data) {
          return NextResponse.json({ persona: data });
        }
      } else {
        const { data, error } = await supabase
          .from('personas')
          .insert({
            project_id: targetProjectId,
            name: cleanName || cleanNameTitle,
            role_title: cleanRoleTitle,
            name_title: cleanNameTitle,
            age_demographics: ageDemographics,
            background,
            goals,
            pain_points: painPoints,
            information_sources: informationSources,
            buying_objections: buyingObjections,
            system_prompt: systemPrompt,
            tone_traits: toneTraits,
            is_system: false,
            is_active: true,
          })
          .select('*')
          .single();

        if (error) {
          console.error('Supabase insert persona error:', error);
          return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
        }
        if (data) {
          return NextResponse.json({ persona: data });
        }
      }
    }

    // Save to local fallback cache
    saveLocalPersona(savedPersona, targetProjectId);

    return NextResponse.json({ persona: savedPersona });
  } catch (error: any) {
    console.error('Failed to create persona:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create buyer persona.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');

    if (!id || !projectId) {
      return NextResponse.json(
        { error: 'id and projectId are required to delete a persona.' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        console.warn('Supabase delete error:', error.message);
      }
    }

    deleteLocalPersona(id, projectId);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete persona:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete persona.' },
      { status: 500 }
    );
  }
}
