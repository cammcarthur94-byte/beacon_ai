'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import type {
  TeamMember,
  TeamInvitation,
  TeamMemberRole,
  RolePermissionsConfig,
} from '@/types/database.types';
import { DEFAULT_ROLE_PERMISSIONS } from '@/types/database.types';
import { hasPermission } from '@/lib/auth/permissions';

export interface InviteResult {
  success: boolean;
  error?: string;
  invite?: {
    id: string;
    email: string;
    role: TeamMemberRole;
    token: string;
    inviteLink: string;
  };
}

export interface WorkspaceTeamData {
  members: TeamMember[];
  invitations: TeamInvitation[];
  rolePermissionsConfig: RolePermissionsConfig;
  currentUserRole: TeamMemberRole;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'mem-1',
    email: 'cam@beaconmetrics.io',
    name: 'Cameron M.',
    role: 'owner',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face',
    lastActive: 'Active right now',
  },
  {
    id: 'mem-2',
    email: 'elena.rostova@lululemon.com',
    name: 'Elena Rostova',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&h=96&fit=crop&crop=face',
    lastActive: '2 hours ago',
  },
  {
    id: 'mem-3',
    email: 'david.chen@lululemon.com',
    name: 'David Chen',
    role: 'editor',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face',
    lastActive: 'Yesterday',
  },
  {
    id: 'mem-4',
    email: 'auditor.external@deloitte.com',
    name: 'Marcus Vance',
    role: 'viewer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face',
    lastActive: '3 days ago',
  },
];

const DEFAULT_INVITES: TeamInvitation[] = [
  {
    id: 'inv-1',
    email: 'sarah.marketing@lululemon.com',
    role: 'editor',
    status: 'pending',
    sentAt: 'Sep 2, 2026',
    token: 'inv-tok-demo-12345',
  },
];

/**
 * Fetch team members, pending invitations, and workspace permission matrix.
 */
export async function getWorkspaceTeamData(projectId: string): Promise<WorkspaceTeamData> {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let currentUserRole: TeamMemberRole = 'owner';
  let members: TeamMember[] = [];
  let invitations: TeamInvitation[] = [];
  let rolePermissionsConfig: RolePermissionsConfig = { ...DEFAULT_ROLE_PERMISSIONS };

  // Check active user cookie for role override if running in demo/multi-account test
  const activeUserCookie = cookieStore.get('beacon_active_user');
  if (activeUserCookie?.value) {
    try {
      const parsedUser = JSON.parse(activeUserCookie.value);
      if (parsedUser.role) currentUserRole = parsedUser.role;
    } catch {}
  }

  // 1. Fetch from Supabase Cloud if configured
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get project role permissions
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, user_id, role_permissions')
        .eq('id', projectId)
        .single();

      if (projectData?.role_permissions) {
        rolePermissionsConfig = projectData.role_permissions;
      }

      if (user) {
        if (projectData && projectData.user_id === user.id) {
          currentUserRole = 'owner';
        } else {
          // Check member role
          const { data: memberRecord } = await supabase
            .from('team_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();

          if (memberRecord?.role) {
            currentUserRole = memberRecord.role as TeamMemberRole;
          }
        }
      }

      // Fetch members
      const { data: dbMembers } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (dbMembers && dbMembers.length > 0) {
        members = dbMembers.map((m: any) => ({
          id: m.id,
          email: m.email,
          name: m.name,
          role: m.role as TeamMemberRole,
          avatarUrl: m.avatar_url,
          lastActive: m.last_active ? new Date(m.last_active).toLocaleDateString() : 'Recently',
          userId: m.user_id,
          projectId: m.project_id,
        }));
      }

      // Fetch invitations
      const { data: dbInvites } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (dbInvites && dbInvites.length > 0) {
        invitations = dbInvites.map((i: any) => ({
          id: i.id,
          email: i.email,
          role: i.role as TeamMemberRole,
          status: i.status as any,
          sentAt: new Date(i.created_at).toLocaleDateString(),
          token: i.token,
          projectId: i.project_id,
        }));
      }
    } catch (err) {
      console.error('Error fetching team from Supabase:', err);
    }
  }

  // 2. Fallback to cookie / demo workspace state
  if (members.length === 0) {
    const memCookie = cookieStore.get(`beacon_members_${projectId}`);
    if (memCookie?.value) {
      try {
        members = JSON.parse(memCookie.value);
      } catch {
        members = DEFAULT_MEMBERS;
      }
    } else {
      members = DEFAULT_MEMBERS;
    }
  }

  if (invitations.length === 0) {
    const invCookie = cookieStore.get(`beacon_invites_${projectId}`);
    if (invCookie?.value) {
      try {
        invitations = JSON.parse(invCookie.value);
      } catch {
        invitations = DEFAULT_INVITES;
      }
    } else {
      invitations = DEFAULT_INVITES;
    }
  }

  const permCookie = cookieStore.get(`beacon_permissions_${projectId}`);
  if (permCookie?.value) {
    try {
      rolePermissionsConfig = JSON.parse(permCookie.value);
    } catch {}
  }

  return {
    members,
    invitations,
    rolePermissionsConfig,
    currentUserRole,
  };
}

