'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  INDUSTRY_TAXONOMY,
  GEOGRAPHIC_REGIONS,
  TONE_DIMENSIONS_CONFIG,
  CATEGORIZED_TONE_TAGS,
  compileToneOfVoice,
  interpretSliderPole,
  normalizeNegativeKeywords,
} from '@/lib/brand-kit/taxonomy';
import { updateProjectSettings } from '@/app/settings/actions';
import {
  Sparkles,
  Loader2,
  Building,
  Target,
  Globe2,
  ShieldAlert,
  Layers,
  Volume2,
  Tag,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  BrandKit,
  NegativeExclusionItem,
  NegativeExclusionSeverity,
} from '@/types/database.types';

interface BrandKitViewProps {
  project: {
    id: string;
    name: string;
    domain: string;
    tier?: string;
    brand_kit: BrandKit;
  };
}

export function BrandKitView({ project }: BrandKitViewProps) {
  const [isPending, startTransition] = useTransition();

  // Workspace basics
  const brandName = project.name || 'Your Brand';
  const domain = project.domain || '';

  // 1. Standardized Taxonomy
  const initialSector =
    project.brand_kit?.industry_taxonomy?.sector ||
    INDUSTRY_TAXONOMY[0].name;
  const matchedSector = INDUSTRY_TAXONOMY.find((s) => s.name === initialSector) || INDUSTRY_TAXONOMY[0];
  const initialCategory =
    project.brand_kit?.industry_taxonomy?.category ||
    matchedSector.categories[0];

  const [selectedSector, setSelectedSector] = useState(initialSector);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const activeSectorObj = INDUSTRY_TAXONOMY.find((s) => s.name === selectedSector) || INDUSTRY_TAXONOMY[0];

  const handleSectorChange = (newSectorName: string) => {
    setSelectedSector(newSectorName);
    const sectorObj = INDUSTRY_TAXONOMY.find((s) => s.name === newSectorName);
    if (sectorObj && sectorObj.categories.length > 0) {
      setSelectedCategory(sectorObj.categories[0]);
    }
  };

  // 2. Target Audience & Category Pillars (SKU details removed)
  const [targetAudience, setTargetAudience] = useState(
    project.brand_kit?.target_audience ||
      'Mindful movement practitioners, yoga & Pilates enthusiasts, and fitness lifestyle consumers'
  );
  const [coreOfferings, setCoreOfferings] = useState(
    project.brand_kit?.core_offerings ||
      'Premium Performance Activewear, Technical Outerwear, Everyday Movement Essentials'
  );

  // 3. Competitor Benchmarking
  const [competitors, setCompetitors] = useState<{ name: string; domain: string }[]>(
    project.brand_kit?.competitors && project.brand_kit.competitors.length > 0
      ? project.brand_kit.competitors
      : [
          { name: 'Alo Yoga', domain: 'aloyoga.com' },
          { name: 'Vuori', domain: 'vuoriclothing.com' },
          { name: 'Athleta', domain: 'athleta.gap.com' },
        ]
  );

  const handleAddCompetitor = () => {
    setCompetitors((prev) => [...prev, { name: '', domain: '' }]);
  };

  const handleRemoveCompetitor = (idx: number) => {
    if (competitors.length === 1) return;
    setCompetitors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCompetitorChange = (idx: number, field: 'name' | 'domain', value: string) => {
    setCompetitors((prev) => {
      const next = [...prev];
      next[idx][field] = value;
      return next;
    });
  };

  // 4. Geographic Target Markets
  const [targetRegions, setTargetRegions] = useState<string[]>(
    project.brand_kit?.target_regions && project.brand_kit.target_regions.length > 0
      ? project.brand_kit.target_regions
      : ['Global / Worldwide', 'North America (US & Canada)']
  );

  const handleToggleRegion = (regionLabel: string) => {
    setTargetRegions((prev) =>
      prev.includes(regionLabel)
        ? prev.length > 1
          ? prev.filter((r) => r !== regionLabel)
          : prev
        : [...prev, regionLabel]
    );
  };

  // 5. Negative Keywords & Exclusions with Severity Weighting
  const [negativeKeywords, setNegativeKeywords] = useState<NegativeExclusionItem[]>(() => {
    const raw = project.brand_kit?.negative_keywords || [
      'fast fashion',
      'cheap dupes',
      'discount outlet',
      'drop-shipping',
    ];
    return normalizeNegativeKeywords(raw);
  });
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newKeywordSeverity, setNewKeywordSeverity] = useState<NegativeExclusionSeverity>('strict');

  const handleAddNegativeKeyword = () => {
    const trimmed = newKeywordInput.trim().toLowerCase();
    if (trimmed && !negativeKeywords.some((item) => item.term.toLowerCase() === trimmed)) {
      setNegativeKeywords((prev) => [...prev, { term: trimmed, severity: newKeywordSeverity }]);
      setNewKeywordInput('');
    }
  };

  const handleToggleSeverity = (idx: number) => {
    setNegativeKeywords((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        severity: next[idx].severity === 'strict' ? 'mild' : 'strict',
      };
      return next;
    });
  };

  const handleRemoveNegativeKeyword = (idx: number) => {
    setNegativeKeywords((prev) => prev.filter((_, i) => i !== idx));
  };

  // 6. Key Messaging Pillars (3 to 4 core value propositions)
  const defaultPillars = [
    'Proprietary Technical Fabric Innovation',
    'Mindful Movement & Wellness Community',
    'Elevated Performance Luxury',
    'Sustainable Longevity & Durability',
  ];
  const [messagingPillars, setMessagingPillars] = useState<string[]>(
    project.brand_kit?.messaging_pillars && project.brand_kit.messaging_pillars.length > 0
      ? project.brand_kit.messaging_pillars
      : defaultPillars
  );

  const handlePillarChange = (idx: number, val: string) => {
    setMessagingPillars((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleAddPillar = () => {
    if (messagingPillars.length < 4) {
      setMessagingPillars((prev) => [...prev, '']);
    }
  };

  const handleRemovePillar = (idx: number) => {
    if (messagingPillars.length > 3) {
      setMessagingPillars((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  // 7. Tone of Voice UI (Weighted Sliders + Tone Tag Badges)
  const [toneDimensions, setToneDimensions] = useState({
    formal_casual: project.brand_kit?.tone_dimensions?.formal_casual ?? 45,
    technical_accessible: project.brand_kit?.tone_dimensions?.technical_accessible ?? 70,
    bold_understated: project.brand_kit?.tone_dimensions?.bold_understated ?? 40,
    analytical_inspiring: project.brand_kit?.tone_dimensions?.analytical_inspiring ?? 80,
  });

  const [toneTags, setToneTags] = useState<string[]>(
    project.brand_kit?.tone_tags && project.brand_kit.tone_tags.length > 0
      ? project.brand_kit.tone_tags
      : ['Empowering', 'Mindful', 'Technical', 'Elevated']
  );

  const [toneTagsDrawerOpen, setToneTagsDrawerOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const handleDimensionChange = (key: keyof typeof toneDimensions, value: number) => {
    setToneDimensions((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleToneTag = (tag: string) => {
    setToneTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !toneTags.includes(trimmed)) {
      setToneTags((prev) => [...prev, trimmed]);
      setCustomTagInput('');
    }
  };

  const compiledTonePreview = React.useMemo(() => {
    return compileToneOfVoice(toneDimensions, toneTags);
  }, [toneDimensions, toneTags]);

  const handleSaveBrandKit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const cleanedCompetitors = competitors.filter(
          (c) => c.name.trim() !== '' || c.domain.trim() !== ''
        );

        const formData = new FormData();
        formData.append('brandName', brandName);
        formData.append('domain', domain);
        formData.append(
          'industryTaxonomy',
          JSON.stringify({ sector: selectedSector, category: selectedCategory })
        );
        formData.append('industry', `${selectedSector} > ${selectedCategory}`);
        formData.append('targetAudience', targetAudience);
        formData.append('coreOfferings', coreOfferings);
        formData.append('competitors', JSON.stringify(cleanedCompetitors));
        formData.append('targetRegions', JSON.stringify(targetRegions));
        formData.append('negativeKeywords', JSON.stringify(negativeKeywords));
        formData.append(
          'messagingPillars',
          JSON.stringify(messagingPillars.filter((p) => p.trim() !== ''))
        );
        formData.append('toneDimensions', JSON.stringify(toneDimensions));
        formData.append('toneTags', JSON.stringify(toneTags));

        const res = await updateProjectSettings(formData);

        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success('Brand Kit context successfully updated and synchronized across AI models!');
        }
      } catch {
        toast.error('Failed to update Brand Kit.');
      }
    });
  };

  return (
    <form onSubmit={handleSaveBrandKit} className="space-y-8">
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-200/80 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Active Context Engine
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs text-slate-500 font-medium">Grounding: {brandName}</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-950 flex items-center gap-2 font-sans">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Calibrate AI Context & Narrative Guardrails
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 font-sans">
                These settings establish the narrative perimeter for ChatGPT, Gemini, Claude, and Perplexity when generating citations and pitches.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 font-mono text-[10px] hidden sm:inline-flex">
              Model Synced
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6 pb-6">
          {/* SECTION 1: Product/Service Taxonomy & Offerings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Building className="h-4 w-4 text-emerald-700" />
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-800">
                1. Product &amp; Service Taxonomy
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Industry Sector</Label>
                <select
                  value={selectedSector}
                  onChange={(e) => handleSectorChange(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {INDUSTRY_TAXONOMY.map((sec) => (
                    <option key={sec.id} value={sec.name}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Sub-Category</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {activeSectorObj.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kit-audience" className="text-xs font-semibold text-slate-700">
                Target Audience Persona
              </Label>
              <Input
                id="kit-audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Mindful movement practitioners, yoga & Pilates enthusiasts, and runners"
                className="border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="kit-offerings" className="text-xs font-semibold text-slate-700">
                  Category Pillars &amp; High-Level Product Lines
                </Label>
                <span className="text-[10px] text-slate-400 font-sans">High-level lines (no SKU detail)</span>
              </div>
              <textarea
                id="kit-offerings"
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={coreOfferings}
                onChange={(e) => setCoreOfferings(e.target.value)}
                placeholder="e.g. Premium Performance Activewear, Technical Commuter Outerwear, Movement Accessories"
              />
              <p className="text-[11px] text-slate-500">
                Focus entirely on category pillars and product families. Stripping individual SKU names and fabric specs prevents LLM token bloat.
              </p>
            </div>
          </div>

          {/* SECTION 2: Direct Competitor Benchmarking */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-800">
                  2. Competitor Benchmarking (Rival Brands)
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCompetitor}
                className="h-7 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Competitor
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Direct market alternatives benchmarked across SOV telemetry, Authority Gap queries, and competitive displacement pitches.
            </p>

            <div className="space-y-2.5">
              {competitors.map((comp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Competitor Name (e.g. Alo Yoga)"
                      value={comp.name}
                      onChange={(e) => handleCompetitorChange(idx, 'name', e.target.value)}
                      className="border-slate-200 text-sm"
                    />
                    <Input
                      placeholder="Domain (e.g. aloyoga.com)"
                      value={comp.domain}
                      onChange={(e) => handleCompetitorChange(idx, 'domain', e.target.value)}
                      className="border-slate-200 text-sm font-mono"
                    />
                  </div>
                  {competitors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCompetitor(idx)}
                      className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Geographic Target Markets */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Globe2 className="h-4 w-4 text-emerald-700" />
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-800">
                3. Geographic Target Markets
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Select the key operational territories where AI search engines should prioritize your brand ranking and local intent.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {GEOGRAPHIC_REGIONS.map((region) => {
                const isSelected = targetRegions.includes(region.label);
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => handleToggleRegion(region.label)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSelected ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    />
                    {region.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Negative Keywords & Exclusions (Weighted Severity) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-800">
                  4. Negative Keywords &amp; Exclusions
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                  <Shield className="h-3 w-3" />
                  {negativeKeywords.filter((k) => k.severity === 'strict').length} Strict
                </span>
                <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  {negativeKeywords.filter((k) => k.severity === 'mild').length} Mild
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Differentiate between <strong className="text-rose-700">Strict Dealbreakers</strong> (zero tolerance narrative blocking) and <strong className="text-amber-700">Mild Avoidances</strong> (soft guidance to steer clear). Click any chip badge to toggle severity.
            </p>

            {/* Keyword Chips */}
            <div className="flex flex-wrap gap-2 min-h-[42px] p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              {negativeKeywords.map((item, idx) => {
                const isStrict = item.severity === 'strict';
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-md border shadow-2xs transition-colors ${
                      isStrict
                        ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                        : 'bg-amber-50/90 border-amber-200 text-amber-950'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSeverity(idx)}
                      title="Click to toggle severity between Strict and Mild"
                      className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                        isStrict
                          ? 'bg-rose-200/80 hover:bg-rose-300 text-rose-900'
                          : 'bg-amber-200/80 hover:bg-amber-300 text-amber-900'
                      }`}
                    >
                      {isStrict ? (
                        <>
                          <Shield className="h-2.5 w-2.5" />
                          Strict
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Mild
                        </>
                      )}
                    </button>
                    <span className="font-medium">{item.term}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNegativeKeyword(idx)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer ml-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              })}
              {negativeKeywords.length === 0 && (
                <span className="text-xs text-slate-400 italic">No negative exclusions set</span>
              )}
            </div>

            {/* Add Keyword Input + Severity Picker */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
              <Input
                placeholder="Add term (e.g. cheap dupes, fast fashion, drop-shipping)"
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNegativeKeyword();
                  }
                }}
                className="border-slate-200 text-sm flex-1"
              />

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setNewKeywordSeverity('strict')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    newKeywordSeverity === 'strict'
                      ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Strict Block
                </button>
                <button
                  type="button"
                  onClick={() => setNewKeywordSeverity('mild')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    newKeywordSeverity === 'mild'
                      ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mild Avoid
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNegativeKeyword}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* SECTION 5: Key Messaging Pillars (3 to 4 blocks) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-800">
                  5. Key Messaging Pillars (3-4 Value Propositions)
                </h3>
              </div>
              {messagingPillars.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPillar}
                  className="h-7 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Pillar
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Core differentiators that establish narrative guardrails for the underlying LLM rewrite and citation outreach agents.
            </p>

            <div className="space-y-2.5">
              {messagingPillars.map((pillar, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200 shrink-0">
                    {idx + 1}
                  </span>
                  <Input
                    placeholder={`Pillar ${idx + 1} (e.g. Proprietary Technical Fabric Innovation)`}
                    value={pillar}
                    onChange={(e) => handlePillarChange(idx, e.target.value)}
                    className="border-slate-200 text-sm"
                  />
                  {messagingPillars.length > 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePillar(idx)}
                      className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: Tone of Voice & Guardrails UI (Single-Column Stack) */}
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-800">
                  6. Tone of Voice &amp; Guardrails UI
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Single-Stack Architecture
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Multi-axis dimensional sliders calibrate exact model posture. Each slider features descriptive helper text and prominent numeric counters.
            </p>

            {/* 4-Axis Sliders: Single-Column Stack */}
            <div className="space-y-4">
              {TONE_DIMENSIONS_CONFIG.map((dim) => {
                const value = toneDimensions[dim.key] ?? 50;
                const poleInterpretation = interpretSliderPole(dim.key, value);

                return (
                  <div
                    key={dim.key}
                    className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 font-sans">
                            {dim.label}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ({dim.leftLabel} &harr; {dim.rightLabel})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-sans">{dim.description}</p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md">
                          {poleInterpretation}
                        </span>
                        <span className="text-xs font-mono font-bold bg-white border border-slate-200 text-slate-900 px-2.5 py-1 rounded-md shadow-2xs">
                          {value} / 100
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => handleDimensionChange(dim.key, Number(e.target.value))}
                        className="w-full accent-emerald-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className={value < 40 ? 'font-bold text-emerald-700' : ''}>
                          0 &mdash; {dim.leftLabel}
                        </span>
                        <span className={value > 60 ? 'font-bold text-emerald-700' : ''}>
                          100 &mdash; {dim.rightLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Categorized Tone Trait Tags with Collapsible Drawer */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-700" />
                    Tone Trait Tags
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Fine-tune model personality with curated tags across executive, mindset, and communication categories.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setToneTagsDrawerOpen((prev) => !prev)}
                  className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-700" />
                  {toneTagsDrawerOpen ? 'Collapse Trait Library' : 'Browse Trait Library (12 Presets)'}
                  {toneTagsDrawerOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </Button>
              </div>

              {/* Active Selected Tags Bar */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mr-1">
                  Active ({toneTags.length}):
                </span>
                {toneTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-700 text-white font-medium px-2.5 py-1 rounded-md shadow-2xs"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleToneTag(tag)}
                      className="text-emerald-200 hover:text-white cursor-pointer ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {toneTags.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No traits selected</span>
                )}
              </div>

              {/* Collapsible Categorized Drawer */}
              {toneTagsDrawerOpen && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {CATEGORIZED_TONE_TAGS.map((cat) => (
                      <div
                        key={cat.category}
                        className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 space-y-2.5"
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 font-sans flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            {cat.category}
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {cat.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cat.tags.map((tag) => {
                            const isSelected = toneTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleToneTag(tag)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-700 border-emerald-800 text-white font-semibold shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Tone Tag */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 max-w-sm">
                    <Input
                      placeholder="Add custom trait (e.g. Unflinching, Poetic)"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTag();
                        }
                      }}
                      className="border-slate-200 text-xs h-8"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomTag}
                      className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shrink-0"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Trait
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Live Compiled Tone Preview */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block mb-1">
                Live Compiled Tone Directive (Injected into Prompts):
              </span>
              <p className="text-xs text-emerald-950 font-sans leading-relaxed italic">
                &ldquo;{compiledTonePreview}&rdquo;
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/40 p-5">
          <span className="text-xs text-slate-500 font-sans">
            Changes propagate immediately across all AI audit engines and Content Studio generators.
          </span>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-5 py-2 shadow-xs cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Saving Brand Kit...
              </>
            ) : (
              'Save Brand Kit & Calibration'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
