'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  Check,
  Plus,
  Compass,
  Repeat,
  ShoppingBag,
  Star,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  generateAiPrompts,
  batchCreatePromptAudits,
  type GeneratedPromptSuggestion,
  type BatchPromptInput,
} from '@/app/audits/actions';
import { EngineIcon, getEngineMeta } from '@/components/ui/engine-badge';
import type { SearchIntent, BrandAssociation, AuditFrequency } from '@/types/database.types';

interface GeneratePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromptsAdded: (newPrompts: any[]) => void;
  brandName?: string;
}

const CATEGORIES = [
  { id: 'comparisons', label: 'Product Comparisons', icon: Repeat, desc: 'Side-by-side rival evaluations' },
  { id: 'discovery', label: 'Top-of-Funnel Discovery', icon: Compass, desc: 'Unbranded generic searches' },
  { id: 'buying_guides', label: 'Buying Guides', icon: ShoppingBag, desc: 'High-intent purchasing advice' },
  { id: 'features', label: 'Feature Reviews', icon: Star, desc: 'Fit, quality & durability queries' },
  { id: 'alternatives', label: 'Competitor Alternatives', icon: Layers, desc: 'Conquesting & alternative lists' },
];

const INTENTS: Array<{ id: SearchIntent | 'all'; label: string }> = [
  { id: 'all', label: 'All Intents' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'transactional', label: 'Transactional' },
  { id: 'informational', label: 'Informational' },
];

const ASSOCIATIONS: Array<{ id: BrandAssociation | 'both'; label: string }> = [
  { id: 'both', label: 'Both (Balanced)' },
  { id: 'branded', label: 'Branded' },
  { id: 'unbranded', label: 'Unbranded' },
];

const DEFAULT_ENGINES = ['chatgpt', 'gemini', 'claude', 'perplexity'];

