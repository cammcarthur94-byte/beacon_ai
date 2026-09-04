'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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
} from 'lucide-react';
import { toast } from 'sonner';
import type { TeamMember, TeamInvitation, TeamMemberRole } from '@/types/database.types';

interface TeamManagementTabProps {
  project: {
    id: string;
    name: string;
    domain: string;
    tier?: string;
  };
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
  },
];

export function TeamManagementTab({ project }: TeamManagementTabProps) {
  const [members, setMembers] = useState<TeamMember[]>(DEFAULT_MEMBERS);
  const [invitations, setInvitations] = useState<TeamInvitation[]>(DEFAULT_INVITES);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMemberRole>('editor');
  const [ssoEnforced, setSsoEnforced] = useState(false);

  const handleRoleChange = (memberId: string, newRole: TeamMemberRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    toast.success('Member permissions successfully updated.');
  };

  const handleRemoveMember = (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    if (target?.role === 'owner') {
      toast.error('Cannot remove workspace owner.');
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success('Team member removed from workspace.');
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    const newInv: TeamInvitation = {
      id: 'inv-' + Date.now(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      status: 'pending',
      sentAt: 'Just now',
    };
    setInvitations((prev) => [...prev, newInv]);
    setInviteEmail('');
    setInviteModalOpen(false);
    toast.success(`Invitation sent to ${newInv.email}`);
  };

  const handleRevokeInvite = (invId: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== invId));
    toast.info('Invitation revoked.');
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
    <div className="space-y-6">
      {/* 1. TEAM MEMBERS LIST */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Access Control
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">{members.length} Active Users</span>
            </div>
            <CardTitle className="text-lg font-bold text-slate-950 font-sans">
              Active Workspace Members
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 font-sans">
              Manage roles and access permissions for users authorized to view or edit this tenant.
            </CardDescription>
          </div>

          <Button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
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
              <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
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
                          <div className="font-semibold text-slate-950">{member.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={member.role}
                        disabled={member.role === 'owner'}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as TeamMemberRole)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-slate-500 font-mono text-[11px]">
                      {member.lastActive}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="h-7 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 2. PENDING INVITATIONS TABLE */}
      {invitations.length > 0 && (
        <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 font-sans">
              Pending Invitations
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-sans">
              Invited colleagues who have not yet claimed their seat.
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="h-7 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. RBAC PERMISSIONS MATRIX CARD */}
      <Card className="border-slate-200 bg-slate-50/50 shadow-xs rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-700" />
          <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900">
            Role-Based Access Control (RBAC) Permissions
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-900 block font-mono text-[11px]">Owner</span>
            <p className="text-slate-500 text-[11px]">
              Full workspace control, Stripe billing management, account deletion, and ownership transfer.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-900 block font-mono text-[11px]">Admin</span>
            <p className="text-slate-500 text-[11px]">
              Calibrate Brand Kit, manage team members &amp; invitations, and run audits.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-900 block font-mono text-[11px]">Editor</span>
            <p className="text-slate-500 text-[11px]">
              Trigger prompt audits, generate PR pitches in Content Studio, view authority gap matrices.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-900 block font-mono text-[11px]">Viewer</span>
            <p className="text-slate-500 text-[11px]">
              Read-only telemetry access to Share of Voice benchmarks, citations, and executive reports.
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
              <CardDescription className="text-xs text-slate-600 font-sans">
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
            <p className="text-xs text-slate-500 font-sans">
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
                <h3 className="text-base font-bold text-slate-950 font-sans">Invite Team Member</h3>
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
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Assigned Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMemberRole)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="admin">Admin - Full management &amp; Brand Kit configuration</option>
                  <option value="editor">Editor - Prompt audits &amp; Content Studio generation</option>
                  <option value="viewer">Viewer - Read-only reporting &amp; telemetry</option>
                </select>
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
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