/**
 * Invite a new member with a specific role. Generates an invitation token and shareable link.
 */
export async function inviteTeamMember(
  projectId: string,
  email: string,
  role: TeamMemberRole
): Promise<InviteResult> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  // Generate secure 32-character hexadecimal token
  const token = crypto.randomBytes(16).toString('hex');
  const inviteLink = `${origin}/invite/${token}`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Supabase cloud persistence
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          project_id: projectId,
          email: cleanEmail,
          role,
          token,
          status: 'pending',
          invited_by: user?.id,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase invite insert error:', error);
      }
    } catch (e) {
      console.error('Error in inviteTeamMember cloud:', e);
    }
  }

  // Cookie persistence for seamless testing / offline demo
  const invCookieKey = `beacon_invites_${projectId}`;
  let currentInvites: TeamInvitation[] = [];
  const existing = cookieStore.get(invCookieKey);
  if (existing?.value) {
    try {
      currentInvites = JSON.parse(existing.value);
    } catch {
      currentInvites = [...DEFAULT_INVITES];
    }
  } else {
    currentInvites = [...DEFAULT_INVITES];
  }

  const newInvite: TeamInvitation = {
    id: `inv-${Date.now()}`,
    email: cleanEmail,
    role,
    status: 'pending',
    sentAt: 'Just now',
    token,
    projectId,
  };

  currentInvites = [newInvite, ...currentInvites.filter((i) => i.email !== cleanEmail)];
  cookieStore.set(invCookieKey, JSON.stringify(currentInvites), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  // Also save global invite mapping token -> invite metadata for /invite/[token] lookup
  cookieStore.set(`beacon_token_${token}`, JSON.stringify(newInvite), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  revalidatePath('/settings');
  return {
    success: true,
    invite: {
      id: newInvite.id,
      email: cleanEmail,
      role,
      token,
      inviteLink,
    },
  };
}

/**
 * Update a member's role assignment.
 */
export async function updateMemberRole(
  projectId: string,
  memberId: string,
  newRole: TeamMemberRole
) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const supabase = await createClient();
    await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('project_id', projectId);
  }

  const memCookieKey = `beacon_members_${projectId}`;
  let members: TeamMember[] = DEFAULT_MEMBERS;
  const existing = cookieStore.get(memCookieKey);
  if (existing?.value) {
    try {
      members = JSON.parse(existing.value);
    } catch {}
  }

  members = members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m));
  cookieStore.set(memCookieKey, JSON.stringify(members), { path: '/', maxAge: 60 * 60 * 24 * 30 });

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Remove a member from the workspace.
 */
export async function removeTeamMember(projectId: string, memberId: string) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const supabase = await createClient();
    await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId);
  }

  const memCookieKey = `beacon_members_${projectId}`;
  let members: TeamMember[] = DEFAULT_MEMBERS;
  const existing = cookieStore.get(memCookieKey);
  if (existing?.value) {
    try {
      members = JSON.parse(existing.value);
    } catch {}
  }

  members = members.filter((m) => m.id !== memberId);
  cookieStore.set(memCookieKey, JSON.stringify(members), { path: '/', maxAge: 60 * 60 * 24 * 30 });

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Revoke a pending invitation.
 */
export async function revokeTeamInvitation(projectId: string, invitationId: string) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const supabase = await createClient();
    await supabase
      .from('team_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)
      .eq('project_id', projectId);
  }

  const invCookieKey = `beacon_invites_${projectId}`;
  let invites: TeamInvitation[] = DEFAULT_INVITES;
  const existing = cookieStore.get(invCookieKey);
  if (existing?.value) {
    try {
      invites = JSON.parse(existing.value);
    } catch {}
  }

  invites = invites.filter((i) => i.id !== invitationId);
  cookieStore.set(invCookieKey, JSON.stringify(invites), { path: '/', maxAge: 60 * 60 * 24 * 30 });

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Save custom workspace Role-Based Access Control matrix.
 */
export async function updateRolePermissionsConfig(
  projectId: string,
  config: RolePermissionsConfig
) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Make sure owner retains all permissions
  const safeConfig: RolePermissionsConfig = {
    ...config,
    owner: [
      'manage_billing',
      'manage_team',
      'edit_brand_kit',
      'manage_prompts',
      'trigger_audits',
      'content_studio_pitches',
      'export_reports',
      'view_telemetry',
    ],
  };

  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const supabase = await createClient();
    await supabase
      .from('projects')
      .update({ role_permissions: safeConfig })
      .eq('id', projectId);
  }

  cookieStore.set(`beacon_permissions_${projectId}`, JSON.stringify(safeConfig), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath('/settings');
  return { success: true, config: safeConfig };
}

