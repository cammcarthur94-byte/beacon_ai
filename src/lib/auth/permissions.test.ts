import { describe, it, expect } from 'vitest';
import { hasPermission, getEffectivePermissions } from './permissions';
import { RolePermissionsConfig } from '@/types/database.types';

describe('permissions engine', () => {
  it('allows owner to perform all actions regardless of custom config', () => {
    expect(hasPermission('owner', 'manage_billing')).toBe(true);
    expect(hasPermission('owner', 'manage_team')).toBe(true);
    expect(hasPermission('owner', 'edit_brand_kit')).toBe(true);
    expect(hasPermission('owner', 'trigger_audits')).toBe(true);
  });

  it('enforces default permissions for admin, editor, and viewer', () => {
    // Admin
    expect(hasPermission('admin', 'manage_team')).toBe(true);
    expect(hasPermission('admin', 'edit_brand_kit')).toBe(true);
    expect(hasPermission('admin', 'manage_billing')).toBe(false);

    // Editor
    expect(hasPermission('editor', 'trigger_audits')).toBe(true);
    expect(hasPermission('editor', 'manage_prompts')).toBe(true);
    expect(hasPermission('editor', 'manage_team')).toBe(false);
    expect(hasPermission('editor', 'edit_brand_kit')).toBe(false);

    // Viewer
    expect(hasPermission('viewer', 'view_telemetry')).toBe(true);
    expect(hasPermission('viewer', 'export_reports')).toBe(true);
    expect(hasPermission('viewer', 'trigger_audits')).toBe(false);
    expect(hasPermission('viewer', 'manage_prompts')).toBe(false);
  });

  it('respects custom role permission overrides configured by Owner/Admin', () => {
    const customConfig: RolePermissionsConfig = {
      owner: ['manage_billing', 'manage_team'],
      admin: ['manage_billing', 'manage_team', 'edit_brand_kit'], // granted billing
      editor: ['trigger_audits', 'edit_brand_kit'], // granted brand kit
      viewer: ['view_telemetry', 'trigger_audits'], // granted trigger audits
    };

    // Admin now has billing
    expect(hasPermission('admin', 'manage_billing', customConfig)).toBe(true);

    // Editor now has edit_brand_kit
    expect(hasPermission('editor', 'edit_brand_kit', customConfig)).toBe(true);

    // Viewer now has trigger_audits
    expect(hasPermission('viewer', 'trigger_audits', customConfig)).toBe(true);

    // Viewer still lacks manage_team
    expect(hasPermission('viewer', 'manage_team', customConfig)).toBe(false);
  });

  it('retrieves effective permissions correctly', () => {
    const defaultViewerPermissions = getEffectivePermissions('viewer');
    expect(defaultViewerPermissions).toContain('view_telemetry');
    expect(defaultViewerPermissions).not.toContain('manage_billing');
  });
});
