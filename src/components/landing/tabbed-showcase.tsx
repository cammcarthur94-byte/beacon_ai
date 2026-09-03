'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import {
  FileText,
  Globe,
  Search,
  Bot,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CapabilityItem {
  id: string;
  title: string;
  shortDescription: string;
  badge: string;
  headline: string;
  fullDescription: string;
  icon: React.ElementType;
  path: string;
  imageSrc: string;
  imageAlt: string;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    id: 'reports',
    title: 'Executive Reports',
    shortDescription: 'White-label summaries & PDF exports',
    badge: 'Stakeholder Intelligence',
    headline: 'White-Label Intelligence for Leadership & Clients',
    fullDescription:
      'Generate clear, executive-ready summaries of your conversational search footprint, competitive wins, and citation share. Export polished PDFs customized for stakeholders.',
    icon: FileText,
    path: 'reports',
    imageSrc: '/screenshots/reports.png',
    imageAlt: 'Beacon Executive Reports and PDF Export Suite',
  },
  {
    id: 'citations',
    title: 'Referring Domain Ledger',
    shortDescription: 'Source discovery & backlink tracking',
    badge: 'Backlink Telemetry',
    headline: 'Uncover the Sources Behind Every AI Answer',
    fullDescription:
      'Inspect the exact websites, publications, and community articles AI search engines use to substantiate their recommendations about your category.',
    icon: Globe,
    path: 'citations',
    imageSrc: '/screenshots/citations.png',
    imageAlt: 'Beacon Referring Domain Ledger and Backlink Intelligence',
  },
  {
    id: 'audits',
    title: 'Prompt Audit Matrix',
    shortDescription: 'Live query telemetry & model scoring',
    badge: 'Query Telemetry',
    headline: 'Track High-Value Buyer Prompts Across All Engines',
    fullDescription:
      'Monitor your exact commercial search queries in real time. Compare side-by-side engine responses to know immediately when AI names your brand as the top choice.',
    icon: Search,
    path: 'audits',
    imageSrc: '/screenshots/audits.png',
    imageAlt: 'Beacon Prompt Audit Telemetry Matrix',
  },
  {
    id: 'consultant',
    title: 'Beacon Sentinel',
    shortDescription: 'Proactive alerts & 1-click drafts',
    badge: 'Autonomous AI Co-Worker',
    headline: 'Your Autonomous Generative Engine Optimization Agent',
    fullDescription:
      'Beacon Sentinel alerts you when citation gaps occur and drafts deploy-ready content blueprints to recapture lost visibility in hours, not weeks.',
    icon: Bot,
    path: 'consultant',
    imageSrc: '/screenshots/consultant.png',
    imageAlt: 'Beacon Sentinel Autonomous AI Co-worker Agent',
  },
];

export function TabbedShowcase() {
  const [activeId, setActiveId] = useState('reports');
  const activeCap = CAPABILITIES.find((c) => c.id === activeId) || CAPABILITIES[0];

  return (
    <div className="w-full space-y-8">
      {/* ── 1. INTERACTIVE FLOATING PILL CHIPS ───────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 max-w-4xl mx-auto px-4">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          const isActive = cap.id === activeId;
          return (
            <button
              key={cap.id}
              type="button"
              onClick={() => setActiveId(cap.id)}
              className={cn(
                'inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 cursor-pointer select-none',
                isActive
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500/30'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-2xs'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-emerald-600' : 'text-slate-500'
                )}
              />
              <span>{cap.title}</span>
            </button>
          );
        })}
      </div>

      {/* ── 2. DYNAMIC CONTEXTUAL SUMMARY (NO CHECKMARK WALL) ─── */}
      <div className="max-w-3xl mx-auto text-center space-y-2.5 px-4 transition-all duration-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span>{activeCap.badge}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {activeCap.headline}
        </h3>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {activeCap.fullDescription}
        </p>
      </div>

      {/* ── 3. POLISHED BROWSER FRAME WITH SCREENSHOT ─────────── */}
      <div className="relative max-w-6xl mx-auto px-2 sm:px-4">
        {/* Ambient Emerald Glow Backlight */}
        <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none -z-10" />

        {/* Browser Window Card */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-2xl transition-all duration-300">
          {/* Polished Browser Header */}
          <div className="h-11 px-4 sm:px-5 bg-slate-50/95 border-b border-slate-200/80 flex items-center justify-between">
            {/* Window Control Dots */}
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 inline-block" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 inline-block" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 inline-block" />
            </div>

            {/* Mock URL Bar */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-600 font-medium shadow-2xs max-w-xs sm:max-w-md w-full justify-center">
              <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="truncate">app.beacon.ai/{activeCap.path}</span>
            </div>

            {/* Direct Link to Try / Explore */}
            <Link
              href="/login"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>Explore</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Screenshot Render with Smooth Cross-Fade */}
          <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden">
            <Image
              key={activeCap.id}
              src={activeCap.imageSrc}
              alt={activeCap.imageAlt}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top transition-opacity duration-300 animate-in fade-in"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
