'use client';

import * as React from 'react';
import { EngineIcon } from '@/components/ui/engine-badge';

interface EngineItem {
  id: string;
  name: string;
  shortLabel: string;
  domain: string;
  iconColor: string;
}

const ENGINES: EngineItem[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT (GPT-4o)',
    shortLabel: 'ChatGPT',
    domain: 'chatgpt.com',
    iconColor: 'text-[#10a37f]',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    shortLabel: 'Perplexity',
    domain: 'perplexity.ai',
    iconColor: 'text-[#06b6d4]',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    shortLabel: 'Claude',
    domain: 'claude.ai',
    iconColor: 'text-[#d97706]',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    shortLabel: 'Gemini',
    domain: 'gemini.google.com',
    iconColor: 'text-[#1a73e8]',
  },
  {
    id: 'google_ai_overview',
    name: 'Google AI Overviews',
    shortLabel: 'AI Overviews',
    domain: 'google.com',
    iconColor: 'text-[#4285F4]',
  },
  {
    id: 'google_ai_mode',
    name: 'Google AI Mode',
    shortLabel: 'AI Mode',
    domain: 'google.com',
    iconColor: 'text-[#7C3AED]',
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    shortLabel: 'Copilot',
    domain: 'bing.com',
    iconColor: 'text-[#0078D4]',
  },
  {
    id: 'chatgpt_search',
    name: 'ChatGPT Search',
    shortLabel: 'ChatGPT Search',
    domain: 'chatgpt.com',
    iconColor: 'text-[#10a37f]',
  },
];

function ModelFaviconItem({ engine }: { engine: EngineItem }) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      title={engine.name}
      className="group relative flex flex-col items-center gap-2 cursor-pointer select-none"
    >
      {/* Favicon container with smooth hover scale expansion */}
      <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-2 transition-all duration-200 group-hover:scale-125 group-hover:shadow-md group-hover:border-slate-300">
        {!imgError ? (
          <img
            src={`https://www.google.com/s2/favicons?domain=${engine.domain}&sz=128`}
            alt={engine.name}
            width={24}
            height={24}
            loading="lazy"
            className="h-5 w-5 sm:h-6 sm:w-6 object-contain drop-shadow-2xs transition-transform duration-200"
            onError={() => setImgError(true)}
          />
        ) : (
          <EngineIcon
            engine={engine.id}
            size={22}
            className={`${engine.iconColor} transition-transform duration-200`}
          />
        )}
      </div>

      {/* Label under icon */}
      <span className="text-[11px] sm:text-xs font-medium text-slate-600 group-hover:text-slate-950 transition-colors text-center whitespace-nowrap">
        {engine.shortLabel}
      </span>
    </div>
  );
}

export function EngineFaviconsRow() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-2">
      {/* Unboxed social-proof eyebrow */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Continuous 24/7 monitoring across:
        </p>
      </div>

      {/* 8 Model Favicons in clean unboxed row with hover scale expansion */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-7">
        {ENGINES.map((engine) => (
          <ModelFaviconItem key={engine.id} engine={engine} />
        ))}
      </div>
    </div>
  );
}

export const EngineMarquee = EngineFaviconsRow;
export const SupportedEnginesRow = EngineFaviconsRow;

