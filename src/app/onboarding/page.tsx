import { OnboardingWizard } from './onboarding-wizard';
import { Radio } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden">
      {/* Background glow and subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #09090b 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl w-full mx-auto pb-6 border-b border-zinc-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-900 tracking-tight">Beacon</span>
        </Link>
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-semibold">
          Account Setup
        </span>
      </header>

      {/* Main Content */}
      <main className="relative z-10 my-auto py-8">
        <div className="max-w-2xl mx-auto text-center space-y-2 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            Initialize your AI Brand Kit
          </h1>
          <p className="text-sm text-zinc-600">
            Beacon monitors AI search recommendations through the lens of your brand positioning, category, and competitors.
          </p>
        </div>

        <OnboardingWizard />
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl w-full mx-auto pt-6 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
        <span>Beacon Generative Engine Optimization</span>
        <span className="font-mono">Phase 1 &bull; Brand Kit Engine</span>
      </footer>
    </div>
  );
}