export function GeneratePromptModal({
  open,
  onOpenChange,
  onPromptsAdded,
  brandName = 'Your Brand',
}: GeneratePromptModalProps) {
  const [category, setCategory] = useState('comparisons');
  const [searchIntent, setSearchIntent] = useState<SearchIntent | 'all'>('all');
  const [brandAssociation, setBrandAssociation] = useState<BrandAssociation | 'both'>('both');
  const [selectedEngines, setSelectedEngines] = useState<string[]>(DEFAULT_ENGINES);

  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPromptSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [frequencies, setFrequencies] = useState<Record<string, AuditFrequency>>({});

  const [isGenerating, startGenerating] = useTransition();
  const [isAdding, startAdding] = useTransition();

  const handleGenerate = () => {
    startGenerating(async () => {
      try {
        const res = await generateAiPrompts({
          category,
          searchIntent,
          brandAssociation,
          count: 5,
        });

        if (res.error) {
          toast.error(res.error);
          return;
        }

        if (res.prompts && res.prompts.length > 0) {
          setGeneratedPrompts(res.prompts);
          // By default, select all generated items
          setSelectedIds(new Set(res.prompts.map((p) => p.id)));
          // Seed frequencies
          const freqMap: Record<string, AuditFrequency> = {};
          res.prompts.forEach((p) => {
            freqMap[p.id] = p.recommended_frequency;
          });
          setFrequencies(freqMap);
          toast.success(`Generated ${res.prompts.length} high-intent prompts!`);
        }
      } catch (err: any) {
        toast.error('Failed to generate prompts. Please try again.');
      }
    });
  };

  const toggleSelectPrompt = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === generatedPrompts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(generatedPrompts.map((p) => p.id)));
    }
  };

  const toggleEngine = (engineId: string) => {
    if (selectedEngines.includes(engineId)) {
      if (selectedEngines.length > 1) {
        setSelectedEngines(selectedEngines.filter((e) => e !== engineId));
      } else {
        toast.error('At least one search engine must remain selected.');
      }
    } else {
      setSelectedEngines([...selectedEngines, engineId]);
    }
  };

  const setPromptFrequency = (id: string, freq: AuditFrequency) => {
    setFrequencies((prev) => ({ ...prev, [id]: freq }));
  };

  const handleBatchAdd = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one prompt to add.');
      return;
    }

    startAdding(async () => {
      try {
        const itemsToAdd: BatchPromptInput[] = generatedPrompts
          .filter((p) => selectedIds.has(p.id))
          .map((p) => ({
            queryText: p.query_text,
            frequency: frequencies[p.id] || p.recommended_frequency || 'daily',
            targetEngines: selectedEngines,
            searchIntent: p.search_intent,
            brandAssociation: p.brand_association,
          }));

        const res = await batchCreatePromptAudits(itemsToAdd);

        if (res.error) {
          toast.error(res.error);
          return;
        }

        toast.success(`Added ${itemsToAdd.length} prompts to active telemetry trackers!`);
        if (res.newItems) {
          onPromptsAdded(res.newItems);
        }
        onOpenChange(false);
      } catch (err: any) {
        toast.error('Failed to save prompts. Please try again.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden font-sans border-slate-200">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2.5 py-0.5 text-xs font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Telemetry Generator</span>
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Generate Buyer Search Prompts with AI
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-600 font-normal">
            Beacon analyzes your active workspace profile, competitors, and products to synthesize the exact conversational queries prospects ask AI engines.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Configuration Form Controls */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                1. Prompt Category Focus
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const isSelected = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        'flex flex-col text-left p-3 rounded-lg border text-xs transition-all cursor-pointer',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold shadow-2xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('h-3.5 w-3.5', isSelected ? 'text-emerald-600' : 'text-slate-500')} />
                        <span className="font-semibold truncate">{c.label}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-normal mt-1 truncate">{c.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intent & Association Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Intent */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  2. Search Intent Preference
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INTENTS.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setSearchIntent(i.id)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-md border font-medium transition-colors cursor-pointer',
                        searchIntent === i.id
                          ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Association */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  3. Brand Association
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ASSOCIATIONS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setBrandAssociation(a.id)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-md border font-medium transition-colors cursor-pointer',
                        brandAssociation === a.id
                          ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trigger Generation Button */}
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-2 px-5 h-9"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Queries with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{generatedPrompts.length > 0 ? 'Regenerate Suggestions' : 'Generate Prompts'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results List Section */}
          {generatedPrompts.length > 0 && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Generated Suggestions ({generatedPrompts.length})
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    · {selectedIds.size} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-slate-600 hover:text-slate-950 font-medium hover:underline cursor-pointer"
                  >
                    {selectedIds.size === generatedPrompts.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Engine Target Row for the batch */}
              <div className="flex items-center gap-2 flex-wrap p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Assign Engines:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['chatgpt', 'perplexity', 'claude', 'gemini'].map((eng) => {
                    const meta = getEngineMeta(eng);
                    const isSelected = selectedEngines.includes(eng);
                    return (
                      <button
                        key={eng}
                        type="button"
                        onClick={() => toggleEngine(eng)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer',
                          isSelected
                            ? cn(meta.colorClass, 'font-semibold shadow-2xs')
                            : 'bg-white border-slate-200 text-slate-400 opacity-60 hover:opacity-100'
                        )}
                      >
                        <EngineIcon engine={eng} size={13} className={isSelected ? meta.iconColor : 'text-slate-400'} />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5">
                {generatedPrompts.map((p) => {
                  const isChecked = selectedIds.has(p.id);
                  const currentFreq = frequencies[p.id] || p.recommended_frequency || 'daily';

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelectPrompt(p.id)}
                      className={cn(
                        'group p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                        isChecked
                          ? 'border-emerald-300 bg-emerald-50/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 opacity-70 hover:opacity-100'
                      )}
                    >
                      {/* Left: Checkbox + Query + Badges */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={cn(
                            'h-5 w-5 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-colors',
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white group-hover:border-slate-400'
                          )}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-3" />}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <p className="text-sm font-medium text-slate-900 leading-snug">
                            &ldquo;{p.query_text}&rdquo;
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Intent Badge */}
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider shadow-2xs',
                                p.search_intent === 'commercial' && 'bg-amber-100 text-amber-950 border-amber-300',
                                p.search_intent === 'transactional' && 'bg-emerald-100 text-emerald-950 border-emerald-300',
                                p.search_intent === 'informational' && 'bg-blue-100 text-blue-950 border-blue-300',
                                p.search_intent === 'navigational' && 'bg-purple-100 text-purple-950 border-purple-300'
                              )}
                            >
                              {p.search_intent}
                            </span>

                            {/* Association Badge */}
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border capitalize shadow-2xs',
                                p.brand_association === 'branded'
                                  ? 'bg-indigo-100 text-indigo-950 border-indigo-300'
                                  : 'bg-slate-200 text-slate-900 border-slate-300'
                              )}
                            >
                              {p.brand_association}
                            </span>

                            {/* Rationale description */}
                            {p.rationale && (
                              <span className="text-[11px] text-slate-500 font-normal italic truncate max-w-sm">
                                {p.rationale}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Cadence toggle */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 self-end sm:self-center shrink-0"
                      >
                        {(['daily', 'weekly'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setPromptFrequency(p.id, f)}
                            className={cn(
                              'px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md border transition-colors cursor-pointer',
                              currentFreq === f
                                ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                            )}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 px-6 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isAdding || selectedIds.size === 0}
            onClick={handleBatchAdd}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-2 px-5 h-9"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Adding to Trackers...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add {selectedIds.size} to Active Trackers</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
