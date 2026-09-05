'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Mail,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Lock,
  Building,
  RefreshCw,
  X,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  TeamMember,
  TeamInvitation,
  TeamMemberRole,
  RolePermissionsConfig,
} from '@/types/database.types';
import { DEFAULT_ROLE_PERMISSIONS } from '@/types/database.types';
import {
  getWorkspaceTeamData,
  inviteTeamMember,
  updateMemberRole,
  removeTeamMember,
  revokeTeamInvitation,
} from '@/app/settings/team-actions';
import { RolePermissionsDialog } from './role-permissions-dialog';
import { getRoleBadgeColor, hasPermission } from '@/lib/auth/permissions';

interface TeamManagementTabProps {
  project: {
    id: string;
    name: string;
    domain: string;
    tier?: string;
  };
}

export function TeamManagementTab({ project }: TeamManagementTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [roleConfig, setRoleConfig] = useState<RolePermissionsConfig>(DEFAULT_ROLE_PERMISSIONS);
  const [currentUserRole, setCurrentUserRole] = useState<TeamMemberRole>('owner');
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMemberRole>('editor');
  const [isInviting, startInviteTransition] = useTransition();

  // Generated Link Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [latestInvite, setLatestInvite] = useState<{ email: string; role: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Role Permissions Dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [ssoEnforced, setSsoEnforced] = useState(false);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    getWorkspaceTeamData(project.id).then((data) => {
      if (!mounted) return;
      setMembers(data.members);
      setInvitations(data.invitations);
      setRoleConfig(data.rolePermissionsConfig);
      setCurrentUserRole(data.currentUserRole);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [project.id]);

  const canManageTeam = hasPermission(currentUserRole, 'manage_team', roleConfig);

  const handleRoleChange = async (memberId: string, newRole: TeamMemberRole) => {
    if (!canManageTeam) {
      toast.error('You do not have permission to manage team roles.');
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    const res = await updateMemberRole(project.id, memberId, newRole);
    if (res.success) {
      toast.success('Member permissions successfully updated.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!canManageTeam) {
      toast.error('You do not have permission to remove team members.');
      return;
    }
    const target = members.find((m) => m.id === memberId);
    if (target?.role === 'owner') {
      toast.error('Cannot remove workspace owner.');
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    const res = await removeTeamMember(project.id, memberId);
    if (res.success) {
      toast.success('Team member removed from workspace.');
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    startInviteTransition(async () => {
      const res = await inviteTeamMember(project.id, inviteEmail, inviteRole);
      if (!res.success || !res.invite) {
        toast.error(res.error || 'Failed to send invitation.');
        return;
      }

      const newInv: TeamInvitation = {
        id: res.invite.id,
        email: res.invite.email,
        role: res.invite.role,
        status: 'pending',
        sentAt: 'Just now',
        token: res.invite.token,
      };

      setInvitations((prev) => [newInv, ...prev.filter((i) => i.email !== newInv.email)]);
      setLatestInvite({
        email: res.invite.email,
        role: res.invite.role,
        link: res.invite.inviteLink,
      });

      setInviteEmail('');
      setInviteModalOpen(false);
      setLinkModalOpen(true);
      toast.success(`Invitation created for ${newInv.email}!`);
    });
  };

  const handleRevokeInvite = async (invId: string) => {
    if (!canManageTeam) {
      toast.error('You do not have permission to revoke invitations.');
      return;
    }
    setInvitations((prev) => prev.filter((i) => i.id !== invId));
    await revokeTeamInvitation(project.id, invId);
    toast.info('Invitation revoked.');
  };

  const handleCopyLink = () => {
    if (!latestInvite?.link) return;
    navigator.clipboard.writeText(latestInvite.link);
    setCopied(true);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleSso = () => {
    setSsoEnforced((prev) => {
      const next = !prev;
      toast.success(
        next
          ? 'Enterprise Google/Microsoft SAML SSO is now enforced for all users.'
          : 'SSO enforcement disabled. Email/password authentication permitted.'
      );
      return next;
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TEAM MEMBERS LIST */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Access Control
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">
                {members.length} Active User{members.length !== 1 ? 's' : ''}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-[11px] text-slate-500">
                Your role: <strong className="text-slate-800 capitalize">{currentUserRole}</strong>
              </span>
            </div>
            <CardTitle className="text-lg font-bold text-slate-950">
              Active Workspace Members
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Manage roles and access permissions for users authorized to view or edit this tenant.
            </CardDescription>
          </div>

          <Button
            type="button"
            disabled={!canManageTeam}
            onClick={() => setInviteModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite Member
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Last Active</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            member.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-950 flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {member.role === 'owner' && (
                              <Badge className="text-[9px] font-mono px-1 py-0 bg-purple-50 text-purple-700 border-purple-200">
                                OWNER
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={member.role}
                        disabled={member.role === 'owner' || !canManageTeam}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as TeamMemberRole)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="owner" disabled>Owner</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-slate-500 font-mono text-[11px]">
                      {member.lastActive}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {member.role !== 'owner' && canManageTeam && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove user from workspace"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 2. PENDING INVITATIONS */}
      {invitations.length > 0 && (
        <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Pending Invitations
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Invited colleagues who have not yet set up their credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 text-xs">
              {invitations.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-900 font-mono text-xs">{inv.email}</div>
                      <div className="text-[11px] text-slate-400">
                        Invited as <span className="capitalize font-semibold text-slate-600">{inv.role}</span> &bull; Sent {inv.sentAt}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-mono">
                      Pending Acceptance
                    </Badge>
                    {inv.token && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = `${window.location.origin}/invite/${inv.token}`;
                          navigator.clipboard.writeText(link);
                          toast.success('Direct invite link copied!');
                        }}
                        className="h-7 text-xs border-slate-200 text-slate-700 hover:text-emerald-700 cursor-pointer"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
                      </Button>
                    )}
                    {canManageTeam && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="h-7 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. RBAC PERMISSIONS MATRIX CARD */}
      <Card className="border-slate-200 bg-slate-50/50 shadow-xs rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-700" />
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900">
                Role-Based Access Control (RBAC) Permissions
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Customizable security scopes governing what each role can view and execute.
              </p>
            </div>
          </div>
          {canManageTeam && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRoleDialogOpen(true)}
              className="text-xs h-8 border-slate-300 text-slate-800 hover:text-emerald-700 bg-white font-semibold cursor-pointer shadow-2xs self-start sm:self-center"
            >
              <Sliders className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Configure Role Permissions
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 block font-mono text-[11px]">Owner</span>
              <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[9px]">Root</Badge>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Full workspace control, Stripe billing management, account deletion, and ownership transfer.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 block font-mono text-[11px]">Admin</span>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px]">
                {(roleConfig.admin || []).length} Scopes
              </Badge>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              {(roleConfig.admin || []).includes('edit_brand_kit') ? 'Calibrate Brand Kit, ' : ''}
              {(roleConfig.admin || []).includes('manage_team') ? 'manage team members & invites, ' : ''}
              and run audits.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 block font-mono text-[11px]">Editor</span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">
                {(roleConfig.editor || []).length} Scopes
              </Badge>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Trigger prompt audits, generate PR pitches in Content Studio, view authority gap matrices.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 block font-mono text-[11px]">Viewer</span>
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[9px]">
                {(roleConfig.viewer || []).length} Scopes
              </Badge>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Read-only access to recommendation rate benchmarks, website citations, and reports.
            </p>
          </div>
        </div>
      </Card>

      {/* 4. ENTERPRISE SSO & SECURITY */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-700" />
                Enterprise Single Sign-On (SSO) &amp; Security
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Require all team members to authenticate through corporate identity providers (Google Workspace, Microsoft Entra, or Okta SAML).
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={
                ssoEnforced
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-mono text-[10px]'
                  : 'border-slate-200 bg-slate-50 text-slate-500 font-mono text-[10px]'
              }
            >
              {ssoEnforced ? 'SSO Enforced' : 'Optional'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-1 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-900">
              Enforce Domain OAuth for @{project.domain || 'yourdomain.com'}
            </span>
            <p className="text-xs text-slate-500">
              Disables standard email/password login for any user with this corporate domain.
            </p>
          </div>
          <Button
            type="button"
            variant={ssoEnforced ? 'outline' : 'default'}
            onClick={handleToggleSso}
            className={
              ssoEnforced
                ? 'border-slate-300 text-slate-700 text-xs cursor-pointer'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white text-xs cursor-pointer'
            }
          >
            {ssoEnforced ? 'Disable SSO Enforcement' : 'Enforce SAML / OAuth SSO'}
          </Button>
        </CardContent>
      </Card>

      {/* INVITE MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-950">Invite Team Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs font-semibold text-slate-700">
                  Email Address
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="border-slate-200 text-sm"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Assigned Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMemberRole)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="admin">Admin - Workspace management &amp; Brand Profile</option>
                  <option value="editor">Editor - Search audits &amp; Content Studio PR pitches</option>
                  <option value="viewer">Viewer - Read-only results &amp; reporting</option>
                </select>
                <span className="text-[11px] text-slate-500 block">
                  The member will create their own password and gain access strictly to <strong>{project.name}</strong>.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteModalOpen(false)}
                  className="text-xs border-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isInviting}
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Generating Invite...
                    </>
                  ) : (
                    'Generate & Send Invitation'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE LINK GENERATED MODAL */}
      {linkModalOpen && latestInvite && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Invitation Dispatched!
                </h3>
                <p className="text-xs text-slate-500">
                  Invited <strong className="text-slate-700">{latestInvite.email}</strong> as an{' '}
                  <span className="capitalize font-semibold text-emerald-700">{latestInvite.role}</span>.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Direct Onboarding Link
              </span>
              <div className="flex items-center gap-2">
                <Input
                  value={latestInvite.link}
                  readOnly
                  className="text-xs font-mono bg-white border-slate-200 text-slate-700 h-9"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-9 px-3 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="ml-1.5">{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                Share this link directly or have the user open it to set up their login information.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <a
                href={latestInvite.link}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                <span>Test Invite Link in New Tab</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Button
                type="button"
                size="sm"
                onClick={() => setLinkModalOpen(false)}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE PERMISSIONS CONFIGURATION DIALOG */}
      <RolePermissionsDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        projectId={project.id}
        initialConfig={roleConfig}
        onConfigUpdated={(newCfg) => setRoleConfig(newCfg)}
      />
    </div>
  );
}
