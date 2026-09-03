'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsDemo, type AuthActionResult } from './actions';
import { Loader2, ArrowRight, Sparkles, Play } from 'lucide-react';

export function LoginForm({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const [tab, setTab] = React.useState<string>(initialMode);
  const [signInState, signInFormAction, isSignInPending] = useActionState<AuthActionResult | null, FormData>(
    signInWithEmail,
    null
  );
  const [signUpState, signUpFormAction, isSignUpPending] = useActionState<AuthActionResult | null, FormData>(
    signUpWithEmail,
    null
  );

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {tab === 'signin' ? 'Welcome back to Beacon' : 'Start tracking AI visibility'}
        </h1>
        <p className="text-sm text-zinc-600">
          {tab === 'signin'
            ? 'Enter your credentials to access your brand workspace'
            : 'Create your account and claim your AI share of voice'}
        </p>
      </div>

      {/* Google OAuth button */}
      <form action={signInWithGoogle}>
        <Button
          type="submit"
          variant="outline"
          className="w-full h-10 border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-normal justify-center gap-3 transition-colors shadow-2xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>
      </form>

      {/* Instant Demo Workspace Access */}
      <form action={signInAsDemo}>
        <Button
          type="submit"
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium justify-between px-4 transition-all duration-200 shadow-sm group hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <Sparkles className="h-4 w-4" />
            <span>Enter Live Demo Workspace (Instant Access)</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </form>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative px-3 bg-white text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
          or sign in with credentials
        </div>
      </div>

      {/* Tabbed Email / Password Forms */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-100 p-1 border-zinc-200">
          <TabsTrigger value="signin" className="text-xs">
            Sign In
          </TabsTrigger>
          <TabsTrigger value="signup" className="text-xs">
            Create Account
          </TabsTrigger>
        </TabsList>

        {/* 1. SIGN IN TAB */}
        <TabsContent value="signin" className="space-y-4 pt-2">
          <form action={signInFormAction} className="space-y-4">
            {signInState?.error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                {signInState.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="signin-email">Work Email</Label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Password</Label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link has been dispatched to your email.');
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="signin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isSignInPending}
              className="w-full h-10 bg-zinc-900 text-white hover:bg-zinc-800 font-medium text-xs mt-2"
            >
              {isSignInPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In to Workspace <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </form>
        </TabsContent>

        {/* 2. SIGN UP TAB */}
        <TabsContent value="signup" className="space-y-4 pt-2">
          <form action={signUpFormAction} className="space-y-4">
            {signUpState?.error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                {signUpState.error}
              </div>
            )}
            {signUpState?.success && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs leading-relaxed">
                {signUpState.success}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="signup-email">Work Email</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Create Password</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isSignUpPending}
              className="w-full h-10 bg-zinc-900 text-white hover:bg-zinc-800 font-medium text-xs mt-2"
            >
              {isSignUpPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Create Account & Initialize Kit <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="text-center text-[11px] text-zinc-500 font-mono">
        By continuing, you agree to Beacon&apos;s Terms of Service and Privacy Policy.
      </div>
    </div>
  );
}
