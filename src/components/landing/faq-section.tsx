'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'What is AI Search Optimization?',
    answer:
      'AI Search Optimization is the practice of making sure AI tools—like ChatGPT, Google Gemini, and Perplexity—recommend your business when potential customers ask for suggestions. While traditional search optimization focuses on web links, AI Search Optimization ensures your business is the direct, trusted recommendation AI gives to buyers.',
  },
  {
    question: 'How does Beacon track what AI engines say about my business?',
    answer:
      'Beacon runs automated searches every day across ChatGPT, Gemini, Claude, Perplexity, and Google AI. We ask the real questions your potential buyers ask, check if your business is recommended, compare how often you are suggested vs. your competitors, and show you the exact websites AI references.',
  },
  {
    question: 'Why did AI stop recommending my brand or cite a competitor instead?',
    answer:
      'AI tools update their recommendations constantly. When a competitor gets featured in new articles, reviews, or discussions (like Reddit), AI tools may start recommending them instead. Beacon alerts you when this happens and gives you ready-to-use content and email outreach to win back top recommendations.',
  },
  {
    question: 'How quickly can I start tracking my brand on Beacon?',
    answer:
      'Setup takes under 2 minutes. You simply enter your company website and what products or services you sell. Beacon automatically sets up your tracked searches and begins monitoring across all major AI search tools.',
  },
  {
    question: 'Can Beacon help my team create content that AI engines recommend?',
    answer:
      'Yes! Beacon analyzes the websites and information AI relies on in your industry. It then drafts ready-to-publish articles, outreach emails, and FAQ sections tailored to help AI tools understand and recommend your business.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
          <span>Answers &amp; Clarity</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h3>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Everything you need to know about tracking and growing your brand across conversational AI engines.
        </p>
      </div>

      <div className="space-y-3 pt-4">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={cn(
                'rounded-2xl border transition-all overflow-hidden bg-white',
                isOpen
                  ? 'border-slate-300 shadow-sm ring-1 ring-emerald-500/10'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
              >
                <span className="font-semibold text-sm sm:text-base text-slate-900 leading-snug">
                  {faq.question}
                </span>
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200',
                    isOpen
                      ? 'bg-emerald-50 text-emerald-700 rotate-180'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
