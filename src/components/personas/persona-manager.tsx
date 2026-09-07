'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Sparkles,
  ArrowRight,
  Pencil,
  Trash2,
  Check,
  Search,
  MessageSquare,
  Loader2,
  BookmarkPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generateAiPrompts,
  batchCreatePromptAudits,
  type GeneratedPromptSuggestion,
} from '@/app/audits/actions';
import type { Persona } from '@/types/database.types';

interface PersonaManagerProps {
  projectId: string;
  brandName: string;
  personas?: Persona[];
  onPersonasChange?: (personas: Persona[]) => void;
  onSelectPersonaForSimulation?: (persona: Persona) => void;
}

const EMMA_EXAMPLE = {
  nameTitle: '"Emma," Working Mom',
  ageDemographics: '32, suburban resident, household income around $85K.',
  background:
    'Juggles a full-time job and family responsibilities. Exercises early in the morning before the kids wake up.',
  goals:
    'Stay healthy and find durable, high-quality family or fitness products without wasting time.',
  painPoints:
    'Limited free time for shopping trips; easily overwhelmed by too many product choices online.',
  informationSources:
    'Instagram, parenting blogs, and YouTube product reviews.',
  buyingObjections:
    'Concerned about poor product quality, hidden shipping fees, and complicated return policies.',
};

