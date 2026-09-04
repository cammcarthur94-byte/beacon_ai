import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  inviteTeamMember,
  getInvitationByToken,
  acceptTeamInvitation,
  updateRolePermissionsConfig,
} from './team-actions';
import { hasPermission } from '@/lib/auth/permissions';
import { RolePermissionsConfig } from '@/types/database.types';

// Mock next/headers
const cookieStore = new Map<string, any>();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => cookieStore.get(key),
    set: (key: string, val: any) => cookieStore.set(key, { value: val }),
    delete: (key: string) => cookieStore.delete(key),
  })),
  headers: vi.fn(async () => ({
    get: (name: string) => (name === 'host' ? 'localhost:3000' : null),
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Team Member Invitation & RBAC Flow', () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  it('generates an invitation with a secure token and shareable link', async () => {
    const res = await inviteTeamMember('proj-123', 'newuser@tenant.com', 'editor');
    expect(res.success).toBe(true);
    expect(res.invite).toBeDefined();
    expect(res.invite?.token).toBeDefined();
    expect(res.invite?.inviteLink).toContain('/invite/');
    expect(res.invite?.role).toBe('editor');
    expect(res.invite?.email).toBe('newuser@tenant.com');
  });

  it('retrieves invitation details by token', async () => {
    const inviteRes = await inviteTeamMember('proj-456', 'colleague@company.com', 'admin');
    const token = inviteRes.invite!.token;

    const { invitation } = await getInvitationByToken(token);
    expect(invitation).toBeDefined();
    expect(invitation?.email).toBe('colleague@company.com');
    expect(invitation?.role).toBe('admin');
  });

  it('accepts invitation, creates login, and enforces assigned brand access', async () => {
    const inviteRes = await inviteTeamMember('brand-alpha', 'alex@alpha.com', 'editor');
    const token = inviteRes.invite!.token;

    const acceptRes = await acceptTeamInvitation({
      token,
      fullName: 'Alex Rivera',
      password: 'SecurePassword123!',
    });

    expect(acceptRes.success).toBe(true);

    // Verify active user session is enrolled
    const activeUserCookie = cookieStore.get('beacon_active_user');
    expect(activeUserCookie).toBeDefined();
    const activeUser = JSON.parse(activeUserCookie.value);
    expect(activeUser.email).toBe('alex@alpha.com');
    expect(activeUser.role).toBe('editor');
    expect(activeUser.assignedBrandId).toBe('brand-alpha');

    // Verify tenant isolation list contains only the invited brand
    const userBrandsCookie = cookieStore.get(`beacon_user_brands_${encodeURIComponent('alex@alpha.com')}`);
    expect(userBrandsCookie).toBeDefined();
    const brands = JSON.parse(userBrandsCookie.value);
    expect(brands).toHaveLength(1);
    expect(brands[0].id).toBe('brand-alpha');
  });

  it('allows owner or admin to customize role permissions and enforce them', async () => {
    const customConfig: RolePermissionsConfig = {
      owner: ['manage_billing', 'manage_team', 'edit_brand_kit', 'manage_prompts', 'trigger_audits', 'content_studio_pitches', 'export_reports', 'view_telemetry'],
      admin: ['manage_billing', 'manage_team', 'edit_brand_kit', 'manage_prompts', 'trigger_audits', 'content_studio_pitches', 'export_reports', 'view_telemetry'],
      editor: ['trigger_audits', 'edit_brand_kit', 'view_telemetry'], // granted brand kit!
      viewer: ['view_telemetry'],
    };

    const updateRes = await updateRolePermissionsConfig('brand-alpha', customConfig);
    expect(updateRes.success).toBe(true);

    // Verify Editor now has edit_brand_kit permission
    expect(hasPermission('editor', 'edit_brand_kit', updateRes.config)).toBe(true);
    // Verify Editor cannot manage billing
    expect(hasPermission('editor', 'manage_billing', updateRes.config)).toBe(false);
  });
});
