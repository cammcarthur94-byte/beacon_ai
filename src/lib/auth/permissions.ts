import {
  TeamMemberRole,
  PermissionAction,
  RolePermissionsConfig,
  DEFAULT_ROLE_PERMISSIONS,
} from '@/types/database.types';

export const PERMISSION_DEFINITIONS: Record<
  PermissionAction,
  { label: string; description: string; category: 'workspace' | 'audits' | 'strategy' }
> = {
  manage_billing: {
    label: 'Stripe Billing & Subscriptions',
    description: 'Manage subscription tiers, payment methods, and invoices.',
    category: 'workspace',
  },
  manage_team: {
    label: 'Team & Role Administration',
    description: 'Invite new members, update role assignments, and revoke invitations.',
    category: 'workspace',
  },
  edit_brand_kit: {
    label: 'Brand Kit Calibration',
    description: 'Update brand identity, competitors, messaging pillars, and negative keywords.',
    category: 'strategy',
  },
  manage_prompts: {
    label: 'Prompt Query Management',
    description: 'Add, pause, edit, and organize search prompts tracked by the engine.',
    category: 'audits',
  },
  trigger_audits: {
    label: 'Instant Multi-Engine Audits',
    description: 'Trigger live on-demand scans across ChatGPT, Perplexity, Gemini, Claude, and Google AI.',
    category: 'audits',
  },
  content_studio_pitches: {
    label: 'Content Studio & PR Pitches',
    description: 'Generate, edit, and export authority gap displacement pitches.',
    category: 'strategy',
  },
  export_reports: {
    label: 'Executive Reports & CSV Exports',
    description: 'Download executive summary reports, audit history, and citation analytics.',
    category: 'strategy',
  },
  view_telemetry: {
    label: 'View Dashboard & Telemetry',
    description: 'Access read-only Share of Voice leaderboards, citation maps, and model responses.',
    category: 'audits',
  },
};

/**
 * Check if a given role has permission to execute an action,
 * respecting any custom per-project permissions matrix configured by Owner/Admin.
 */
export function hasPermission(
  role: TeamMemberRole,
  action: PermissionAction,
  customConfig?: RolePermissionsConfig | null
): boolean {
  // Owner always retains root control
  if (role === 'owner') {
    return true;
  }

  // Use custom configuration if set for this role
  if (customConfig && Array.isArray(customConfig[role])) {
    return customConfig[role].includes(action);
  }

  // Fallback to platform system defaults
  const roleDefaults = DEFAULT_ROLE_PERMISSIONS[role] || [];
  return roleDefaults.includes(action);
}

/**
 * Get the full list of allowed actions for a role.
 */
export function getEffectivePermissions(
  role: TeamMemberRole,
  customConfig?: RolePermissionsConfig | null
): PermissionAction[] {
  if (role === 'owner') {
    return [
      'manage_billing',
      'manage_team',
      'edit_brand_kit',
      'manage_prompts',
      'trigger_audits',
      'content_studio_pitches',
      'export_reports',
      'view_telemetry',
    ];
  }

  if (customConfig && Array.isArray(customConfig[role])) {
    return customConfig[role];
  }

  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

export function getRoleBadgeColor(role: TeamMemberRole): string {
  switch (role) {
    case 'owner':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'admin':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'editor':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'viewer':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
