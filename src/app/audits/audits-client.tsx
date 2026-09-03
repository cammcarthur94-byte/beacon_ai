'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  createPromptAudit,
  togglePromptStatus,
  deletePromptAudit,
  triggerInstantRun,
} from './actions';
import {
  Search,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Shield,
  Zap,
  Filter,
  Tag,
  ListFilter,
  X,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { EngineBadge, EngineIcon, getEngineMeta } from '@/components/ui/engine-badge';
import { GeneratePromptModal } from '@/components/audits/generate-prompt-modal';
import type { SearchIntent, BrandAssociation, BrandKit } from '@/types/database.types';
import { isTierEligibleForGoogleAi } from '@/lib/billing/tier-utils';

export interface AuditPromptItem {
  id: string;
  query_text: string;
  frequency: 'daily' | 'weekly' | 'biweekly';
  target_engines: string[];
  search_intent?: SearchIntent;
  brand_association?: BrandAssociation;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string;
  latest_score?: number;
}

const AVAILABLE_ENGINES = [
  { id: 'chatgpt', label: 'ChatGPT 4o', isGated: false },
  { id: 'gemini', label: 'Gemini 1.5 Pro', isGated: false },
  { id: 'claude', label: 'Claude 3.5', isGated: false },
  { id: 'perplexity', label: 'Perplexity Sonar', isGated: false },
  { id: 'google_ai_overview', label: 'Google AI Overview', isGated: true },
  { id: 'google_ai_mode', label: 'Google AI Mode', isGated: true },
];

function getIntentBadgeMeta(intent: SearchIntent) {
  switch (intent) {
    case 'commercial':
      return {
        label: 'Commercial Intent',
        className: 'bg-amber-100 text-amber-950 border-amber-300 font-bold',
        dotColor: 'bg-amber-600',
      };
    case 'transactional':
      return {
        label: 'Transactional',
        className: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold',
        dotColor: 'bg-emerald-600',
      };
    case 'navigational':
      return {
        label: 'Navigational',
        className: 'bg-purple-100 text-purple-950 border-purple-300 font-bold',
        dotColor: 'bg-purple-600',
      };
    case 'informational':
    default:
      return {
        label: 'Informational',
        className: 'bg-blue-100 text-blue-950 border-blue-300 font-bold',
        dotColor: 'bg-blue-600',
      };
  }
}

function getAssociationBadgeMeta(association: BrandAssociation) {
  if (association === 'branded') {
    return {
      label: 'Branded Query',
      className: 'bg-indigo-100 text-indigo-950 border-indigo-300 font-bold',
      dotColor: 'bg-indigo-600',
    };
  }
  return {
    label: 'Unbranded Query',
    className: 'bg-slate-200 text-slate-900 border-slate-300 font-bold',
    dotColor: 'bg-slate-500',
  };
}

interface AuditsClientViewProps {
  initialPrompts: AuditPromptItem[];
  project?: {
    id: string;
    name: string;
    domain: string;
    tier: string;
    brand_kit?: BrandKit;
  } | null;
}

export function AuditsClientView({ initialPrompts, project }: AuditsClientViewProps) {
  const [prompts, setPrompts] = useState<AuditPromptItem[]>(initialPrompts);
  const [isCreating, setIsCreating] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [runningPromptId, setRunningPromptId] = useState<string | null>(null);

  // Form State
  const [queryText, setQueryText] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly'>('daily');
  const [searchIntent, setSearchIntent] = useState<SearchIntent>('commercial');
  const [brandAssociation, setBrandAssociation] = useState<BrandAssociation>('unbranded');
  const [selectedEngines, setSelectedEngines] = useState<string[]>([
    'chatgpt',
    'gemini',
    'claude',
    'perplexity',
  ]);

  // Filtering State
  const [searchFilter, setSearchFilter] = useState('');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [associationFilter, setAssociationFilter] = useState<string>('all');

  const rawIndustry = (project?.brand_kit?.industry || '').toLowerCase();
  const brandName = project?.name || 'Brand';
  const isConsumer =
    rawIndustry.includes('retail') ||
    rawIndustry.includes('commerce') ||
    rawIndustry.includes('apparel') ||
    rawIndustry.includes('footwear') ||
    rawIndustry.includes('fashion') ||
    rawIndustry.includes('sport') ||
    rawIndustry.includes('fitness') ||
    rawIndustry.includes('athleisure') ||
    brandName.toLowerCase().includes('nike') ||
    brandName.toLowerCase().includes('lululemon');

  const placeholderText = isConsumer
    ? 'e.g. "Best buttery-soft yoga leggings for studio workouts in 2026"'
    : `e.g. "What are the best ${project?.brand_kit?.core_offerings || brandName || 'software'} platforms in 2026?"`;

  const hasProTier = isTierEligibleForGoogleAi(project?.tier);

  const toggleEngine = (engineId: string) => {
    const target = AVAILABLE_ENGINES.find((e) => e.id === engineId);
    if (target?.isGated && !hasProTier) {
      toast.error('Google AI Tracking is a Pro Tier feature.', {
        action: {
          label: 'Upgrade to Pro',
          onClick: () => {
            window.location.href = '/settings/billing';
          },
        },
      });
      return;
    }

    setSelectedEngines((prev) =>
      prev.includes(engineId)
        ? prev.filter((id) => id !== engineId)
        : [...prev, engineId]
    );
  };

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) {
      toast.error('Please enter a query phrase.');
      return;
    }
    if (selectedEngines.length === 0) {
      toast.error('Please select at least one search engine.');
      return;
    }

    const formData = new FormData();
    formData.append('queryText', queryText.trim());
    formData.append('frequency', frequency);
    formData.append('searchIntent', searchIntent);
    formData.append('brandAssociation', brandAssociation);
    selectedEngines.forEach((eng) => formData.append('targetEngines', eng));

    startTransition(async () => {
      const res = await createPromptAudit(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Audit prompt registered and initial evaluation completed!');
        setQueryText('');
        setIsCreating(false);
      }
    });
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
      );
      const res = await togglePromptStatus(id, currentStatus);
      if (res?.error) {
        toast.error(res.error);
        setPrompts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: currentStatus } : p))
        );
      } else {
        toast.success(currentStatus ? 'Prompt paused.' : 'Prompt resumed.');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt audit tracker?')) return;
    startTransition(async () => {
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      const res = await deletePromptAudit(id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Prompt tracker removed.');
      }
    });
  };

  const handleRunNow = (id: string) => {
    setRunningPromptId(id);
    startTransition(async () => {
      toast.info('Dispatching prompt across target answer engines...');
      const res = await triggerInstantRun(id);
      setRunningPromptId(null);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Instant audit completed! Scores updated.');
      }
    });
  };

  // Filtered prompts
  const filteredPrompts = prompts.filter((p) => {
    const matchesText = p.query_text.toLowerCase().includes(searchFilter.toLowerCase().trim());
    const matchesIntent =
      intentFilter === 'all' || (p.search_intent || 'informational') === intentFilter;
    const matchesAssociation =
      associationFilter === 'all' || (p.brand_association || 'unbranded') === associationFilter;
    return matchesText && matchesIntent && matchesAssociation;
  });

  const hasActiveFilters = intentFilter !== 'all' || associationFilter !== 'all' || searchFilter !== '';

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & ADD PROMPT TRIGGER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Active Query Monitors
          </h2>
          <p className="text-xs text-slate-500">
            Real-time answer engine trackers monitoring visibility, rank placement, and cited source URLs.
          </p>
        </div>

        {/* ACTIONS ROW: GENERATE WITH AI + ADD TRACKING PHRASE */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAiModalOpen(true)}
            className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-950 text-xs font-semibold shadow-2xs gap-1.5 cursor-pointer h-9 px-3.5 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Generate Prompt with AI</span>
          </Button>

          {/* SHADCN DIALOG: ADD TRACKING PHRASE */}
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs gap-1.5 cursor-pointer h-9 px-3.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Tracking Phrase</span>
              </Button>
            </DialogTrigger>

          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-zinc-950">
                <Sparkles className="h-4 w-4 text-zinc-600" />
                Configure New Prompt Tracker
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Input a conversational query your prospective buyers type into answer engines.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreatePrompt}>
              <div className="space-y-5 px-6 py-5 max-h-[75vh] overflow-y-auto">
                {/* Multi-line Textarea with industry-tailored placeholder */}
                <div className="space-y-1.5">
                  <Label htmlFor="audit-query" className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-sans">
                    Prompt / Query Phrase
                  </Label>
                  <Textarea
                    id="audit-query"
                    rows={3}
                    placeholder={placeholderText}
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    autoFocus
                    className="text-xs font-sans leading-relaxed resize-none"
                  />
                  <p className="text-[11px] text-slate-400 font-sans">
                    Phrase the query naturally as prospective buyers ask ChatGPT, Gemini, Claude, or Perplexity.
                  </p>
                </div>

                {/* Side-by-Side Select Dropdowns for Intent & Brand Association */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Intent Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <ListFilter className="h-3.5 w-3.5 text-slate-500" />
                      Search Intent
                    </Label>
                    <Select
                      value={searchIntent}
                      onValueChange={(val) => setSearchIntent(val as SearchIntent)}
                    >
                      <SelectTrigger className="w-full capitalize font-sans">
                        <SelectValue placeholder="Select intent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informational">Informational (How-to, Guides, FAQs)</SelectItem>
                        <SelectItem value="commercial">Commercial (Best tools, Reviews, Comparisons)</SelectItem>
                        <SelectItem value="transactional">Transactional (Pricing, Buy, Sign-up)</SelectItem>
                        <SelectItem value="navigational">Navigational (Brand portal, Login)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand Association Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-slate-500" />
                      Brand Association
                    </Label>
                    <Select
                      value={brandAssociation}
                      onValueChange={(val) => setBrandAssociation(val as BrandAssociation)}
                    >
                      <SelectTrigger className="w-full capitalize font-sans">
                        <SelectValue placeholder="Select association" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unbranded">Unbranded (Category search without brand name)</SelectItem>
                        <SelectItem value="branded">Branded (Includes your brand name in query)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Execution Cadence */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Execution Frequency
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['daily', 'weekly', 'biweekly'] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setFrequency(freq)}
                        className={`text-xs py-2 px-3 rounded-md border font-sans font-medium capitalize transition-all cursor-pointer text-center ${
                          frequency === freq
                            ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Engines: Generous 4-column horizontal grid */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-zinc-500" />
                    Target Answer Engines
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {AVAILABLE_ENGINES.map((eng) => {
                      const isChecked = selectedEngines.includes(eng.id);
                      const isLocked = eng.isGated && !hasProTier;

                      if (isLocked) {
                        return (
                          <Link
                            key={eng.id}
                            href="/settings/billing"
                            className="group relative flex flex-col gap-1.5 p-2.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50/80 transition-all text-xs cursor-pointer shadow-2xs"
                            title="Upgrade to Pro Tier to unlock Google AI Mode & AI Overviews tracking"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-sm border border-amber-300 bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                                  <Lock className="h-2.5 w-2.5" />
                                </div>
                                <EngineBadge engine={eng.id} size="sm" showLabel={true} />
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-800 font-medium group-hover:underline">
                              Pro Feature - Upgrade to Unlock Google AI Tracking &rarr;
                            </span>
                          </Link>
                        );
                      }

                      return (
                        <div
                          key={eng.id}
                          onClick={() => toggleEngine(eng.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'border-zinc-900 bg-zinc-50/80 text-zinc-950 font-medium ring-1 ring-zinc-900 shadow-2xs'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-zinc-300 bg-white'
                            }`}
                          >
                            {isChecked && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                          <EngineBadge engine={eng.id} size="sm" showLabel={true} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dialog Footer */}
              <DialogFooter className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-2 bg-zinc-50/50 mt-0">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium shadow-xs cursor-pointer px-4"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Saving & Evaluating...
                    </>
                  ) : (
                    'Save Tracker & Run Initial Audit'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* FILTER CONTROLS BAR (SEARCH + INTENT & ASSOCIATION DROPDOWN FILTERS) */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search tracking phrases (e.g. running shoes, spend management)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 bg-white border-zinc-200 text-xs h-9"
          />
        </div>

        {/* Intent Dropdown Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-slate-200 bg-white font-sans font-medium text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <ListFilter className="h-3.5 w-3.5 text-slate-500" />
              <span>
                Intent: {intentFilter === 'all' ? 'All' : intentFilter}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Search Intent</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIntentFilter('all')}>
              All Intents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIntentFilter('informational')}>
              Informational
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIntentFilter('commercial')}>
              Commercial
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIntentFilter('transactional')}>
              Transactional
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIntentFilter('navigational')}>
              Navigational
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Brand Association Dropdown Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-slate-200 bg-white font-sans font-medium text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <Tag className="h-3.5 w-3.5 text-slate-500" />
              <span>
                Association: {associationFilter === 'all' ? 'All' : associationFilter}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Brand Association</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setAssociationFilter('all')}>
              All Associations
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAssociationFilter('branded')}>
              Branded
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAssociationFilter('unbranded')}>
              Unbranded
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchFilter('');
              setIntentFilter('all');
              setAssociationFilter('all');
            }}
            className="h-9 px-2 text-xs text-slate-500 hover:text-slate-950 font-sans font-medium"
          >
            <X className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* PROMPTS TABLE */}
      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/90 border-b border-slate-200">
                <TableHead className="w-[380px] font-semibold text-xs text-slate-700 px-4 sm:px-6 py-3.5">
                  Tracking Phrase
                </TableHead>
                <TableHead className="font-semibold text-xs text-slate-700 py-3.5">Frequency</TableHead>
                <TableHead className="font-semibold text-xs text-slate-700 py-3.5">Target Engines</TableHead>
                <TableHead className="font-semibold text-xs text-slate-700 py-3.5">Status</TableHead>
                <TableHead className="font-semibold text-xs text-slate-700 py-3.5">Last Audit Scan</TableHead>
                <TableHead className="font-semibold text-xs text-slate-700 py-3.5">Next Scheduled</TableHead>
                <TableHead className="text-right font-semibold text-xs text-slate-700 py-3.5 pr-4 sm:pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-xs font-mono">
                    No active audit prompts match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrompts.map((p) => {
                  const isRunningThis = runningPromptId === p.id;
                  const intent = p.search_intent || 'informational';
                  const association = p.brand_association || 'unbranded';
                  const intentMeta = getIntentBadgeMeta(intent);
                  const assocMeta = getAssociationBadgeMeta(association);

                  return (
                    <TableRow key={p.id} className="group hover:bg-slate-50/60 transition-colors border-b border-slate-200/80">
                      {/* Tracking Phrase with stacked distinct Intent & Association Badges beneath */}
                      <TableCell className="py-4 px-4 sm:px-6 align-top">
                        <div className="flex flex-col space-y-2.5">
                          <Link
                            href={`/audits/${p.id}`}
                            className="hover:underline inline-flex items-start gap-1.5 text-slate-900 hover:text-emerald-700 transition-colors font-medium text-sm leading-snug group/link"
                          >
                            <span>&ldquo;{p.query_text}&rdquo;</span>
                            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-emerald-600 transition-colors shrink-0 mt-0.5" />
                          </Link>

                          {/* Bold, prominent, highly legible Intent & Association Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md border shadow-2xs',
                                intentMeta.className
                              )}
                            >
                              <span className={cn('h-2 w-2 rounded-full shrink-0', intentMeta.dotColor)} />
                              <span>{intentMeta.label}</span>
                            </span>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md border shadow-2xs',
                                assocMeta.className
                              )}
                            >
                              <span className={cn('h-2 w-2 rounded-full shrink-0', assocMeta.dotColor)} />
                              <span>{assocMeta.label}</span>
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Frequency */}
                      <TableCell className="py-4 align-top">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-mono capitalize border-slate-200 bg-slate-50 text-slate-700 font-medium"
                        >
                          {p.frequency}
                        </Badge>
                      </TableCell>

                      {/* Target Engines with Official SVG Brand Logos */}
                      <TableCell className="py-4 align-top">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {p.target_engines?.map((eng) => {
                            const meta = getEngineMeta(eng);
                            return (
                              <span
                                key={eng}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border shadow-2xs transition-colors',
                                  meta.colorClass
                                )}
                              >
                                <EngineIcon engine={eng} size={12} className={meta.iconColor} />
                                <span className="leading-none text-slate-800 font-medium">{meta.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-4 align-top">
                        {p.is_active ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 border-emerald-200 text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-100 border-slate-200 text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <span>Paused</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Last Audit Scan */}
                      <TableCell className="py-4 align-top font-mono text-xs text-slate-700">
                        {p.last_run_at ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{new Date(p.last_run_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Next Scheduled */}
                      <TableCell className="py-4 align-top font-mono text-xs text-slate-600">
                        {p.is_active ? (
                          <span>{new Date(p.next_run_at).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-4 align-top text-right pr-4 sm:pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {/* Run Now Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending || isRunningThis}
                            onClick={() => handleRunNow(p.id)}
                            title="Run Audit Now"
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          >
                            {isRunningThis ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>

                          {/* Pause / Resume Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => handleToggleActive(p.id, p.is_active)}
                            title={p.is_active ? 'Pause Tracking' : 'Resume Tracking'}
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          >
                            {p.is_active ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </Button>

                          {/* Delete Prompt Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => handleDelete(p.id)}
                            title="Delete Prompt"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI PROMPT GENERATOR MODAL */}
      <GeneratePromptModal
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        brandName={brandName}
        onPromptsAdded={(newPrompts) => {
          setPrompts((prev) => [...newPrompts, ...prev]);
        }}
      />
    </div>
  );
}
