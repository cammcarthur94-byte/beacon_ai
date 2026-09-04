import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { EngineMarquee } from '@/components/landing/engine-marquee';
import { TabbedShowcase } from '@/components/landing/tabbed-showcase';
import { FAQSection } from '@/components/landing/faq-section';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Globe,
  Bot,
  Search,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-950 font-sans flex flex-col">
      {/* ── 1. ULTRA-MINIMAL TOP NAVBAR ─────────────────────────── */}
      <LandingNavbar />

      {/* ── 2. HERO SECTION ─────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Top Indicator Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Generative Engine Optimization (GEO) Platform</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-emerald-600 font-semibold">2026 Ready</span>
          </div>

          {/* Major Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.1]">
            Are customers finding your business when they ask{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
              AI search engines?
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            When people ask ChatGPT, Gemini, and Perplexity for recommendations, do they name your brand?
            Beacon tracks and grows your visibility across every major conversational search engine.
          </p>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-emerald-600/25 transition-all cursor-pointer group"
            >
              <span>Start Tracking Free</span>
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>No credit card required · Live 5-minute setup</span>
            </div>
          </div>

          {/* Supported AI Search Engines Row Container */}
          <div className="pt-8 sm:pt-10">
            <EngineMarquee />
          </div>

          {/* Frameless Hero Dashboard Preview with Ambient Glow */}
          <div className="relative pt-6 sm:pt-10 max-w-6xl mx-auto">
            {/* Ambient emerald backlight glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-3xl blur-3xl -z-10 pointer-events-none" />

            <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-2xl">
              {/* Subtle top frame border with active pill */}
              <div className="h-10 px-4 bg-slate-50/90 border-b border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200/60 text-[11px] text-slate-600 font-medium shadow-2xs">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span>app.beacon.ai/dashboard</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Telemetry Live</span>
                </div>
              </div>

              {/* Dashboard Preview Image */}
              <div className="relative w-full aspect-[16/10] bg-slate-100">
                <Image
                  src="/screenshots/dashboard.png"
                  alt="Beacon AI Visibility Command Center Dashboard"
                  fill
                  priority
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. INTERACTIVE 4-CARD FEATURE GRID ──────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              <span>Core Intelligence Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Everything you need to own your category in AI answers
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Conversational search engines evaluate your brand differently than traditional web crawlers.
              Beacon gives you the full telemetry to monitor, diagnose, and optimize.
            </p>
          </div>

          {/* 4 Feature Cards with Fluid Hover Lift */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Card 1: Multi-Engine Visibility */}
            <div className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-105 transition-transform">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Multi-Engine Visibility Tracking
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Monitor how ChatGPT, Claude, Perplexity, and Gemini evaluate your brand in real time.
                  Track whether you are named as a top recommendation or excluded from category syntheses.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200/70 mt-6 flex items-center justify-between text-xs font-semibold text-emerald-700">
                <span>Audits run every 24 hours</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Google AI Overviews */}
            <div className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs group-hover:scale-105 transition-transform">
                  <Search className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Google AI Overviews
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                    Pro
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Google now displays AI answer syntheses above standard organic results for majority search queries.
                  Beacon captures the exact answer blocks and citations shown to prospective buyers.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200/70 mt-6 flex items-center justify-between text-xs font-semibold text-blue-700">
                <span>SERP generative capture</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Backlink & Citation Discovery */}
            <div className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-purple-100/70 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs group-hover:scale-105 transition-transform">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Backlink &amp; Citation Discovery
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Uncover the exact authority domains, Reddit threads, and editorial publications LLMs use
                  to justify their answers. See which backlink opportunities will unlock citation growth.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200/70 mt-6 flex items-center justify-between text-xs font-semibold text-purple-700">
                <span>Referring domain ledger</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Beacon Sentinel (AI Co-Worker) */}
            <div className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs group-hover:scale-105 transition-transform">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Beacon Sentinel (AI Co-Worker)
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Receive proactive alerts the moment your brand loses citations to a competitor.
                  Sentinel diagnoses the root cause and generates deploy-ready content blueprints to recapture your top spot.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200/70 mt-6 flex items-center justify-between text-xs font-semibold text-amber-800">
                <span>One-click content generation</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. INTERACTIVE CAPABILITY SWITCHER ─────────────────── */}
      <section className="py-16 sm:py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 border border-slate-300 text-xs font-semibold text-slate-800">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>Interactive Platform Tour</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Explore the Beacon platform in detail
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Click any capability below to preview the live interface and see how Beacon monitors your generative search footprint.
            </p>
          </div>

          {/* Interactive Feature Switcher Component */}
          <TabbedShowcase />
        </div>
      </section>

      {/* ── 5. INTERACTIVE FAQ SECTION ──────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FAQSection />
        </div>
      </section>

      {/* ── 6. HIGH-IMPACT CLOSING CTA BANNER ────────────────────── */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-slate-950 p-8 sm:p-12 md:p-16 text-center text-white overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/20 rounded-full blur-3xl" />

            <div className="relative space-y-6 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Start Tracking in 5 Minutes</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Take control of your brand&apos;s AI search recommendations
              </h2>

              <p className="text-base text-slate-400 leading-relaxed font-normal">
                Join modern marketing teams and brands tracking their generative search share across
                ChatGPT, Perplexity, Claude, and Google AI Overviews.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer group"
                >
                  <span>Start Tracking Free</span>
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl cursor-pointer transition-colors"
                >
                  Sign In to Workspace
                </Link>
              </div>

              {/* Value Guarantees */}
              <div className="pt-6 flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Zero setup fees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Instant domain calibration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. MINIMAL EXECUTIVE FOOTER ─────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-slate-950 flex items-center justify-center text-emerald-400">
              <span className="font-bold text-xs">B</span>
            </div>
            <span className="font-semibold text-slate-800 text-sm">Beacon</span>
            <span className="text-slate-300">&bull;</span>
            <span>Generative Engine Optimization &amp; AI Share of Voice</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Start Free Trial
            </Link>
            <span className="text-slate-300">&bull;</span>
            <span>&copy; {new Date().getFullYear()} Beacon Technologies, Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
