import Link from 'next/link';
import { LoginForm } from './login-form';
import { Radio, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const mode = params.mode === 'signup' ? 'signup' : 'signin';

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-12 bg-white text-zinc-900">
      {/* LEFT PANEL: High-Contrast Minimalist GEO Value Showcase */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 border-r border-zinc-200 relative overflow-hidden bg-zinc-50/60">
        {/* Subtle grid background effect */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #09090b 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-lg tracking-wider group-hover:bg-zinc-800 transition-colors shadow-xs">
              <Radio className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-zinc-900 tracking-tight text-lg">Beacon</span>
              <span className="ml-2 text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 border border-zinc-300">
                GEO / AEO
              </span>
            </div>
          </Link>
          <Badge variant="outline" className="border-zinc-200 text-zinc-600 bg-white">
            Autonomous Visibility Engine
          </Badge>
        </div>

        {/* Middle Content: Metrics & Engine Visualizer */}
        <div className="relative z-10 my-auto py-12 max-w-xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tracking 4 Search Engines Concurrently</span>
            </div>
            <h2 className="text-4xl font-semibold tracking-tight text-zinc-950 leading-tight">
              Is your brand visible when buyers consult AI?
            </h2>
            <p className="text-base text-zinc-600 leading-relaxed">
              Traditional SEO tracks links. Beacon tracks LLM consensus across ChatGPT, Gemini, Claude, and Perplexity — monitoring citations, sentiment, and share of voice in real time.
            </p>
          </div>

          {/* Engine Status Grid Preview */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="group p-4 rounded-xl bg-white border border-zinc-200 space-y-2 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span className="group-hover:text-emerald-700 transition-colors">OpenAI ChatGPT</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
                84.2% <span className="text-xs font-normal text-emerald-600 font-sans">+4.1%</span>
              </div>
              <p className="text-[11px] text-zinc-500">Ranked #1 in 14 of 18 tracked prompts</p>
            </div>

            <div className="group p-4 rounded-xl bg-white border border-zinc-200 space-y-2 shadow-xs hover:border-cyan-500/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span className="group-hover:text-cyan-700 transition-colors">Perplexity Sonar</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
                92.0% <span className="text-xs font-normal text-emerald-600 font-sans">+8.5%</span>
              </div>
              <p className="text-[11px] text-zinc-500">Primary citation domain verified</p>
            </div>

            <div className="group p-4 rounded-xl bg-white border border-zinc-200 space-y-2 shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span className="group-hover:text-blue-700 transition-colors">Google Gemini</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
                79.5% <span className="text-xs font-normal text-zinc-500 font-sans">steady</span>
              </div>
              <p className="text-[11px] text-zinc-500">Positive sentiment in AI Overviews</p>
            </div>

            <div className="group p-4 rounded-xl bg-white border border-zinc-200 space-y-2 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span className="group-hover:text-amber-700 transition-colors">Anthropic Claude</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
                88.4% <span className="text-xs font-normal text-emerald-600 font-sans">+2.0%</span>
              </div>
              <p className="text-[11px] text-zinc-500">Direct capability recommendation</p>
            </div>
          </div>

          {/* Social Proof / Security Badge */}
          <div className="flex items-center gap-6 pt-4 text-xs text-zinc-500 font-mono border-t border-zinc-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>SOC2 Type II telemetry</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-zinc-500" />
              <span>Real-time AEO synthesis</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>&copy; {new Date().getFullYear()} Beacon Platform Inc.</span>
          <span>Next.js 16 App Router &bull; React 19</span>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Card with Tabbed Sign In / Create Account */}
      <div className="col-span-12 lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-zinc-900 tracking-tight text-lg">Beacon</span>
          </div>

          <LoginForm initialMode={mode} />
        </div>
      </div>
    </div>
  );
}