/**
 * Verify invitation token details for the acceptance screen.
 */
export async function getInvitationByToken(token: string) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let invitation: TeamInvitation | null = null;
  let brandName = 'Lululemon';
  let projectId = 'demo-project-id';

  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const supabase = await createClient();
    const { data: inviteRecord } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteRecord) {
      invitation = {
        id: inviteRecord.id,
        email: inviteRecord.email,
        role: inviteRecord.role as TeamMemberRole,
        status: inviteRecord.status as any,
        sentAt: new Date(inviteRecord.created_at).toLocaleDateString(),
        token: inviteRecord.token,
        projectId: inviteRecord.project_id,
      };

      if (inviteRecord.project_id) {
        projectId = inviteRecord.project_id;
        const { data: proj } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', inviteRecord.project_id)
          .single();
        if (proj?.name) {
          brandName = proj.name;
        }
      }
    }
  }

  // Fallback to cookie
  if (!invitation) {
    const tokenCookie = cookieStore.get(`beacon_token_${token}`);
    if (tokenCookie?.value) {
      try {
        invitation = JSON.parse(tokenCookie.value);
        if (invitation?.projectId) {
          projectId = invitation.projectId;
        }
      } catch {}
    }

    const activeProj = cookieStore.get('beacon_active_project');
    if (activeProj?.value) {
      try {
        const proj = JSON.parse(activeProj.value);
        brandName = proj.name || 'Lululemon';
        if (!invitation?.projectId) {
          projectId = proj.id || 'demo-project-id';
        }
      } catch {}
    }
  }

  return {
    invitation,
    brandName,
    projectId,
  };
}

/**
 * Accept an invitation, create/sign in the user, and assign them to the invited brand.
 */
export async function acceptTeamInvitation({
  token,
  fullName,
  password,
}: {
  token: string;
  fullName: string;
  password?: string;
}) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const { invitation, brandName, projectId } = await getInvitationByToken(token);

  if (!invitation) {
    return { success: false, error: 'Invalid, expired, or already accepted invitation link.' };
  }

  const email = invitation.email;

  // 1. Supabase Cloud user creation / enrollment
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const supabase = await createClient();
      if (password) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (signUpError && !signUpError.message.includes('already registered')) {
          return { success: false, error: signUpError.message };
        }
      }

      // Add to team_members table
      await supabase.from('team_members').insert({
        project_id: projectId,
        email,
        name: fullName,
        role: invitation.role,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      });

      // Mark invitation accepted
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('token', token);
    } catch (e: any) {
      console.error('Error enrolling member in Supabase:', e);
    }
  }

  // 2. Cookie persistence: enroll as active member in this brand workspace
  const memCookieKey = `beacon_members_${projectId}`;
  let currentMembers: TeamMember[] = DEFAULT_MEMBERS;
  const existing = cookieStore.get(memCookieKey);
  if (existing?.value) {
    try {
      currentMembers = JSON.parse(existing.value);
    } catch {}
  }

  const newMember: TeamMember = {
    id: `mem-${Date.now()}`,
    email,
    name: fullName,
    role: invitation.role,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
    lastActive: 'Active right now',
  };

  currentMembers.push(newMember);
  cookieStore.set(memCookieKey, JSON.stringify(currentMembers), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  // Set the invited brand as active project
  let activeProj: any = {
    id: projectId,
    name: brandName,
    domain: `${brandName.toLowerCase().replace(/\s+/g, '')}.com`,
    tier: 'growth',
  };
  const projCookie = cookieStore.get('beacon_active_project');
  if (projCookie?.value) {
    try {
      activeProj = JSON.parse(projCookie.value);
    } catch {}
  }
  cookieStore.set('beacon_active_project', JSON.stringify(activeProj), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  // Set active user session cookie with their assigned role and email
  cookieStore.set(
    'beacon_active_user',
    JSON.stringify({
      id: `user-${Date.now()}`,
      email,
      name: fullName,
      role: invitation.role,
      assignedBrandId: projectId,
    }),
    {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    }
  );

  // Store user's authorized brand IDs (tenant isolation: user ONLY has access to this brand)
  cookieStore.set(
    `beacon_user_brands_${encodeURIComponent(email)}`,
    JSON.stringify([{ id: projectId, name: brandName, role: invitation.role }]),
    {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    }
  );

  // Mark token accepted
  cookieStore.delete(`beacon_token_${token}`);

  return {
    success: true,
    projectId,
    brandName,
  };
}
