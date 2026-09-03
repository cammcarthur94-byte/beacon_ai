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
    question: 'What is Generative Engine Optimization (GEO)?',
    answer:
      'Generative Engine Optimization (GEO) is the practice of ensuring AI models—like ChatGPT, Google Gemini, and Perplexity—recommend your brand when prospective customers ask conversational questions. Unlike traditional SEO that targets blue links, GEO focuses on positioning your brand as the direct, authoritative answer syntheses provided by AI.',
  },
  {
    question: 'How does Beacon track what AI engines say about my business?',
    answer:
      'Beacon runs automated daily and weekly query audits across ChatGPT, Gemini, Claude, Perplexity, and Google AI Overviews. We simulate realistic buyer questions in your category, analyze whether your brand is mentioned, measure your AI Share of Voice against competitors, and identify the exact web pages AI engines cite as evidence.',
  },
  {
    question: 'Why did my brand lose citations on Perplexity or ChatGPT?',
    answer:
      'AI models update their citation sources continually. When a competitor publishes more structured comparison data, earns tier-1 press coverage, or gains traction in community forums (like Reddit), AI engines will cite them instead. Beacon Sentinel detects these drops immediately and drafts the exact content needed to reclaim your spot.',
  },
  {
    question: 'How quickly can I start tracking my brand on Beacon?',
    answer:
      'Setup takes under 5 minutes. You simply enter your company domain and core product categories. Beacon instantly calibrates your brand kit, seeds your first audit prompts, and begins telemetry monitoring across all 7 major AI search engines.',
  },
  {
    question: 'Can Beacon help my team create content that AI engines cite?',
    answer:
      'Yes. Beacon Sentinel, your built-in AI co-worker, analyzes citation gaps between your brand and category competitors. It deterministically drafts deploy-ready content blueprints, structured FAQ blocks, and Schema markup tailored specifically to satisfy the entity requirements of AI answer engines.',
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
