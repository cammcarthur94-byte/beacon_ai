'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Mail,
  Scale,
  HelpCircle,
  Lightbulb,
  Copy,
  Check,
  Loader2,
  Building2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { BrandKit } from '@/types/database.types';
import type {
  OutreachEmailVariation,
  FaqItem,
  CompetitorComparisonResult,
  StrategicRecommendationItem,
} from '@/app/api/content-studio/route';

interface ContentStudioClientProps {
  brandName: string;
  brandDomain: string;
  brandKit: BrandKit;
}

export function ContentStudioClient({ brandName, brandDomain, brandKit }: ContentStudioClientProps) {
  const searchParams = useSearchParams();

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('email');

  // Tab 1: Outreach Email State
  const [emailDomain, setEmailDomain] = useState('nytimes.com/wirecutter');
  const [emailTopic, setEmailTopic] = useState('Best Workout Leggings & Activewear Roundup');
  const [emailCompetitor, setEmailCompetitor] = useState(brandKit.competitors?.[0]?.name || 'Alo Yoga');
  const [emailNotes, setEmailNotes] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailVariations, setEmailVariations] = useState<OutreachEmailVariation[]>([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // Tab 2: Comparison Copy State
  const [compCompetitor, setCompCompetitor] = useState(brandKit.competitors?.[0]?.name || 'Alo Yoga');
  const [compFocus, setCompFocus] = useState('Fabric Durability, Compression Retention & Waistband Stability');
  const [compLoading, setCompLoading] = useState(false);
  const [compResult, setCompResult] = useState<CompetitorComparisonResult | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Tab 3: FAQ Schema State
  const [faqTopic, setFaqTopic] = useState('Product Materials, True-to-Size Sizing & Longevity');
  const [faqEngine, setFaqEngine] = useState('Google AI Overviews');
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqList, setFaqList] = useState<FaqItem[]>([]);

  // Tab 4: Strategic Recommendations State
  const [recTopic, setRecTopic] = useState('Category Share of Voice & Unbranded Consideration Queries');
  const [recEngines, setRecEngines] = useState(['Perplexity', 'Gemini']);
  const [recLoading, setRecLoading] = useState(false);
  const [recList, setRecList] = useState<StrategicRecommendationItem[]>([]);

  // Handle URL pre-fill from query params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const domainParam = searchParams.get('domain');
    const topicParam = searchParams.get('topic') || searchParams.get('q') || searchParams.get('prompt');
    const compParam = searchParams.get('competitor');

    if (tabParam && ['email', 'comparison', 'faq', 'recommendations'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    if (domainParam) setEmailDomain(domainParam);
    if (topicParam) {
      setEmailTopic(topicParam);
      setCompFocus(topicParam);
      setFaqTopic(topicParam);
      setRecTopic(topicParam);
    }
    if (compParam) {
      setEmailCompetitor(compParam);
      setCompCompetitor(compParam);
    }
  }, [searchParams]);

  // Handler: Generate 3 Email Variations
  const handleGenerateEmails = async () => {
    setEmailLoading(true);
    try {
      const res = await fetch('/api/content-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'outreach_email',
          params: {
            domain: emailDomain,
            relevanceTopic: emailTopic,
            competitorName: emailCompetitor,
            customNotes: emailNotes,
          },
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.variations)) {
        setEmailVariations(data.variations);
        setSelectedVariationIndex(0);
        toast.success(`Generated 3 brand-tailored email variations using ${data.model || 'Gemini 3.8 Flash'}`);
      } else {
        toast.error(data.error || 'Failed to generate email variations');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error generating emails');
    } finally {
      setEmailLoading(false);
    }
  };

  // Handler: Generate Competitor Comparison
  const handleGenerateComparison = async () => {
    setCompLoading(true);
    try {
      const res = await fetch('/api/content-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'competitor_comparison',
          params: {
            competitorName: compCompetitor,
            categoryFocus: compFocus,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.comparison) {
        setCompResult(data.comparison);
        toast.success(`Generated positioning matrix vs ${compCompetitor}`);
      } else {
        toast.error(data.error || 'Failed to generate comparison');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error generating comparison');
    } finally {
      setCompLoading(false);
    }
  };

  // Handler: Generate FAQ Schema
  const handleGenerateFaq = async () => {
    setFaqLoading(true);
    try {
      const res = await fetch('/api/content-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'faq_block',
          params: {
            topic: faqTopic,
            targetEngine: faqEngine,
          },
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.faqs)) {
        setFaqList(data.faqs);
        toast.success(`Generated 4 semantic FAQ blocks for ${faqEngine}`);
      } else {
        toast.error(data.error || 'Failed to generate FAQ blocks');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error generating FAQs');
    } finally {
      setFaqLoading(false);
    }
  };

  // Handler: Generate Strategic Recommendations
  const handleGenerateRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await fetch('/api/content-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'strategic_recommendations',
          params: {
            underperformingEngines: recEngines,
            auditTopic: recTopic,
          },
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.recommendations)) {
        setRecList(data.recommendations);
        toast.success('Generated strategic AEO remediation directives');
      } else {
        toast.error(data.error || 'Failed to generate recommendations');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error generating recommendations');
    } finally {
      setRecLoading(false);
    }
  };

  const selectedVariation = emailVariations[selectedVariationIndex];

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              CONTENT &amp; PR STUDIO
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight font-sans">
            AI Pitch &amp; Content Generator
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Generate ready-to-use editorial email pitches, entity-dense FAQ blocks, and competitive positioning copy calibrated for your brand.
          </p>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/90 border border-slate-200 p-1 rounded-xl grid grid-cols-2 md:grid-cols-4 max-w-2xl h-auto">
          <TabsTrigger
            value="email"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xs text-xs font-semibold py-2.5 flex items-center gap-2 text-slate-600"
          >
            <Mail className="h-3.5 w-3.5" />
            Outreach Emails (3 Angles)
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xs text-xs font-semibold py-2.5 flex items-center gap-2 text-slate-600"
          >
            <Scale className="h-3.5 w-3.5" />
            Competitor Positioning
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xs text-xs font-semibold py-2.5 flex items-center gap-2 text-slate-600"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            FAQ & Schema Blocks
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xs text-xs font-semibold py-2.5 flex items-center gap-2 text-slate-600"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Engine Directives
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OUTREACH EMAIL */}
        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 border-slate-200/80 shadow-2xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-700" />
                  Target Editorial Parameters
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Configure the target publication and competitor to generate 3 tailored pitch variations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Target Publication Domain</label>
                  <Input
                    placeholder="e.g. nytimes.com/wirecutter or gq.com"
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Article or Topic Coverage</label>
                  <Input
                    placeholder="e.g. Best Workout Leggings & Activewear"
                    value={emailTopic}
                    onChange={(e) => setEmailTopic(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Competitor to Displace</label>
                  <Input
                    placeholder="e.g. Alo Yoga or Vuori"
                    value={emailCompetitor}
                    onChange={(e) => setEmailCompetitor(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Custom Pitch Directives (Optional)</label>
                  <Textarea
                    placeholder="e.g. Highlight our 2026 recycled yarn certifications and offer samples in sizes 2-14..."
                    value={emailNotes}
                    onChange={(e) => setEmailNotes(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerateEmails}
                  disabled={emailLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-2xs h-9"
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Synthesizing 3 Brand Angles...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Generate 3 Tailored Pitch Angles
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7 border-slate-200/80 shadow-2xs flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-700" />
                    Generated Outreach Angles
                  </CardTitle>
                  {emailVariations.length > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-950 border border-emerald-300 font-mono text-[10px]">
                      3 Angles Ready
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Select an angle below to inspect the copy or copy it directly to clipboard.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                {emailVariations.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-auto">
                    <Mail className="h-10 w-10 text-slate-300 mb-3" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No Drafts Generated Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Configure the target publication and click generate to produce 3 brand-tailored editorial email pitches.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateEmails}
                      disabled={emailLoading}
                      className="text-xs border-slate-300 bg-white hover:bg-slate-50"
                    >
                      Quick-Generate Demo Pitches
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                      {emailVariations.map((v, idx) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariationIndex(idx)}
                          className={`px-2.5 py-2 rounded-md text-left transition-all ${
                            selectedVariationIndex === idx
                              ? 'bg-white text-slate-950 shadow-2xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <span className="text-[10px] font-mono block text-emerald-800 uppercase font-bold truncate">
                            Angle {idx + 1}
                          </span>
                          <span className="text-xs block leading-tight truncate">
                            {v.angleTitle.split('&')[0].trim()}
                          </span>
                        </button>
                      ))}
                    </div>

                    {selectedVariation && (
                      <div className="space-y-3.5 animate-in fade-in duration-200">
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="text-xs text-slate-800 leading-snug">
                            <span className="font-bold text-emerald-950 block mb-0.5">
                              {selectedVariation.angleTitle}
                            </span>
                            <span>{selectedVariation.targetAngle}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                              Email Subject Line
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedVariation.subject);
                                setCopiedSubject(true);
                                toast.success('Subject line copied!');
                                setTimeout(() => setCopiedSubject(false), 2000);
                              }}
                              className="h-6 text-[11px] text-slate-600 hover:text-emerald-800 px-2"
                            >
                              {copiedSubject ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                              {copiedSubject ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-100/70 border border-slate-200 text-xs font-mono font-semibold text-slate-900">
                            {selectedVariation.subject}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold mb-0.5">
                              Editor Angle
                            </span>
                            <span className="text-slate-800 font-medium leading-tight block">
                              {selectedVariation.editorHook}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold mb-0.5">
                              Key Proof Differentiator
                            </span>
                            <span className="text-slate-800 font-medium leading-tight block">
                              {selectedVariation.keyDifferentiator}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                              Email Pitch Body
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedVariation.body);
                                setCopiedBody(true);
                                toast.success('Email body copied!');
                                setTimeout(() => setCopiedBody(false), 2000);
                              }}
                              className="h-6 text-[11px] text-slate-600 hover:text-emerald-800 px-2"
                            >
                              {copiedBody ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                              {copiedBody ? 'Copied Body' : 'Copy Body'}
                            </Button>
                          </div>
                          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-sans leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                            {selectedVariation.body}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `Subject: ${selectedVariation.subject}\n\n${selectedVariation.body}`
                              );
                              toast.success('Complete email (subject + body) copied!');
                            }}
                            className="text-xs border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium"
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            Copy Full Email
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: COMPETITOR COMPARISON */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4 border-slate-200/80 shadow-2xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-700" />
                  Comparison Parameters
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Generate objective head-to-head positioning matrices for LLM scrapers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Target Competitor</label>
                  <Input
                    value={compCompetitor}
                    onChange={(e) => setCompCompetitor(e.target.value)}
                    placeholder="e.g. Alo Yoga"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Category / Feature Focus</label>
                  <Input
                    value={compFocus}
                    onChange={(e) => setCompFocus(e.target.value)}
                    placeholder="e.g. Fabric Durability & Fit"
                    className="h-9 text-xs"
                  />
                </div>
                <Button
                  onClick={handleGenerateComparison}
                  disabled={compLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-2xs h-9"
                >
                  {compLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Generating Matrix...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Generate Head-to-Head Matrix
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-8 border-slate-200/80 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-700" />
                  Head-to-Head Positioning Matrix
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Deployable entity comparison blocks designed for citation in Google AI Overviews and ChatGPT search.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {!compResult ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Scale className="h-9 w-9 text-slate-300 mb-2" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No Comparison Matrix Generated</h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-3">
                      Select a competitor and feature focus to generate a structured entity comparison matrix.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateComparison}
                      disabled={compLoading}
                      className="text-xs border-slate-300 bg-white hover:bg-slate-50"
                    >
                      Generate Sample Matrix
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <h4 className="text-sm font-bold text-slate-950 mb-1">{compResult.comparisonTitle}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{compResult.summary}</p>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600">
                          <tr>
                            <th className="p-3">Dimension</th>
                            <th className="p-3 text-emerald-900 bg-emerald-50/60">{brandName} Advantage</th>
                            <th className="p-3 text-slate-700">{compCompetitor} Gap</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {compResult.dimensions.map((dim, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-3 font-semibold text-slate-900 align-top">{dim.dimension}</td>
                              <td className="p-3 text-slate-800 bg-emerald-50/30 align-top">{dim.brandAdvantage}</td>
                              <td className="p-3 text-slate-600 align-top">{dim.competitorGap}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-600 uppercase font-mono">
                          Deploy-Ready Markdown Block
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(compResult.positioningSnippet);
                            setCopiedSnippet(true);
                            toast.success('Snippet copied!');
                            setTimeout(() => setCopiedSnippet(false), 2000);
                          }}
                          className="h-6 text-[11px] text-slate-600 hover:text-emerald-800 px-2"
                        >
                          {copiedSnippet ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                          {copiedSnippet ? 'Copied' : 'Copy Snippet'}
                        </Button>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed">
                        {compResult.positioningSnippet}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: FAQ & SCHEMA BLOCKS */}
        <TabsContent value="faq" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4 border-slate-200/80 shadow-2xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-700" />
                  FAQ Generation Target
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Generate concise, factual FAQ pairs structured for LLM answer extraction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Target Search Engine</label>
                  <Input
                    value={faqEngine}
                    onChange={(e) => setFaqEngine(e.target.value)}
                    placeholder="e.g. Google AI Overviews"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Topic Focus</label>
                  <Input
                    value={faqTopic}
                    onChange={(e) => setFaqTopic(e.target.value)}
                    placeholder="e.g. Fabric Sizing, Durability, Washing"
                    className="h-9 text-xs"
                  />
                </div>
                <Button
                  onClick={handleGenerateFaq}
                  disabled={faqLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-2xs h-9"
                >
                  {faqLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Generating FAQs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Generate 4 Entity FAQs
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-8 border-slate-200/80 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-700" />
                  Semantic FAQ Content Blocks
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  High-yield questions with verifiable answers ready to paste into web copy or JSON-LD schema.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {faqList.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <HelpCircle className="h-9 w-9 text-slate-300 mb-2" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No FAQ Blocks Generated</h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-3">
                      Generate entity-dense FAQ blocks formatted for AI answer engine indexing.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateFaq}
                      disabled={faqLoading}
                      className="text-xs border-slate-300 bg-white hover:bg-slate-50"
                    >
                      Generate Sample FAQs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {faqList.map((faq, idx) => (
                      <div key={idx} className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/60 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                            <span className="text-emerald-700 font-mono">Q{idx + 1}.</span>
                            {faq.question}
                          </h4>
                          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-mono shrink-0">
                            {faq.targetEntity}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed pl-5">{faq.answer}</p>
                        <div className="pl-5 pt-1 text-[11px] text-slate-500 italic flex items-center gap-1">
                          <span className="font-semibold not-italic text-slate-700">AEO Rationale:</span> {faq.llmRationale}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: STRATEGIC ENGINE RECOMMENDATIONS */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4 border-slate-200/80 shadow-2xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-emerald-700" />
                  Engine Remediation Scope
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Target underperforming engines for prioritized optimization directives.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Focus Engines</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Perplexity', 'Gemini', 'Claude', 'ChatGPT'].map((engine) => (
                      <button
                        key={engine}
                        onClick={() => {
                          if (recEngines.includes(engine)) {
                            setRecEngines(recEngines.filter((e) => e !== engine));
                          } else {
                            setRecEngines([...recEngines, engine]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-all ${
                          recEngines.includes(engine)
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {engine}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Topic / Query Area</label>
                  <Input
                    value={recTopic}
                    onChange={(e) => setRecTopic(e.target.value)}
                    placeholder="e.g. Athleisure Brand Authority"
                    className="h-9 text-xs"
                  />
                </div>

                <Button
                  onClick={handleGenerateRecommendations}
                  disabled={recLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-2xs h-9"
                >
                  {recLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Analyzing Gaps...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Generate Engine Directives
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-8 border-slate-200/80 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-emerald-700" />
                  Prioritized Remediation Directives
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Action items calculated to produce immediate Share of Voice lift.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {recList.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Lightbulb className="h-9 w-9 text-slate-300 mb-2" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No Recommendations Generated</h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-3">
                      Select target engines and generate strategic action items to remediate citation gaps.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateRecommendations}
                      disabled={recLoading}
                      className="text-xs border-slate-300 bg-white hover:bg-slate-50"
                    >
                      Generate Sample Recommendations
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recList.map((rec) => (
                      <div key={rec.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`text-[10px] font-mono uppercase font-bold ${
                                rec.priority === 'critical'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : rec.priority === 'high'
                                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                                  : 'bg-blue-100 text-blue-950 border-blue-300'
                              }`}
                            >
                              {rec.priority} Priority
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-mono border-slate-200 text-slate-600">
                              {rec.affectedEngine}
                            </Badge>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {rec.expectedSovImpact}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-950">{rec.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-800 flex items-start gap-2">
                          <ChevronRight className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">Action Item:</span>
                            <span>{rec.actionItem}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
