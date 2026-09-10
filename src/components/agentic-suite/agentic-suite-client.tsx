'use client';

import * as React from 'react';
import { useState } from 'react';
import { MultiTurnVisualizer } from '@/components/multi-turn/multi-turn-visualizer';
import { LlmsTxtGenerator } from '@/components/llms-txt/llms-txt-generator';
import { MessageSquare, FileCode2 } from 'lucide-react';

interface AgenticSuiteClientProps {
  projectId: string;
  brandName: string;
  domain: string;
}

export function AgenticSuiteClient({
  projectId,
  brandName,
  domain,
}: AgenticSuiteClientProps) {
  const [activeTab, setActiveTab] = useState<'followup' | 'llmstxt'>('followup');

  return (
    <div className="space-y-6">
      {/* NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'followup'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Follow-Up Questions Test</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('llmstxt')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'llmstxt'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <FileCode2 className="h-4 w-4" />
            <span>AI Search Profile (llms.txt)</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'followup' && (
        <MultiTurnVisualizer
          projectId={projectId}
          brandName={brandName}
          domain={domain}
        />
      )}

      {activeTab === 'llmstxt' && (
        <LlmsTxtGenerator
          projectId={projectId}
          brandName={brandName}
          domain={domain}
        />
      )}
    </div>
  );
}
