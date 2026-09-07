'use client';

import * as React from 'react';
import { useState } from 'react';
import { MultiTurnVisualizer } from '@/components/multi-turn/multi-turn-visualizer';
import { PersonaManager } from '@/components/personas/persona-manager';
import { LlmsTxtGenerator } from '@/components/llms-txt/llms-txt-generator';
import { Users, MessageSquare, FileCode2 } from 'lucide-react';
import type { Persona } from '@/types/database.types';

interface AgenticSuiteClientProps {
  projectId: string;
  brandName: string;
  domain: string;
  initialPersonas?: Persona[];
}

export function AgenticSuiteClient({
  projectId,
  brandName,
  domain,
  initialPersonas = [],
}: AgenticSuiteClientProps) {
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [activeTab, setActiveTab] = useState<'personas' | 'followup' | 'llmstxt'>('personas');
  const [selectedSimulationPersona, setSelectedSimulationPersona] = useState<Persona | null>(null);

  const handleSelectPersonaForSimulation = (persona: Persona) => {
    setSelectedSimulationPersona(persona);
    setActiveTab('followup');
  };

  return (
    <div className="space-y-6">
      {/* NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('personas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'personas'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Buyer Personas</span>
          </button>

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
      {activeTab === 'personas' && (
        <PersonaManager
          projectId={projectId}
          brandName={brandName}
          personas={personas}
          onPersonasChange={setPersonas}
          onSelectPersonaForSimulation={handleSelectPersonaForSimulation}
        />
      )}

      {activeTab === 'followup' && (
        <MultiTurnVisualizer
          projectId={projectId}
          brandName={brandName}
          domain={domain}
          availablePersonas={personas}
          preselectedPersona={selectedSimulationPersona}
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
