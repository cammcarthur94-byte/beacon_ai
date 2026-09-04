'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  CheckCircle2,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  Building2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { acceptTeamInvitation } from '@/app/settings/team-actions';
import { getRoleBadgeColor } from '@/lib/auth/permissions';
import type { TeamMemberRole, TeamInvitation } from '@/types/database.types';

interface InviteClientProps {
  token: string;
  invitation: TeamInvitation | null;
  brandName: string;
  projectId: string;
}

export function InviteClient({ token, invitation, brandName, projectId }: InviteClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<'create' | 'login'>('create');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
        <Card className="max-w-md w-full border-slate-200 shadow-sm p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Invalid or Expired Invitation</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            This invitation link is either invalid, has expired, or has already been accepted.
            Please request a new invitation from your workspace administrator.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold mt-2 cursor-pointer"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  const role = invitation.role;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'create') {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    } else {
      if (!password) {
        setErrorMessage('Please enter your password.');
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await acceptTeamInvitation({
          token,
          fullName: fullName.trim() || invitation.email.split('@')[0],
          password,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Failed to accept invitation.');
          return;
        }

        toast.success(`Welcome to ${brandName}! Your account has been enrolled.`);
        router.push('/dashboard');
        router.refresh();
      } catch (err: any) {
        setErrorMessage(err.message || 'An unexpected error occurred.');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-slate-50 via-white to-slate-100/60 font-sans">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Workspace Team Invitation</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Join <span className="text-emerald-700">{brandName}</span> on Beacon
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have been invited to collaborate with authorized access to the{' '}
            <strong className="text-slate-700">{brandName}</strong> tenant.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Card Header Badge */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-800">{brandName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Assigned Role:</span>
              <Badge className={getRoleBadgeColor(role)}>
                {role.toUpperCase()}
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setErrorMessage('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'create' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Create New Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Existing Account
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Invited Email (Read-only) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Invited Email</Label>
                <Input
                  type="email"
                  value={invitation.email}
                  disabled
                  className="bg-slate-50 text-slate-600 border-slate-200 text-xs font-medium cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 block">
                  Your login will be strictly tied to this email address and brand.
                </span>
              </div>

              {mode === 'create' ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Set Password</Label>
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Confirm Password</Label>
                    <Input
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Account Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter your existing password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-xs"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    We'll link this brand to your existing account.
                  </span>
                </div>
              )}

              {/* Security & Role Scope Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  Tenant Access Boundary
                </span>
                <p>
                  You will have access strictly to <strong>{brandName}</strong> with{' '}
                  <span className="capitalize font-semibold">{role}</span> permissions. No other client brands or workspaces will be accessible.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enrolling into {brandName}...
                  </>
                ) : (
                  <>
                    <span>Accept Invitation &amp; Enter Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