export function PersonaManager({
  projectId,
  brandName,
  personas: controlledPersonas,
  onPersonasChange,
  onSelectPersonaForSimulation,
}: PersonaManagerProps) {
  const [internalPersonas, setInternalPersonas] = useState<Persona[]>(controlledPersonas || []);
  const personas = controlledPersonas ?? internalPersonas;

  const setPersonas = (updater: Persona[] | ((prev: Persona[]) => Persona[])) => {
    if (typeof updater === 'function') {
      const next = updater(personas);
      setInternalPersonas(next);
      onPersonasChange?.(next);
    } else {
      setInternalPersonas(updater);
      onPersonasChange?.(updater);
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);

  // Form states matching the exact format
  const [nameTitle, setNameTitle] = useState('');
  const [ageDemographics, setAgeDemographics] = useState('');
  const [background, setBackground] = useState('');
  const [goals, setGoals] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [informationSources, setInformationSources] = useState('');
  const [buyingObjections, setBuyingObjections] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prompt generation modal state
  const [promptGenPersona, setPromptGenPersona] = useState<Persona | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPromptSuggestion[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  const [isGeneratingPrompts, startGeneratingPrompts] = useTransition();
  const [isAddingPrompts, startAddingPrompts] = useTransition();

  const fetchPersonas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/personas?projectId=${projectId}`);
      const data = await res.json();
      if (data.personas) {
        setPersonas(data.personas);
      } else {
        setPersonas([]);
      }
    } catch (err) {
      console.error('Failed to load personas:', err);
      toast.error('Failed to load personas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, [projectId]);

  const openCreateModal = () => {
    setEditingPersonaId(null);
    setNameTitle('');
    setAgeDemographics('');
    setBackground('');
    setGoals('');
    setPainPoints('');
    setInformationSources('');
    setBuyingObjections('');
    setModalOpen(true);
  };

  const openEditModal = (persona: Persona) => {
    setEditingPersonaId(persona.id);
    setNameTitle(persona.name_title || `"${persona.name}," ${persona.role_title}`);
    setAgeDemographics(persona.age_demographics || '');
    setBackground(persona.background || '');
    setGoals(persona.goals || '');
    setPainPoints(persona.pain_points || '');
    setInformationSources(persona.information_sources || '');
    setBuyingObjections(persona.buying_objections || '');
    setModalOpen(true);
  };

  const loadExampleTemplate = () => {
    setNameTitle(EMMA_EXAMPLE.nameTitle);
    setAgeDemographics(EMMA_EXAMPLE.ageDemographics);
    setBackground(EMMA_EXAMPLE.background);
    setGoals(EMMA_EXAMPLE.goals);
    setPainPoints(EMMA_EXAMPLE.painPoints);
    setInformationSources(EMMA_EXAMPLE.informationSources);
    setBuyingObjections(EMMA_EXAMPLE.buyingObjections);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameTitle.trim()) {
      toast.error('Please enter Name/Title for this persona.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPersonaId || undefined,
          projectId,
          nameTitle,
          ageDemographics,
          background,
          goals,
          painPoints,
          informationSources,
          buyingObjections,
          toneTraits: ['Direct', 'Practical'],
        }),
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(
        editingPersonaId
          ? `Buyer persona "${data.persona.name}" updated!`
          : `Buyer persona "${data.persona.name}" created!`
      );
      setModalOpen(false);
      setEditingPersonaId(null);
      fetchPersonas();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save buyer persona');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (personaId: string) => {
    try {
      const res = await fetch(`/api/personas?id=${personaId}&projectId=${projectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPersonas((prev) => prev.filter((p) => p.id !== personaId));
        toast.success('Buyer persona deleted.');
      } else {
        toast.error(data.error || 'Failed to delete persona.');
      }
    } catch {
      toast.error('Failed to delete persona.');
    }
  };

  // Open prompt generator scoped to this persona
  const handleOpenPromptGen = (persona: Persona) => {
    setPromptGenPersona(persona);
    setGeneratedPrompts([]);
    setSelectedPromptIds(new Set());

    startGeneratingPrompts(async () => {
      try {
        const res = await generateAiPrompts({
          personaId: persona.id,
          count: 4,
          category: 'comparisons',
        });

        if (res.prompts && res.prompts.length > 0) {
          setGeneratedPrompts(res.prompts);
          setSelectedPromptIds(new Set(res.prompts.map((p) => p.id)));
          toast.success(`Generated ${res.prompts.length} questions from ${persona.name}'s perspective!`);
        } else if (res.error) {
          toast.error(res.error);
        }
      } catch (err) {
        toast.error('Failed to generate prompts. Please try again.');
      }
    });
  };

  const toggleSelectPrompt = (id: string) => {
    const next = new Set(selectedPromptIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPromptIds(next);
  };

  const handleAddSelectedPrompts = () => {
    if (selectedPromptIds.size === 0) {
      toast.error('Please select at least one search query.');
      return;
    }

    startAddingPrompts(async () => {
      const itemsToAdd = generatedPrompts
        .filter((p) => selectedPromptIds.has(p.id))
        .map((p) => ({
          queryText: p.query_text,
          category: p.category,
          searchIntent: p.search_intent,
          brandAssociation: p.brand_association,
          frequency: p.recommended_frequency,
          targetEngines: ['chatgpt', 'perplexity', 'gemini', 'claude'],
        }));

      const res = await batchCreatePromptAudits(itemsToAdd);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Added ${res.createdCount || itemsToAdd.length} queries to your tracked searches!`);
      setPromptGenPersona(null);
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Target Audiences
            </span>
            <Badge variant="outline" className="bg-zinc-50 text-zinc-700 text-[11px] py-0 font-sans">
              {personas.length} {personas.length === 1 ? 'Persona' : 'Personas'}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 font-sans">
            Buyer Personas &amp; AI Search Prompts
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 font-sans">
            Define your ideal buyers to simulate the authentic questions they ask ChatGPT, Claude, and Perplexity when making purchasing decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={openCreateModal}
            className="cursor-pointer gap-2 bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs font-sans"
          >
            <Plus className="h-4 w-4" />
            <span>Create Buyer Persona</span>
          </Button>
        </div>
      </div>

      {/* PERSONA CARDS OR ZERO STATE */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200" />
          ))}
        </div>
      ) : personas.length === 0 ? (
        /* ZERO STATE (Default when user first signs up) */
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-zinc-700 shadow-xs border border-zinc-200">
            <Users className="h-6 w-6 text-zinc-800" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-semibold text-zinc-950 font-sans">
              No Buyer Personas Created Yet
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-sans">
              New accounts start with 0 personas by default. Add your customer profiles to evaluate how AI search engines recommend your brand to specific buyer types.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              onClick={openCreateModal}
              className="cursor-pointer gap-2 bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs font-sans"
            >
              <Plus className="h-4 w-4" />
              <span>Create Buyer Persona</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                openCreateModal();
                loadExampleTemplate();
              }}
              className="cursor-pointer gap-1.5 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 text-xs shadow-2xs font-sans"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Load &ldquo;Emma&rdquo; Example Template</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {personas.map((persona) => {
            const displayNameTitle = persona.name_title || `"${persona.name}," ${persona.role_title}`;

            return (
              <Card
                key={persona.id}
                className="border-zinc-200 bg-white shadow-xs hover:border-zinc-300 transition-all rounded-2xl flex flex-col justify-between"
              >
                <CardHeader className="p-6 pb-4 border-b border-zinc-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {persona.name.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                            Persona
                          </span>
                          <Badge variant="outline" className="bg-zinc-50 border-zinc-200 text-zinc-700 text-[10px] py-0">
                            Custom Profile
                          </Badge>
                        </div>
                        <h3 className="text-base font-bold text-zinc-950 truncate font-sans">
                          {displayNameTitle}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Edit Persona"
                        onClick={() => openEditModal(persona)}
                        className="text-zinc-500 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete Persona"
                        onClick={() => handleDelete(persona.id)}
                        className="text-zinc-400 hover:text-rose-600 p-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  {/* The 7 Persona Format Sections */}
                  <div className="space-y-3 font-sans">
                    {/* 1. Name/Title: */}
                    <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-sans block mb-1">
                        Name/Title:
                      </span>
                      <p className="text-sm font-bold text-zinc-950 font-sans leading-snug break-words">
                        {displayNameTitle}
                      </p>
                    </div>

                    {/* 2. Age & Demographics: */}
                    <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-sans block mb-1">
                        Age &amp; Demographics:
                      </span>
                      <p className="text-sm text-zinc-800 font-sans leading-relaxed break-words">
                        {persona.age_demographics || 'Not specified'}
                      </p>
                    </div>

                    {/* 3. Background: */}
                    <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-sans block mb-1">
                        Background:
                      </span>
                      <p className="text-sm text-zinc-800 font-sans leading-relaxed break-words whitespace-pre-wrap">
                        {persona.background || 'Not specified'}
                      </p>
                    </div>

                    {/* 4. Goals: */}
                    <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-sans block mb-1">
                        Goals:
                      </span>
                      <p className="text-sm text-zinc-800 font-sans leading-relaxed break-words whitespace-pre-wrap">
                        {persona.goals || 'Not specified'}
                      </p>
                    </div>

                    {/* 5. Pain Points: */}
                    <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-sans block mb-1">
                        Pain Points:
                      </span>
                      <p className="text-sm text-zinc-800 font-sans leading-relaxed break-words whitespace-pre-wrap">
                        {persona.pain_points || 'Not specified'}
                      </p>
                    </div>

                    {/* 6. Information Sources: */}
                    <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-sans block mb-1">
                        Information Sources:
                      </span>
                      <p className="text-sm text-zinc-800 font-sans leading-relaxed break-words whitespace-pre-wrap">
                        {persona.information_sources || 'Not specified'}
                      </p>
                    </div>

                    {/* 7. Buying Objections: */}
                    <div className="bg-zinc-50/70 rounded-xl p-4 border border-zinc-200/80">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-sans block mb-1">
                        Buying Objections:
                      </span>
                      <p className="text-sm text-zinc-800 font-sans leading-relaxed break-words whitespace-pre-wrap">
                        {persona.buying_objections || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Actions: Generate Prompts & Follow-Up Test */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-150 gap-2 mt-4">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenPromptGen(persona)}
                      className="text-xs gap-1.5 cursor-pointer bg-zinc-950 hover:bg-zinc-800 text-white shadow-2xs font-sans"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Generate Prompts</span>
                    </Button>

                    {onSelectPersonaForSimulation && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectPersonaForSimulation(persona)}
                        className="text-xs gap-1 cursor-pointer hover:bg-zinc-50 border-zinc-200 text-zinc-700 font-sans"
                      >
                        <span>Test Follow-Up Questions</span>
                        <ArrowRight className="h-3 w-3 text-zinc-400" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE / EDIT BUYER PERSONA */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl w-full max-h-[92vh] overflow-y-auto bg-white border-zinc-200 p-6 sm:p-8 rounded-2xl shadow-xl font-sans">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <DialogTitle className="text-xl font-bold text-zinc-950 flex items-center gap-2.5 font-sans">
                <Users className="h-5 w-5 text-zinc-900" />
                <span>{editingPersonaId ? 'Edit Buyer Persona' : 'Create Buyer Persona'}</span>
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadExampleTemplate}
                className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1.5 cursor-pointer font-medium font-sans self-start sm:self-auto"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Fill with &ldquo;Emma&rdquo; Example</span>
              </Button>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-zinc-500 font-sans">
              Provide the details below to define this customer profile. Beacon uses these fields to simulate realistic customer queries and follow-up journeys.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 pt-3 font-sans">
            {/* 1. Name/Title: */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans">
                Name/Title:
              </Label>
              <Input
                placeholder='e.g. "Emma," Working Mom'
                value={nameTitle}
                onChange={(e) => setNameTitle(e.target.value)}
                required
                className="h-11 text-sm bg-white font-sans text-zinc-900 border-zinc-200 focus:ring-zinc-950 focus:border-zinc-950 rounded-xl px-3.5"
              />
            </div>

            {/* 2. Age & Demographics: */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans">
                Age &amp; Demographics:
              </Label>
              <Input
                placeholder="e.g. 32, suburban resident, household income around $85K."
                value={ageDemographics}
                onChange={(e) => setAgeDemographics(e.target.value)}
                className="h-11 text-sm bg-white font-sans text-zinc-900 border-zinc-200 focus:ring-zinc-950 focus:border-zinc-950 rounded-xl px-3.5"
              />
            </div>

            {/* 3. Background: */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans">
                Background:
              </Label>
              <Textarea
                placeholder="e.g. Juggles a full-time job and family responsibilities. Exercises early in the morning before the kids wake up."
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                rows={3}
                className="min-h-[96px] text-sm leading-relaxed bg-white font-sans text-zinc-900 border-zinc-200 focus:ring-zinc-950 focus:border-zinc-950 rounded-xl p-3.5"
              />
            </div>

            {/* 4. Goals: */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans">
                Goals:
              </Label>
              <Textarea
                placeholder="e.g. Stay healthy and find durable, high-quality family or fitness products without wasting time."
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                className="min-h-[96px] text-sm leading-relaxed bg-white font-sans text-zinc-900 border-zinc-200 focus:ring-zinc-950 focus:border-zinc-950 rounded-xl p-3.5"
              />
            </div>

            {/* 5. Pain Points: */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans">
                Pain Points:
              </Label>
              <Textarea
                placeholder="e.g. Limited free time for shopping trips; easily overwhelmed by too many product choices online."
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                rows={3}
                className="min-h-[96px] text-sm leading-relaxed bg-white font-sans text-zinc-900 border-zinc-200 focus:ring-zinc-950 focus:border-zinc-950 rounded-xl p-3.5"
              />
            </div>

            {/* 6. Information Sources: */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans">
                Information Sources:
              </Label>
              <Textarea
                placeholder="e.g. Instagram, parenting blogs, and YouTube product reviews."
                value={informationSources}
                onChange={(e) => setInformationSources(e.target.value)}
                rows={2}
                className="min-h-[72px] text-sm leading-relaxed bg-white font-sans text-zinc-900 border-zinc-200 focus:ring-zinc-950 focus:border-zinc-950 rounded-xl p-3.5"
              />
            </div>

            {/* 7. Buying Objections: */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans">
                Buying Objections:
              </Label>
              <Textarea
                placeholder="e.g. Concerned about poor product quality, hidden shipping fees, and complicated return policies."
                value={buyingObjections}
                onChange={(e) => setBuyingObjections(e.target.value)}
                rows={3}
                className="min-h-[96px] text-sm leading-relaxed bg-white font-sans text-zinc-900 border-zinc-200 focus:ring-zinc-950 focus:border-zinc-950 rounded-xl p-3.5"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer font-sans text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-zinc-950 hover:bg-zinc-800 text-white cursor-pointer shadow-xs font-sans text-sm px-5"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingPersonaId
                  ? 'Update Buyer Persona'
                  : 'Create Buyer Persona'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: GENERATE SEARCH PROMPTS FROM THIS BUYER PERSPECTIVE */}
      <Dialog open={Boolean(promptGenPersona)} onOpenChange={(open) => !open && setPromptGenPersona(null)}>
        <DialogContent className="max-w-xl bg-white border-zinc-200 p-6 rounded-2xl shadow-xl">
          {promptGenPersona && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold text-zinc-950 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <span>Search Questions Asked by: {promptGenPersona.name}</span>
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-zinc-500">
                  These questions represent what {promptGenPersona.name} types into ChatGPT, Perplexity, and Gemini when shopping.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-3">
                {isGeneratingPrompts ? (
                  <div className="p-8 text-center space-y-2">
                    <Loader2 className="h-6 w-6 text-zinc-500 animate-spin mx-auto" />
                    <p className="text-xs text-zinc-600 font-medium">
                      Crafting realistic search questions from {promptGenPersona.name}&apos;s perspective...
                    </p>
                  </div>
                ) : generatedPrompts.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No prompts generated yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {generatedPrompts.map((p) => {
                      const isSelected = selectedPromptIds.has(p.id);

                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleSelectPrompt(p.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-zinc-50 border-zinc-950 shadow-2xs'
                              : 'bg-white border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div
                            className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? 'bg-zinc-950 border-zinc-950 text-white'
                                : 'border-zinc-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>

                          <div className="space-y-1 flex-1">
                            <p className="text-xs font-medium text-zinc-950 leading-snug">
                              &ldquo;{p.query_text}&rdquo;
                            </p>
                            <p className="text-[11px] text-zinc-500 leading-snug">
                              💡 {p.rationale}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPromptGenPersona(null)}
                  className="cursor-pointer text-xs"
                >
                  Close
                </Button>

                <Button
                  type="button"
                  onClick={handleAddSelectedPrompts}
                  disabled={isAddingPrompts || selectedPromptIds.size === 0 || isGeneratingPrompts}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs cursor-pointer gap-2"
                >
                  {isAddingPrompts ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Adding to Dashboard...</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-3.5 w-3.5" />
                      <span>Track Selected Questions ({selectedPromptIds.size})</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
