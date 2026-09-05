'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Live Signal */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
              <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900 tracking-tight">Beacon</span>
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Visibility
            </span>
          </div>
        </Link>

        {/* Clean Center Anchor Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors"
          >
            Features
          </Link>
          <Link
            href="#platform-tour"
            className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors"
          >
            Platform Tour
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors"
          >
            FAQ
          </Link>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors px-2.5 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold h-9 sm:h-10 px-4 sm:px-5 rounded-xl shadow-xs hover:shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <span>Start Tracking Free</span>
            <ArrowRight className="h-4 w-4 ml-1 hidden sm:inline" />
          </Link>
        </div>
      </div>
    </header>
  );
}
