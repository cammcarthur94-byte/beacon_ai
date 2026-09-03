'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createProjectWithBrandKit, skipOnboardingAction } from './actions';
import {
  Globe,
  Building2,
  Users,
  Target,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

interface Competitor {
  name: string;
  domain: string;
}

const INDUSTRY_SUGGESTIONS = [
  'B2B SaaS / Enterprise',
  'FinTech / Payments',
  'AI / Machine Learning',
  'DevTools & Infrastructure',
  'Cybersecurity',
  'HealthTech',
  'E-commerce & Retail',
];

const TONE_OPTIONS = [
  { id: 'Authoritative & Direct', desc: 'Clear, commanding leadership tone with institutional gravity' },
  { id: 'Technical & Precise', desc: 'Engineering-first, metric-driven and factual clarity' },
  { id: 'Visionary & Innovative', desc: 'Forward-looking, transformative and aspirational' },
  { id: 'Consultative & Empathetic', desc: 'Solution-oriented, trusted advisor persona' },
];

export function OnboardingWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1 State
  const [brandName, setBrandName] = useState('');
  const [domain, setDomain] = useState('');

  // Step 2 State
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { name: '', domain: '' },
  ]);

  // Step 3 State
  const [coreOfferings, setCoreOfferings] = useState('');
  const [toneOfVoice, setToneOfVoice] = useState('Authoritative & Direct');

  // Competitor handlers
  const handleAddCompetitor = () => {
    setCompetitors((prev) => [...prev, { name: '', domain: '' }]);
  };

  const handleRemoveCompetitor = (index: number) => {
    if (competitors.length === 1) return;
    setCompetitors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompetitorChange = (index: number, field: 'name' | 'domain', value: string) => {
    setCompetitors((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Step Validation
  const validateStep1 = () => {
    if (!brandName.trim()) {
      setErrorMessage('Please enter your brand name.');
      return false;
    }
    if (!domain.trim()) {
      setErrorMessage('Please enter your primary domain.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep2 = () => {
    if (!industry.trim()) {
      setErrorMessage('Please select or specify your industry.');
      return false;
    }
    if (!targetAudience.trim()) {
      setErrorMessage('Please describe your target audience.');
      return false;
    }
    const validCompetitors = competitors.filter((c) => c.name.trim() && c.domain.trim());
    if (validCompetitors.length === 0) {
      setErrorMessage('Please provide at least one competitor brand name and domain.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!coreOfferings.trim()) {
      setErrorMessage('Please outline your core offerings.');
      return;
    }

    const cleanedCompetitors = competitors
      .filter((c) => c.name.trim() && c.domain.trim())
      .map((c) => ({
        name: c.name.trim(),
        domain: c.domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase(),
      }));

    startTransition(async () => {
      try {
        const res = await createProjectWithBrandKit({
          brandName: brandName.trim(),
          domain: domain.trim(),
          industry: industry.trim(),
          targetAudience: targetAudience.trim(),
          coreOfferings: coreOfferings.trim(),
          toneOfVoice,
          competitors: cleanedCompetitors,
        });

        if (res?.error) {
          setErrorMessage(res.error);
          toast.error(res.error);
        }
      } catch (err: unknown) {
        // Next.js redirect throws a NEXT_REDIRECT error which is caught as expected
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrorMessage('Failed to configure project. Please verify inputs.');
      }
    });
  };

  const handleSkip = () => {
    startTransition(async () => {
      try {
        const res = await skipOnboardingAction();
        if (res?.error) {
          toast.error(res.error);
        }
      } catch {
        // NEXT_REDIRECT throws intentionally
      }
    });
  };

  const progressPercentage = step === 1 ? 33 : step === 2 ? 66 : 100;

  const handleAutofillSample = () => {
    setBrandName('Lululemon');
    setDomain('lululemon.com');
    setIndustry('Premium Athleisure & Athletic Apparel');
    setTargetAudience('Mindful movement practitioners, yoga & Pilates enthusiasts, runners, gym-goers, and fitness lifestyle consumers');
    setCompetitors([
      { name: 'Alo Yoga', domain: 'aloyoga.com' },
      { name: 'Vuori', domain: 'vuoriclothing.com' },
      { name: 'Athleta', domain: 'athleta.gap.com' },
    ]);
    setCoreOfferings('Align Pant (Nulu fabric), Define Jacket, Wunder Train tights, ABC Joggers, Everywhere Belt Bag & technical athleisure');
    setToneOfVoice('Empowering, Mindful, Elevated, Performance-Driven');
    toast.success('Loaded Lululemon sample brand kit profile.');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Wizard Header and Visual Step Indicators */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { s: 1, title: 'Brand Identity', desc: 'Name & Domain' },
            { s: 2, title: 'Competitive Field', desc: 'Category & Rivals' },
            { s: 3, title: 'Brand Kit Tone', desc: 'Positioning & Voice' },
          ].map((item) => {
            const isCompleted = step > item.s;
            const isCurrent = step === item.s;
            return (
              <div
                key={item.s}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 ${
                  isCurrent
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/60 text-zinc-900'
                    : 'border-zinc-200 bg-zinc-50/70 text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                    Step {item.s}
                  </span>
                  {isCompleted ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : isCurrent ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ) : null}
                </div>
                <div className="text-xs font-semibold mt-0.5 truncate">{item.title}</div>
              </div>
            );
          })}
        </div>
        <Progress value={progressPercentage} className="h-1.5 bg-zinc-100 transition-all duration-300" />
      </div>

      <Card className="border-zinc-200 bg-white shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl text-zinc-950">
                {step === 1 && 'Define your brand foundation'}
                {step === 2 && 'Set your competitive landscape'}
                {step === 3 && 'Calibrate AI Brand Kit & tone'}
              </CardTitle>
              <CardDescription className="text-zinc-600">
                {step === 1 && 'Beacon uses your domain and brand name to track citations across LLM engines.'}
                {step === 2 && 'Identify the competitors who compete with you for generative search real estate.'}
                {step === 3 && 'Downstream agents use this context to generate optimization recommendations and content.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {step === 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutofillSample}
                  className="hidden sm:inline-flex text-[11px] h-8 border-zinc-200 text-zinc-700 bg-zinc-50 hover:bg-zinc-100"
                >
                  <Sparkles className="h-3 w-3 mr-1 text-emerald-600" /> Autofill Demo Brand
                </Button>
              )}
              <div className="h-9 w-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
                {step === 1 && <Globe className="h-4 w-4" />}
                {step === 2 && <Target className="h-4 w-4" />}
                {step === 3 && <SlidersHorizontal className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {errorMessage && (
            <div className="p-3 text-xs rounded-md bg-red-50 border border-red-200 text-red-700">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: BRAND BASICS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand or Product Name</Label>
                <Input
                  id="brand-name"
                  placeholder="e.g. Supabase, Linear, Stripe"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500">
                  The exact brand entity to scan for within LLM response outputs.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary-domain">Primary Domain</Label>
                <div className="relative">
                  <Input
                    id="primary-domain"
                    placeholder="company.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  We check if generative engines cite your URLs in their reference links.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: AUDIENCE & COMPETITORS */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry / Vertical</Label>
                <Input
                  id="industry"
                  placeholder="e.g. B2B SaaS / Enterprise Infrastructure"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {INDUSTRY_SUGGESTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setIndustry(item)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                        industry === item
                          ? 'border-zinc-900 bg-zinc-900 text-white font-medium'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:text-zinc-900 hover:border-zinc-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-audience">Target Audience & Buyer Persona</Label>
                <Input
                  id="target-audience"
                  placeholder="e.g. Series B+ CTOs, VP of Engineering, and Platform Architects"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
                <p className="text-[11px] text-zinc-500">
                  Helps Beacon prioritize prompts and conversational intents relevant to your buyers.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Key Competitors (AEO Rivals)</Label>
                    <p className="text-[11px] text-zinc-500">
                      Who is currently winning citations when prospects ask AI about your category?
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCompetitor}
                    className="h-7 text-xs border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Competitor
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {competitors.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Competitor Name (e.g. Ramp)"
                          value={comp.name}
                          onChange={(e) => handleCompetitorChange(idx, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Domain (e.g. ramp.com)"
                          value={comp.domain}
                          onChange={(e) => handleCompetitorChange(idx, 'domain', e.target.value)}
                        />
                      </div>
                      {competitors.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCompetitor(idx)}
                          className="h-9 w-9 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CORE OFFERINGS & TONE */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="space-y-2">
                <Label htmlFor="core-offerings">Core Offerings & Key Differentiators</Label>
                <textarea
                  id="core-offerings"
                  rows={4}
                  className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:border-zinc-900"
                  placeholder="Summarize your primary product features, architectural advantages, and unique capabilities that AI models should recognize when queried..."
                  value={coreOfferings}
                  onChange={(e) => setCoreOfferings(e.target.value)}
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500">
                  This narrative will be saved to your project&apos;s Brand Kit JSONB and leveraged by Phase 5 rewrite agents.
                </p>
              </div>

              <div className="space-y-2.5">
                <Label>Brand Tone of Voice</Label>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {TONE_OPTIONS.map((item) => {
                    const isSelected = toneOfVoice === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setToneOfVoice(item.id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-50 shadow-xs ring-1 ring-zinc-900'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-950">{item.id}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-zinc-950" />}
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-1 leading-snug">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-4">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isPending}
                className="border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={isPending}
                className="text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-medium"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Skip setup for now &rarr;
              </Button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-zinc-900 text-white hover:bg-zinc-800 font-medium"
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-zinc-900 text-white hover:bg-zinc-800 font-medium"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Finalizing Brand Kit...
                  </>
                ) : (
                  <>
                    Complete Onboarding & Enter Dashboard <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
