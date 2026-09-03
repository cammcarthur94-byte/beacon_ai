'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  updateProjectSettings,
  createCheckoutSessionAction,
  createPortalSessionAction,
} from '@/app/settings/actions';
import {
  CreditCard,
  Sliders,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { BILLING_PLANS } from '@/lib/stripe';
import type { BrandKit } from '@/types/database.types';

interface SettingsViewProps {
  project: {
    id: string;
    name: string;
    domain: string;
    tier: 'starter' | 'pro' | 'growth' | 'enterprise';
    audit_limit: number;
    brand_kit: BrandKit;
  };
  activeAuditsCount: number;
  initialTab?: string;
}

export function SettingsView({ project, activeAuditsCount, initialTab }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState(initialTab === 'billing' ? 'billing' : 'general');
  const [isPending, startTransition] = useTransition();

  // General state
  const [brandName, setBrandName] = useState(project.name || '');
  const [domain, setDomain] = useState(project.domain || '');
  const [industry, setIndustry] = useState(project.brand_kit?.industry || '');
  const [targetAudience, setTargetAudience] = useState(project.brand_kit?.target_audience || '');
  const [coreOfferings, setCoreOfferings] = useState(project.brand_kit?.core_offerings || '');
  const [toneOfVoice, setToneOfVoice] = useState(project.brand_kit?.tone_of_voice || 'Authoritative');
  const [dropThreshold, setDropThreshold] = useState(15);
  const [competitors, setCompetitors] = useState<{ name: string; domain: string }[]>(
    project.brand_kit?.competitors || [{ name: '', domain: '' }]
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

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const cleanedCompetitors = competitors.filter(
          (c) => c.name.trim() !== '' || c.domain.trim() !== ''
        );

        const formData = new FormData();
        formData.append('brandName', brandName);
        formData.append('domain', domain);
        formData.append('industry', industry);
        formData.append('targetAudience', targetAudience);
        formData.append('coreOfferings', coreOfferings);
        formData.append('toneOfVoice', toneOfVoice);
        formData.append('competitors', JSON.stringify(cleanedCompetitors));

        const res = await updateProjectSettings(formData);

        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success('Workspace parameters and Brand Kit successfully updated!');
        }
      } catch {
        toast.error('Failed to update workspace settings.');
      }
    });
  };

  const handleUpgrade = (tier: 'growth' | 'enterprise') => {
    startTransition(async () => {
      try {
        const res = await createCheckoutSessionAction(tier);
        if (res?.error) {
          toast.error(res.error);
        }
      } catch {
        toast.error('Could not initialize Stripe Checkout.');
      }
    });
  };

  const handleManageBilling = () => {
    startTransition(async () => {
      try {
        const res = await createPortalSessionAction();
        if (res?.error) {
          toast.error(res.error);
        }
      } catch {
        toast.error('Could not open Customer Billing Portal.');
      }
    });
  };

  const currentTier = project.tier || 'starter';
  const auditLimit = project.audit_limit || 20;
  const usagePercent = Math.min(Math.round((activeAuditsCount / auditLimit) * 100), 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-100 p-1 border border-zinc-200">
          <TabsTrigger value="general" className="gap-2 text-xs">
            <Sliders className="h-3.5 w-3.5" /> General & Brand Kit
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2 text-xs">
            <CreditCard className="h-3.5 w-3.5" /> Billing & Tier Quotas
          </TabsTrigger>
        </TabsList>

        {/* 1. GENERAL TAB */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            {/* Project Details Card */}
            <Card className="border-zinc-200 bg-white shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-950">
                  Brand Identity & Workspace Details
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Primary identifiers utilized across AI answer engine queries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proj-name">Brand Name</Label>
                    <Input
                      id="proj-name"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proj-domain">Primary Domain</Label>
                    <Input
                      id="proj-domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alert-threshold">Proactive Alert Drop Threshold (%)</Label>
                    <span className="text-xs font-mono text-emerald-600 font-medium">-{dropThreshold}%</span>
                  </div>
                  <Input
                    id="alert-threshold"
                    type="number"
                    min={5}
                    max={50}
                    value={dropThreshold}
                    onChange={(e) => setDropThreshold(Number(e.target.value))}
                    className="max-w-[200px]"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Triggers Resend email alerts when an engine visibility score drops by this percentage.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Live Brand Kit Editor Card */}
            <Card className="border-zinc-200 bg-white shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-zinc-950 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      Calibrate Brand Kit JSONB Context
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      Context injected into LLM queries and Phase 5 content rewrite agents
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600 font-mono text-[10px]">
                    Downstream Synced
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kit-industry">Industry / Category</Label>
                    <Input
                      id="kit-industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kit-tone">Tone of Voice</Label>
                    <Input
                      id="kit-tone"
                      value={toneOfVoice}
                      onChange={(e) => setToneOfVoice(e.target.value)}
                      placeholder="e.g. Authoritative, Direct, Institutional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kit-audience">Target Audience</Label>
                  <Input
                    id="kit-audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kit-offerings">Core Offerings & Key Differentiators</Label>
                  <textarea
                    id="kit-offerings"
                    rows={3}
                    className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                    value={coreOfferings}
                    onChange={(e) => setCoreOfferings(e.target.value)}
                  />
                </div>

                {/* Competitors List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Monitored Competitors</Label>
                      <p className="text-[11px] text-zinc-500">
                        Rivals benchmarked during automated audits and rewrite tools
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCompetitor}
                      className="h-7 text-xs border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Competitor
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {competitors.map((comp, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Competitor Name"
                            value={comp.name}
                            onChange={(e) => handleCompetitorChange(idx, 'name', e.target.value)}
                          />
                          <Input
                            placeholder="Competitor Domain"
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
              </CardContent>

              <CardFooter className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium shadow-xs"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Settings & Brand Kit'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* 2. BILLING TAB */}
        <TabsContent value="billing" className="mt-6 space-y-6">
          {/* Current Quota Usage Card */}
          <Card className="border-zinc-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold text-zinc-950">
                    Audit Quota & Current Usage
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Active prompt tracking phrases against your tier limit
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700 font-mono text-xs capitalize">
                  {currentTier} Tier
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Monthly Usage:</span>
                <span className="text-zinc-950 font-medium">
                  {activeAuditsCount} of {auditLimit} Audits Used ({usagePercent}%)
                </span>
              </div>
              <Progress value={usagePercent} className="h-2 bg-zinc-100" />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-500">
                  Cadence updates automatically reset at the start of your monthly billing cycle.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={isPending}
                  className="text-xs border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-2xs"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Customer Portal
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {BILLING_PLANS.map((plan) => {
              const isCurrent =
                currentTier === plan.id ||
                ((currentTier === 'pro' || currentTier === 'growth') &&
                  (plan.id === 'pro' || plan.id === 'growth'));

              return (
                <Card
                  key={plan.id}
                  className={`border flex flex-col justify-between ${
                    isCurrent
                      ? 'border-zinc-900 bg-zinc-50/50 shadow-md ring-1 ring-zinc-900'
                      : 'border-zinc-200 bg-white shadow-xs'
                  }`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-zinc-950">
                        {plan.name}
                      </CardTitle>
                      {isCurrent && (
                        <Badge className="bg-zinc-900 text-white font-mono text-[10px]">
                          Current Plan
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="text-3xl font-bold font-mono text-zinc-950">
                        {plan.price}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-xs text-zinc-500 font-mono">/ month</span>
                      )}
                    </div>
                    <CardDescription className="text-xs text-zinc-500 mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2">
                    <Separator className="bg-zinc-200" />
                    <ul className="space-y-2 text-xs text-zinc-700">
                      {plan.features.map((feat, fidx) => (
                        <li key={fidx} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4 border-t border-zinc-100">
                    {isCurrent ? (
                      <Button
                        disabled
                        variant="secondary"
                        className="w-full text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200"
                      >
                        Active Plan
                      </Button>
                    ) : plan.id === 'starter' ? (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full text-xs border-zinc-200 text-zinc-400"
                      >
                        Included Default
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => handleUpgrade(plan.id as 'growth' | 'enterprise')}
                        disabled={isPending}
                        className="w-full bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium shadow-xs"
                      >
                        {isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          `Upgrade to ${plan.name.replace(' Tier', '')}`
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
