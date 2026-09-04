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
  BookOpen,
  Send,
  Sliders,
  RotateCcw,
  Download,
  ShieldCheck,
  Eye,
  FileText,
  TrendingUp,
  UserCheck,
  Share2,
  Award,
  ExternalLink,
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
  BlogPostResult,
  ThoughtLeadershipResult,
  OutreachEmailVariation,
  FaqItem,
  CompetitorComparisonResult,
  StrategicRecommendationItem,
  ToneAlignmentScore,
} from '@/app/api/content-studio/route';

interface ContentStudioClientProps {
  brandName: string;
  brandDomain: string;
  brandKit: BrandKit;
}

export function ContentStudioClient({ brandName, brandDomain, brandKit }: ContentStudioClientProps) {
  const searchParams = useSearchParams();

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('blog');

  // Tone Calibration Bar State
  const [showToneControls, setShowToneControls] = useState<boolean>(true);
  const [toneVoice, setToneVoice] = useState<string>(
    brandKit.tone_of_voice || 'Inspiring, elevated, technical, and mindful'
  );
  const [toneFormalCasual, setToneFormalCasual] = useState<number>(
    brandKit.tone_dimensions?.formal_casual ?? 45
  );
  const [toneTechnicalAccessible, setToneTechnicalAccessible] = useState<number>(
    brandKit.tone_dimensions?.technical_accessible ?? 70
  );
  const [toneBoldUnderstated, setToneBoldUnderstated] = useState<number>(
    brandKit.tone_dimensions?.bold_understated ?? 40
  );
  const [toneAnalyticalInspiring, setToneAnalyticalInspiring] = useState<number>(
    brandKit.tone_dimensions?.analytical_inspiring ?? 80
  );

  const resetToneDefaults = () => {
    setToneVoice(brandKit.tone_of_voice || 'Inspiring, elevated, technical, and mindful');
    setToneFormalCasual(brandKit.tone_dimensions?.formal_casual ?? 45);
    setToneTechnicalAccessible(brandKit.tone_dimensions?.technical_accessible ?? 70);
    setToneBoldUnderstated(brandKit.tone_dimensions?.bold_understated ?? 40);
    setToneAnalyticalInspiring(brandKit.tone_dimensions?.analytical_inspiring ?? 80);
    toast.info('Reset tone dimensions to saved Brand Kit defaults');
  };

  const getToneOverrides = () => ({
    tone_of_voice: toneVoice,
    tone_dimensions: {
      formal_casual: toneFormalCasual,
      technical_accessible: toneTechnicalAccessible,
      bold_understated: toneBoldUnderstated,
      analytical_inspiring: toneAnalyticalInspiring,
    },
  });

  // Tab 1: Blog & AEO Guide State
  const [blogTopic, setBlogTopic] = useState('The Architecture of Performance: Engineering Fabric Durability for Modern Movement');
  const [blogTargetQuery, setBlogTargetQuery] = useState('what are the most durable leggings for dynamic yoga and movement');
  const [blogBuyerStage, setBlogBuyerStage] = useState('consideration');
  const [blogArticleFormat, setBlogArticleFormat] = useState('ultimate_guide');
  const [blogPrimaryEntity, setBlogPrimaryEntity] = useState(brandName + ' Technical Knit Innovation');
  const [blogContext, setBlogContext] = useState('');
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogResult, setBlogResult] = useState<BlogPostResult | null>(null);
  const [blogCopiedMarkdown, setBlogCopiedMarkdown] = useState(false);
  const [blogCopiedHtml, setBlogCopiedHtml] = useState(false);

  // Tab 2: Outreach Email State
  const [emailDomain, setEmailDomain] = useState('nytimes.com/wirecutter');
  const [emailRecipientName, setEmailRecipientName] = useState('Sarah Jenkins');
  const [emailRecipientRole, setEmailRecipientRole] = useState('Senior Fitness & Gear Editor');
  const [emailTopic, setEmailTopic] = useState('Best Workout Leggings & Activewear Roundup');
  const [emailCompetitor, setEmailCompetitor] = useState(brandKit.competitors?.[0]?.name || 'Alo Yoga');
  const [emailAngleHook, setEmailAngleHook] = useState('Displace competitor with 100-cycle wash test data and zero waistband roll');
  const [emailNotes, setEmailNotes] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailVariations, setEmailVariations] = useState<OutreachEmailVariation[]>([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [exportingToCrm, setExportingToCrm] = useState(false);

  // Tab 3: Thought Leadership State
  const [thoughtTopic, setThoughtTopic] = useState('Why the Fast-Fashion Athleisure Playbook Fails in the Age of Generative AI');
  const [thoughtPlatform, setThoughtPlatform] = useState<'linkedin' | 'substack' | 'op_ed'>('linkedin');
  const [thoughtContrarianAngle, setThoughtContrarianAngle] = useState('Why chasing fleeting seasonal drops destroys AI answer engine brand equity');
  const [thoughtAuthorRole, setThoughtAuthorRole] = useState('Founder & Head of Materials Innovation');
  const [thoughtContext, setThoughtContext] = useState('');
  const [thoughtLoading, setThoughtLoading] = useState(false);
  const [thoughtResult, setThoughtResult] = useState<ThoughtLeadershipResult | null>(null);
  const [thoughtCopied, setThoughtCopied] = useState(false);

  // Tab 4: FAQ Schema State
  const [faqTopic, setFaqTopic] = useState('Product Materials, True-to-Size Sizing & Longevity');
  const [faqPersona, setFaqPersona] = useState('Mindful Movement Practitioners & Quality-Conscious Shoppers');
  const [faqEngine, setFaqEngine] = useState('Google AI Overviews');
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqList, setFaqList] = useState<FaqItem[]>([]);
  const [faqToneAlignment, setFaqToneAlignment] = useState<ToneAlignmentScore | null>(null);
  const [faqCopiedSchema, setFaqCopiedSchema] = useState(false);

  // Tab 5: Comparison Copy State
  const [compCompetitor, setCompCompetitor] = useState(brandKit.competitors?.[0]?.name || 'Alo Yoga');
  const [compFocus, setCompFocus] = useState('Fabric Durability, Compression Retention & Waistband Stability');
  const [compBuyerPriority, setCompBuyerPriority] = useState('Long-term shape retention and zero waistband rollover');
  const [compLoading, setCompLoading] = useState(false);
  const [compResult, setCompResult] = useState<CompetitorComparisonResult | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Handle URL pre-fill from query params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const domainParam = searchParams.get('domain');
    const topicParam = searchParams.get('topic') || searchParams.get('q') || searchParams.get('prompt');
    const compParam = searchParams.get('competitor');

    if (tabParam && ['blog', 'email', 'thought_leadership', 'faq', 'comparison'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    if (domainParam) setEmailDomain(domainParam);
    if (topicParam) {
      setBlogTopic(topicParam);
      setEmailTopic(topicParam);
      setCompFocus(topicParam);
      setFaqTopic(topicParam);
    }
    if (compParam) {
      setEmailCompetitor(compParam);
      setCompCompetitor(compParam);
    }
  }, [searchParams]);

  // Handler: Generate Blog Post
  const handleGenerateBlog = async () => {
    setBlogLoading(true);
    try {
      const res = await fetch('/api/content-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blog_post',
          params: {
            topic: blogTopic,
            targetQuery: blogTargetQuery,
            targetBuyerStage: blogBuyerStage,
            articleFormat: blogArticleFormat,
            primaryEntity: blogPrimaryEntity,
            customContext: blogContext,
            toneOverrides: getToneOverrides(),
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.article) {
        setBlogResult(data.article);
        toast.success('Generated publication-ready article');
      } else {
        toast.error(data.error || 'Failed to generate article');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error generating article');
    } finally {
      setBlogLoading(false);
    }
  };

  // Handler: Generate Outreach Emails
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
            recipientName: emailRecipientName,
            recipientRole: emailRecipientRole,
            relevanceTopic: emailTopic,
            competitorName: emailCompetitor,
            angleHook: emailAngleHook,
            customNotes: emailNotes,
            toneOverrides: getToneOverrides(),
          },
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.variations)) {
        setEmailVariations(data.variations);
        setSelectedVariationIndex(0);
        toast.success('Generated 3 tailored email pitch variations');
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

  // Handler: Generate Thought Leadership
  const handleGenerateThoughtLeadership = async () => {
    setThoughtLoading(true);
    try {
      const res = await fetch('/api/content-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'thought_leadership',
          params: {
            topic: thoughtTopic,
            platform: thoughtPlatform,
            contrarianAngle: thoughtContrarianAngle,
            authorRole: thoughtAuthorRole,
            customContext: thoughtContext,
            toneOverrides: getToneOverrides(),
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.post) {
        setThoughtResult(data.post);
        toast.success('Generated executive thought leadership piece');
      } else {
        toast.error(data.error || 'Failed to generate piece');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error generating thought leadership');
    } finally {
      setThoughtLoading(false);
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
            buyerPersona: faqPersona,
            targetEngine: faqEngine,
            toneOverrides: getToneOverrides(),
          },
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.faqs)) {
        setFaqList(data.faqs);
        if (data.toneAlignment) setFaqToneAlignment(data.toneAlignment);
        toast.success('Synthesized 4 semantic FAQ pairs');
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
            buyerPriority: compBuyerPriority,
            toneOverrides: getToneOverrides(),
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.comparison) {
        setCompResult(data.comparison);
        toast.success('Generated positioning matrix');
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

  // Handler: Export Email Variation to Outreach CRM
  const handleExportToCrm = async (variation: OutreachEmailVariation) => {
    setExportingToCrm(true);
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicationName: variation.publicationDomain || emailDomain,
          publicationDomain: variation.publicationDomain || emailDomain,
          contactName: variation.recipientName || emailRecipientName,
          contactRole: variation.recipientRole || emailRecipientRole,
          pitchSubject: variation.subject,
          pitchBody: variation.body,
          editorAngle: variation.targetAngle,
          suggestedHook: variation.editorHook,
          competitorDisplaced: emailCompetitor,
          stage: 'generated',
          priority: 'high',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Exported pitch directly to Outreach CRM pipeline!`, {
          description: `Logged under ${variation.publicationDomain || emailDomain}`,
        });
      } else {
        toast.error(data.error || 'Failed to export to CRM');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error exporting to CRM');
    } finally {
      setExportingToCrm(false);
    }
  };

  // Copy Helpers
  const copyToClipboard = (text: string, onCopied: (v: boolean) => void, msg = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    onCopied(true);
    toast.success(msg);
    setTimeout(() => onCopied(false), 2000);
  };

  const activeVariation = emailVariations[selectedVariationIndex];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2.5 py-0.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Beacon AI Content Studio
            </Badge>
            <span className="text-xs font-semibold text-slate-400">Hybrid AEO & Editorial Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Brand-Calibrated Content Creator
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Generate high-velocity, publication-ready assets customized to <span className="font-semibold text-slate-800">{brandName}</span>’s exact Brand Kit, tone sliders, and messaging pillars.
          </p>
        </div>
      </div>

      {/* 2. Interactive Tone Calibration Bar */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">{brandName} Brand Voice Calibration</span>
                <span className="text-xs text-slate-400 font-mono">({brandDomain})</span>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs">
                  Tone Verified
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 italic">
                &ldquo;{toneVoice}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowToneControls(!showToneControls)}
              className="text-xs h-8 gap-1.5 border-slate-200 hover:bg-slate-100 text-slate-700"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              {showToneControls ? 'Hide Tone Sliders' : 'Tune Brand Dimensions'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToneDefaults}
              className="text-xs h-8 text-slate-500 hover:text-slate-900 gap-1"
              title="Reset to project brand kit"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </div>

        {/* Collapsible Tone Dimensions Sliders */}
        {showToneControls && (
          <div className="p-4 sm:p-5 bg-white/80 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Slider 1: Formal vs Casual */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50/70 border border-slate-200">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Formal</span>
                  <span className="text-emerald-700 font-mono">{toneFormalCasual}/100</span>
                  <span className="text-slate-600">Casual</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={toneFormalCasual}
                  onChange={(e) => setToneFormalCasual(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 text-center">
                  {toneFormalCasual < 40 ? 'Elevated Institutional' : toneFormalCasual > 60 ? 'Conversational Casual' : 'Balanced Executive'}
                </p>
              </div>

              {/* Slider 2: Technical vs Accessible */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50/70 border border-slate-200">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Accessible</span>
                  <span className="text-emerald-700 font-mono">{toneTechnicalAccessible}/100</span>
                  <span className="text-slate-600">Technical</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={toneTechnicalAccessible}
                  onChange={(e) => setToneTechnicalAccessible(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 text-center">
                  {toneTechnicalAccessible > 60 ? 'Engineering & Lab Specs' : toneTechnicalAccessible < 40 ? 'Everyday Plaintext' : 'Accessible Precision'}
                </p>
              </div>

              {/* Slider 3: Bold vs Understated */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50/70 border border-slate-200">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Understated</span>
                  <span className="text-emerald-700 font-mono">{toneBoldUnderstated}/100</span>
                  <span className="text-slate-600">Bold</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={toneBoldUnderstated}
                  onChange={(e) => setToneBoldUnderstated(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 text-center">
                  {toneBoldUnderstated > 60 ? 'Category Benchmark' : toneBoldUnderstated < 40 ? 'Quiet Luxury' : 'Confident & Measured'}
                </p>
              </div>

              {/* Slider 4: Analytical vs Inspiring */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50/70 border border-slate-200">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Analytical</span>
                  <span className="text-emerald-700 font-mono">{toneAnalyticalInspiring}/100</span>
                  <span className="text-slate-600">Inspiring</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={toneAnalyticalInspiring}
                  onChange={(e) => setToneAnalyticalInspiring(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 text-center">
                  {toneAnalyticalInspiring > 60 ? 'Visionary Movement' : toneAnalyticalInspiring < 40 ? 'Rigorous Data-First' : 'Empirical Inspiration'}
                </p>
              </div>
            </div>

            {/* Tone Tags & Messaging Pillars readout */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Active Tone Tags:</span>
              {(brandKit.tone_tags || ['Mindful', 'Technical', 'Empowering']).map((tag, i) => (
                <Badge key={i} variant="outline" className="bg-white border-slate-200 text-slate-700 font-normal">
                  {tag}
                </Badge>
              ))}
              <span className="ml-auto text-[11px] text-emerald-700 font-medium">
                Negative Keyword Filters Active: {(brandKit.negative_keywords || []).length} terms blocked
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* 3. Main Format Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/90 p-1 rounded-xl flex-wrap h-auto gap-1 border border-slate-200">
          <TabsTrigger value="blog" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs rounded-lg py-2 px-3.5 gap-2 text-xs font-semibold">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Authority Blog & AEO Guide
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs rounded-lg py-2 px-3.5 gap-2 text-xs font-semibold">
            <Mail className="w-4 h-4 text-emerald-600" />
            Editorial Outreach Pitches
          </TabsTrigger>
          <TabsTrigger value="thought_leadership" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs rounded-lg py-2 px-3.5 gap-2 text-xs font-semibold">
            <Share2 className="w-4 h-4 text-emerald-600" />
            Executive Thought Leadership
          </TabsTrigger>
          <TabsTrigger value="faq" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs rounded-lg py-2 px-3.5 gap-2 text-xs font-semibold">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Semantic FAQ Schema
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs rounded-lg py-2 px-3.5 gap-2 text-xs font-semibold">
            <Scale className="w-4 h-4 text-emerald-600" />
            Competitor Comparison
          </TabsTrigger>
        </TabsList>

        {/* =================================================================== */}
        {/* TAB 1: AUTHORITY BLOG & AEO GUIDE                                   */}
        {/* =================================================================== */}
        <TabsContent value="blog" className="space-y-6 focus-visible:outline-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls */}
            <Card className="lg:col-span-5 border-slate-200 shadow-sm h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-slate-900">AEO Article Configuration</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Engineer structured, entity-dense authority guides designed to earn citations across AI search engines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Topic Focus with Smart Suggest */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Article Topic / Title Focus</label>
                  </div>
                  <Input
                    value={blogTopic}
                    onChange={(e) => setBlogTopic(e.target.value)}
                    placeholder="e.g. The Architecture of Durability in Modern Activewear"
                    className="text-xs h-9 bg-white"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Smart Suggest:</span>
                    {[
                      'Biomechanical Slip Resistance & Zero-Roll Ergonomics',
                      'Fabric Longevity: 100-Cycle Industrial Wash Benchmarks',
                      'The Hidden Cost of Fast-Fashion Synthetic Synthetics',
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setBlogTopic(suggestion);
                          setBlogTargetQuery(`what are the benchmarks for ${suggestion.toLowerCase()}`);
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-md px-2 py-0.5 border border-slate-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target AI Query */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Target AI Search Query (Grounding Anchor)</label>
                  <Input
                    value={blogTargetQuery}
                    onChange={(e) => setBlogTargetQuery(e.target.value)}
                    placeholder="e.g. what are the most durable leggings for yoga"
                    className="text-xs h-9 bg-white"
                  />
                </div>

                {/* Target Buyer Stage & Format */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Target Buyer Stage</label>
                    <select
                      value={blogBuyerStage}
                      onChange={(e) => setBlogBuyerStage(e.target.value)}
                      className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-700 focus:outline-emerald-500"
                    >
                      <option value="awareness">Awareness (Educational)</option>
                      <option value="consideration">Consideration (Comparison)</option>
                      <option value="decision">Decision (Transactional Specs)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Article Format</label>
                    <select
                      value={blogArticleFormat}
                      onChange={(e) => setBlogArticleFormat(e.target.value)}
                      className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-700 focus:outline-emerald-500"
                    >
                      <option value="ultimate_guide">Ultimate Authority Guide</option>
                      <option value="deep_dive">Technical Lab Deep-Dive</option>
                      <option value="myth_buster">Category Myth-Buster</option>
                    </select>
                  </div>
                </div>

                {/* Primary Entity to Anchor */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Primary Brand Entity to Anchor</label>
                  <Input
                    value={blogPrimaryEntity}
                    onChange={(e) => setBlogPrimaryEntity(e.target.value)}
                    placeholder="e.g. Lululemon Proprietary Knit Innovation"
                    className="text-xs h-9 bg-white"
                  />
                </div>

                {/* Custom Context */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Specific Lab Stats or Proprietary Proof Points</label>
                  <Textarea
                    value={blogContext}
                    onChange={(e) => setBlogContext(e.target.value)}
                    placeholder="e.g. Include our 4x pill-resistance stat and 100-cycle wash test against Alo Yoga..."
                    rows={2}
                    className="text-xs bg-white resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerateBlog}
                  disabled={blogLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 gap-2 shadow-xs"
                >
                  {blogLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Synthesizing Authority Article...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Calibrated Article
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Executive Live Preview */}
            <div className="lg:col-span-7 space-y-4">
              {blogResult ? (
                <Card className="border-slate-200 shadow-md bg-white overflow-hidden">
                  {/* Article Reader Header */}
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/20">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-medium">
                          {blogResult.estimatedReadTime}
                        </Badge>
                        <Badge variant="outline" className="text-slate-600 border-slate-300 text-xs">
                          Entity: {blogResult.primaryEntity}
                        </Badge>
                      </div>

                      {/* Tone Alignment Badge */}
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] font-bold text-slate-800">
                          {blogResult.toneAlignment?.score || 96}% Tone Match
                        </span>
                      </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                      {blogResult.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-1">/{blogResult.slug}</p>

                    {/* Meta description callout */}
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-100/80 border border-slate-200 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Meta Description: </span>
                      {blogResult.metaDescription}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const fullMarkdown = `# ${blogResult.title}\n\n${blogResult.introduction}\n\n` +
                            blogResult.sections.map(s => `## ${s.heading}\n\n${s.content}${s.calloutBox ? `\n\n> **${s.calloutBox.title}**: ${s.calloutBox.text}` : ''}`).join('\n\n') +
                            `\n\n## Conclusion\n\n${blogResult.conclusion}\n\n### Key Takeaways\n` +
                            blogResult.keyTakeaways.map(t => `- ${t}`).join('\n');
                          copyToClipboard(fullMarkdown, setBlogCopiedMarkdown, 'Copied full markdown article');
                        }}
                        className="text-xs h-8 gap-1.5"
                      >
                        {blogCopiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {blogCopiedMarkdown ? 'Copied Markdown' : 'Copy Markdown'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const html = `<h1>${blogResult.title}</h1>\n<p>${blogResult.introduction}</p>\n` +
                            blogResult.sections.map(s => `<h2>${s.heading}</h2>\n<p>${s.content}</p>`).join('\n');
                          copyToClipboard(html, setBlogCopiedHtml, 'Copied HTML markup');
                        }}
                        className="text-xs h-8 gap-1.5"
                      >
                        {blogCopiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
                        {blogCopiedHtml ? 'Copied HTML' : 'Copy HTML'}
                      </Button>
                    </div>
                  </div>

                  {/* Article Body Content */}
                  <CardContent className="p-6 space-y-6 text-sm text-slate-700 leading-relaxed font-sans max-h-[600px] overflow-y-auto">
                    {/* Table of Contents */}
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Table of Contents</p>
                      <ul className="space-y-1 text-xs text-emerald-700">
                        {blogResult.tableOfContents.map((item, i) => (
                          <li key={i} className="hover:underline cursor-pointer flex items-center gap-1.5">
                            <span className="text-slate-400 font-mono text-[10px]">{i + 1}.</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Introduction */}
                    <p className="text-slate-800 text-sm font-medium leading-relaxed italic border-l-2 border-emerald-500 pl-3">
                      {blogResult.introduction}
                    </p>

                    {/* Sections */}
                    {blogResult.sections.map((section, index) => (
                      <div key={index} className="space-y-3 pt-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          {section.heading}
                        </h3>
                        {section.subheading && (
                          <p className="text-xs font-semibold text-emerald-800 -mt-1">{section.subheading}</p>
                        )}
                        <p className="text-slate-600 text-sm leading-relaxed">{section.content}</p>

                        {/* Callout Box */}
                        {section.calloutBox && (
                          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                            <Award className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-emerald-950">{section.calloutBox.title}</p>
                              <p className="text-xs text-emerald-900 mt-0.5">{section.calloutBox.text}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Conclusion & Takeaways */}
                    <div className="pt-4 border-t border-slate-200 space-y-4">
                      <h3 className="text-base font-bold text-slate-900">Key Takeaways</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {blogResult.keyTakeaways.map((takeaway, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-700 font-medium">{takeaway}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 italic pt-2">{blogResult.conclusion}</p>
                    </div>

                    {/* Embedded FAQ Schema Snippet */}
                    <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-400">Schema.org FAQ Markup Included</span>
                        <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                          JSON-LD
                        </Badge>
                      </div>
                      <div className="space-y-2 pt-1 text-slate-300">
                        {blogResult.schemaFaq.map((faq, i) => (
                          <div key={i} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                            <p className="font-semibold text-white">Q: {faq.question}</p>
                            <p className="text-slate-400 mt-0.5">A: {faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-2 border-slate-200 p-12 text-center bg-slate-50/50 rounded-xl">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">No Article Generated Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Select your topic focus and target AI query on the left, then click &ldquo;Generate Calibrated Article&rdquo; to build a long-form AEO authority guide.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 2: EDITORIAL OUTREACH PITCHES                                  */}
        {/* =================================================================== */}
        <TabsContent value="email" className="space-y-6 focus-visible:outline-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Personalization & Pitch Parameters */}
            <Card className="lg:col-span-5 border-slate-200 shadow-sm h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-700" />
                  Target Editorial Parameters
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Configure journalist recipient, publication domain, and displacement angle to synthesize brand-calibrated pitches.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Journalist Persona Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Recipient Name</label>
                    <Input
                      placeholder="e.g. Sarah Jenkins"
                      value={emailRecipientName}
                      onChange={(e) => setEmailRecipientName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Recipient Role / Beat</label>
                    <Input
                      placeholder="e.g. Senior Gear Editor"
                      value={emailRecipientRole}
                      onChange={(e) => setEmailRecipientRole(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Publication Domain</label>
                  <Input
                    placeholder="e.g. nytimes.com/wirecutter or vogue.com"
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Article / Roundup Topic</label>
                  <Input
                    placeholder="e.g. The Best Workout Leggings & Activewear of 2026"
                    value={emailTopic}
                    onChange={(e) => setEmailTopic(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Competitor to Displace</label>
                  <Input
                    placeholder="e.g. Alo Yoga or Vuori"
                    value={emailCompetitor}
                    onChange={(e) => setEmailCompetitor(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Pitch Angle Hook & Smart Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Strategic Angle Hook</label>
                  <Input
                    placeholder="e.g. Displace with 100-cycle wash test data"
                    value={emailAngleHook}
                    onChange={(e) => setEmailAngleHook(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 self-center">Smart Suggest:</span>
                    {[
                      '100-cycle wash compression retention',
                      'Proprietary circular yarn specs',
                      'Offer samples in sizes 2-14',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setEmailAngleHook(`Lead with ${chip} to displace competitor`)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors border border-slate-200"
                      >
                        +{chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Custom Pitch Directives (Optional)</label>
                  <Textarea
                    placeholder="e.g. Mention our upcoming B-Corp certification and founder availability for a 15-min background briefing..."
                    value={emailNotes}
                    onChange={(e) => setEmailNotes(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerateEmails}
                  disabled={emailLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs h-9.5 gap-2"
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Synthesizing 3 Calibrated Angles...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate 3 Tailored Pitches
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Column: Live Email Client & Variation Preview */}
            <Card className="lg:col-span-7 border-slate-200 shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Send className="h-4 w-4 text-emerald-600" />
                    Live Pitch Client & Variations
                  </CardTitle>
                  {emailVariations.length > 0 && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-mono">
                      3 Variations Generated
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Inspect editorial hooks, tone verification, or export directly to your Outreach CRM.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                {emailVariations.length === 0 ? (
                  <div className="h-80 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-auto">
                    <Mail className="h-10 w-10 text-slate-300 mb-3" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No Outreach Pitches Generated</h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Configure the target publication and journalist persona to generate 3 brand-tailored editorial pitch angles.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateEmails}
                      disabled={emailLoading}
                      className="text-xs border-slate-200 bg-white hover:bg-slate-50"
                    >
                      Quick-Generate Demo Pitches
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Variation Selector Tabs */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/90 rounded-lg border border-slate-200">
                      {emailVariations.map((v, idx) => (
                        <button
                          key={v.id || idx}
                          onClick={() => setSelectedVariationIndex(idx)}
                          className={`px-3 py-2 rounded-md text-left transition-all ${
                            selectedVariationIndex === idx
                              ? 'bg-white text-slate-900 shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[10px] font-mono block text-emerald-700 uppercase font-bold">
                              Angle {idx + 1}
                            </span>
                            {v.toneAlignment && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {v.toneAlignment.score}% Tone
                              </span>
                            )}
                          </div>
                          <span className="text-xs block leading-tight truncate">
                            {v.angleTitle.split('&')[0].trim()}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Active Variation Live Email Client Mockup */}
                    {activeVariation && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Browser / Email Client Frame */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                          {/* Mock Client Window Top Bar */}
                          <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                              <span className="ml-2 font-mono text-[11px] text-slate-600 font-medium">Beacon Mail Client · Draft</span>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Brand-Calibrated Tone
                            </span>
                          </div>

                          {/* Email Headers */}
                          <div className="p-3.5 space-y-2 border-b border-slate-100 bg-slate-50/50 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-500 w-14 shrink-0">To:</span>
                              <span className="font-medium text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {activeVariation.recipientName || emailRecipientName} &lt;{activeVariation.recipientRole || emailRecipientRole}&gt; · {activeVariation.publicationDomain || emailDomain}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-500 w-14 shrink-0">From:</span>
                              <span className="text-slate-700 font-mono text-[11px]">
                                Editorial Liaison &lt;press@{brandDomain}&gt;
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="font-semibold text-slate-500 w-14 shrink-0">Subject:</span>
                                <span className="font-semibold text-slate-900 truncate">
                                  {activeVariation.subject}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(activeVariation.subject);
                                  setCopiedSubject(true);
                                  toast.success('Subject line copied');
                                  setTimeout(() => setCopiedSubject(false), 2000);
                                }}
                                className="h-6 text-[10px] text-slate-500 hover:text-emerald-700 px-2 shrink-0"
                              >
                                {copiedSubject ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                                {copiedSubject ? 'Copied' : 'Copy'}
                              </Button>
                            </div>
                          </div>

                          {/* Editorial Angle Callout */}
                          <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-start gap-2.5 text-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            <div className="space-y-0.5 text-slate-700">
                              <span className="font-bold text-emerald-950 block">{activeVariation.angleTitle}</span>
                              <p className="text-[11px] text-slate-600"><span className="font-semibold text-slate-800">Hook:</span> {activeVariation.editorHook}</p>
                              <p className="text-[11px] text-slate-600"><span className="font-semibold text-slate-800">Key Proof:</span> {activeVariation.keyDifferentiator}</p>
                            </div>
                          </div>

                          {/* Email Body */}
                          <div className="p-4 sm:p-5 text-xs sm:text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto bg-white">
                            {activeVariation.body}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`Subject: ${activeVariation.subject}\n\n${activeVariation.body}`);
                              setCopiedBody(true);
                              toast.success('Complete email copied to clipboard');
                              setTimeout(() => setCopiedBody(false), 2000);
                            }}
                            className="text-xs h-8 border-slate-200 hover:bg-slate-50 gap-1.5"
                          >
                            {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedBody ? 'Copied Pitch' : 'Copy Full Pitch'}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleExportToCrm(activeVariation)}
                            disabled={exportingToCrm}
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 shadow-xs"
                          >
                            {exportingToCrm ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Exporting to CRM...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                Export to Outreach CRM
                              </>
                            )}
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

        {/* =================================================================== */}
        {/* TAB 3: EXECUTIVE THOUGHT LEADERSHIP                                */}
        {/* =================================================================== */}
        <TabsContent value="thought_leadership" className="space-y-6 focus-visible:outline-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Narrative Parameters */}
            <Card className="lg:col-span-5 border-slate-200 shadow-sm h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-emerald-700" />
                  Executive Narrative Configuration
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Synthesize high-conviction executive essays and LinkedIn posts calibrated to your brand voice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Publishing Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'linkedin', label: 'LinkedIn Post', desc: 'Viral Hook + Takeaways' },
                      { id: 'substack', label: 'Substack Essay', desc: 'Deep-Dive Analytical' },
                      { id: 'op_ed', label: 'Tier-1 Op-Ed', desc: 'Elevated Editorial' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setThoughtPlatform(p.id as 'linkedin' | 'substack' | 'op_ed')}
                        className={`p-2 rounded-lg text-left border transition-all ${
                          thoughtPlatform === p.id
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs block font-bold">{p.label}</span>
                        <span className="text-[10px] text-slate-500 block leading-tight">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Core Narrative Focus / Topic</label>
                  <Input
                    placeholder="e.g. Why the Fast-Fashion Athleisure Playbook Fails in AI Search"
                    value={thoughtTopic}
                    onChange={(e) => setThoughtTopic(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Contrarian Angle & Smart Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Contrarian Angle / Core Argument</label>
                  <Input
                    placeholder="e.g. Why chasing seasonal micro-drops destroys answer engine authority"
                    value={thoughtContrarianAngle}
                    onChange={(e) => setThoughtContrarianAngle(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 self-center">Smart Suggest:</span>
                    {[
                      'Seasonal drops destroy AEO equity',
                      'LLMs reward verified lab durability',
                      'Entity co-occurrence over backlinks',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setThoughtContrarianAngle(`Why ${chip}`)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors border border-slate-200"
                      >
                        +{chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Author Bylaw & Executive Role</label>
                  <Input
                    placeholder="e.g. Founder & Head of Materials Innovation"
                    value={thoughtAuthorRole}
                    onChange={(e) => setThoughtAuthorRole(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Supporting Evidence & Context (Optional)</label>
                  <Textarea
                    placeholder="e.g. Include our recent tensile strength lab findings and customer wear-test feedback..."
                    value={thoughtContext}
                    onChange={(e) => setThoughtContext(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerateThoughtLeadership}
                  disabled={thoughtLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs h-9.5 gap-2"
                >
                  {thoughtLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Crafting Executive Piece...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate Executive Thought Leadership
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Column: Live Reader & Card Mockup */}
            <Card className="lg:col-span-7 border-slate-200 shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600" />
                    Executive Reader & Draft Preview
                  </CardTitle>
                  {thoughtResult && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-mono">
                        3 min read
                      </Badge>
                      {thoughtResult.toneAlignment && (
                        <Badge variant="outline" className="text-xs font-mono border-emerald-200 text-emerald-800">
                          {thoughtResult.toneAlignment.score}% Tone
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Review the contrarian thesis, formatted social reader layout, and key takeaway anchors.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                {!thoughtResult ? (
                  <div className="h-80 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-auto">
                    <Share2 className="h-10 w-10 text-slate-300 mb-3" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No Thought Leadership Generated Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Select your target channel and contrarian thesis to generate an executive-grade essay or social piece.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateThoughtLeadership}
                      disabled={thoughtLoading}
                      className="text-xs border-slate-200 bg-white hover:bg-slate-50"
                    >
                      Quick-Generate Sample Essay
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Social Post / Substack Card Mockup */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                      {/* Author Header Bar */}
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                            {brandName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{brandName} Leadership</span>
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0">
                                Verified Voice
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {thoughtAuthorRole} · Just now
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const text = `${thoughtResult.hook}\n\n` +
                                thoughtResult.narrativeSections.join('\n\n') +
                                `\n\nKey Insights:\n` +
                                thoughtResult.actionableInsights.map((t: string) => `• ${t}`).join('\n') +
                                (thoughtResult.discussionPrompt ? `\n\nDiscussion Question:\n${thoughtResult.discussionPrompt}` : '') +
                                `\n\n` + thoughtResult.hashtags.map((h: string) => `#${h.replace(/^#/, '')}`).join(' ');
                              copyToClipboard(text, setThoughtCopied, 'Copied full draft to clipboard');
                            }}
                            className="text-xs h-8 gap-1.5 border-slate-200"
                          >
                            {thoughtCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            {thoughtCopied ? 'Copied' : 'Copy Post'}
                          </Button>
                        </div>
                      </div>

                      {/* Hook & Thesis Callout */}
                      <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 space-y-1.5">
                        <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide font-mono">
                          Opening Hook
                        </p>
                        <p className="text-sm font-semibold text-slate-900 leading-snug">
                          &ldquo;{thoughtResult.hook}&rdquo;
                        </p>
                        <div className="pt-1.5 border-t border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-1.5">
                          <span className="font-bold text-emerald-950 shrink-0">Core Thesis:</span>
                          <span>{thoughtResult.thesis}</span>
                        </div>
                      </div>

                      {/* Main Narrative Body */}
                      <div className="p-5 text-xs sm:text-sm text-slate-800 leading-relaxed max-h-80 overflow-y-auto font-sans space-y-3.5">
                        {thoughtResult.narrativeSections.map((paragraph, pIdx) => (
                          <p key={pIdx}>
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {/* Actionable Insights */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide font-mono block">
                          Actionable Insights & Directives
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {thoughtResult.actionableInsights.map((insight: string, i: number) => (
                            <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="text-xs text-slate-700 font-medium">{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Discussion Prompt */}
                      {thoughtResult.discussionPrompt && (
                        <div className="p-3.5 bg-emerald-50/40 border-t border-slate-100 text-xs text-slate-700 italic flex items-start gap-2">
                          <span className="font-semibold text-emerald-900 not-italic shrink-0">Discussion Prompt:</span>
                          <span>&ldquo;{thoughtResult.discussionPrompt}&rdquo;</span>
                        </div>
                      )}

                      {/* Hashtags & Entities Footer */}
                      <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        {thoughtResult.hashtags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60"
                          >
                            #{tag.replace(/^#/, '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 4: SEMANTIC FAQ SCHEMA                                         */}
        {/* =================================================================== */}
        <TabsContent value="faq" className="space-y-6 focus-visible:outline-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: FAQ Target Parameters */}
            <Card className="lg:col-span-5 border-slate-200 shadow-sm h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-700" />
                  Semantic FAQ Configuration
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Generate structured FAQ answer blocks engineered for direct citation in AI search engines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Topic Area / Product Category</label>
                  <Input
                    value={faqTopic}
                    onChange={(e) => setFaqTopic(e.target.value)}
                    placeholder="e.g. Product Materials, True-to-Size Sizing & Longevity"
                    className="h-9 text-xs"
                  />
                </div>

                {/* Buyer Persona & Smart Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Target Buyer Persona</label>
                  <Input
                    value={faqPersona}
                    onChange={(e) => setFaqPersona(e.target.value)}
                    placeholder="e.g. Mindful Movement Practitioners & Quality-Conscious Shoppers"
                    className="h-9 text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 self-center">Smart Suggest:</span>
                    {[
                      'Fabric Longevity & Anti-Pilling',
                      'True-to-Size Compression vs Competitors',
                      'Cold-Water Wash Longevity',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setFaqTopic(chip)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors border border-slate-200"
                      >
                        +{chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Target AI Engine</label>
                  <Input
                    value={faqEngine}
                    onChange={(e) => setFaqEngine(e.target.value)}
                    placeholder="e.g. Google AI Overviews or ChatGPT Search"
                    className="h-9 text-xs"
                  />
                </div>

                <Button
                  onClick={handleGenerateFaq}
                  disabled={faqLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs h-9.5 gap-2"
                >
                  {faqLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Synthesizing Semantic FAQs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Synthesize 4 Semantic FAQ Pairs
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Column: FAQ List & Schema.org JSON-LD */}
            <Card className="lg:col-span-7 border-slate-200 shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Semantic FAQ Blocks & Schema Markup
                  </CardTitle>
                  {faqList.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const schemaJson = {
                          '@context': 'https://schema.org',
                          '@type': 'FAQPage',
                          mainEntity: faqList.map((f) => ({
                            '@type': 'Question',
                            name: f.question,
                            acceptedAnswer: {
                              '@type': 'Answer',
                              text: f.answer,
                            },
                          })),
                        };
                        copyToClipboard(JSON.stringify(schemaJson, null, 2), setFaqCopiedSchema, 'Copied Schema.org FAQ JSON-LD');
                      }}
                      className="text-xs h-8 gap-1.5 border-slate-200"
                    >
                      {faqCopiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {faqCopiedSchema ? 'Copied JSON-LD' : 'Copy Schema.org JSON-LD'}
                    </Button>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Structured question-and-answer pairs calibrated for entity clarity and LLM answer extraction.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                {faqList.length === 0 ? (
                  <div className="h-80 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-auto">
                    <HelpCircle className="h-10 w-10 text-slate-300 mb-3" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No FAQ Blocks Generated</h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Configure your target buyer persona and topic to generate 4 high-yield, entity-dense FAQ pairs.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateFaq}
                      disabled={faqLoading}
                      className="text-xs border-slate-200 bg-white hover:bg-slate-50"
                    >
                      Quick-Generate Demo FAQs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {faqList.map((faq, idx) => (
                      <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-colors space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-emerald-700 font-mono">Q{idx + 1}.</span>
                            {faq.question}
                          </h4>
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-mono shrink-0">
                            {faq.targetEntity}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed pl-6">{faq.answer}</p>
                        <div className="pl-6 pt-1 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-100">
                          <span className="font-semibold text-slate-700">AEO Engine Rationale:</span>
                          <span>{faq.llmRationale}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 5: COMPETITOR COMPARISON MATRIX                                */}
        {/* =================================================================== */}
        <TabsContent value="comparison" className="space-y-6 focus-visible:outline-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Comparison Parameters */}
            <Card className="lg:col-span-4 border-slate-200 shadow-sm h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-700" />
                  Comparison Parameters
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Generate objective head-to-head positioning matrices for AI search citations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Target Competitor</label>
                  <Input
                    value={compCompetitor}
                    onChange={(e) => setCompCompetitor(e.target.value)}
                    placeholder="e.g. Alo Yoga or Lululemon"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category / Feature Focus</label>
                  <Input
                    value={compFocus}
                    onChange={(e) => setCompFocus(e.target.value)}
                    placeholder="e.g. Fabric Durability, Compression Retention & Waistband"
                    className="h-9 text-xs"
                  />
                </div>

                {/* Buyer Decision Priority & Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Buyer Decision Priority</label>
                  <Input
                    value={compBuyerPriority}
                    onChange={(e) => setCompBuyerPriority(e.target.value)}
                    placeholder="e.g. Long-term shape retention and zero waistband rollover"
                    className="h-9 text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 self-center">Smart Suggest:</span>
                    {[
                      '100-Wash Shape Retention',
                      'Certified Recycled Yarn Specs',
                      'Zero-Rollover Waistband',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCompBuyerPriority(chip)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors border border-slate-200"
                      >
                        +{chip}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerateComparison}
                  disabled={compLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs h-9.5 gap-2"
                >
                  {compLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating Head-to-Head Matrix...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate Head-to-Head Matrix
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Column: Positioning Matrix Table & Snippet */}
            <Card className="lg:col-span-8 border-slate-200 shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-emerald-600" />
                    Head-to-Head Positioning Matrix
                  </CardTitle>
                  {compResult && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        copyToClipboard(compResult.positioningSnippet, setCopiedSnippet, 'Copied positioning snippet');
                      }}
                      className="text-xs h-8 gap-1.5 border-slate-200"
                    >
                      {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSnippet ? 'Copied' : 'Copy Snippet'}
                    </Button>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Deployable entity comparison blocks designed for citation in Google AI Overviews and ChatGPT search.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                {!compResult ? (
                  <div className="h-80 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-auto">
                    <Scale className="h-10 w-10 text-slate-300 mb-3" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No Comparison Matrix Generated</h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Select a competitor and feature focus to generate a structured entity comparison matrix.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateComparison}
                      disabled={compLoading}
                      className="text-xs border-slate-200 bg-white hover:bg-slate-50"
                    >
                      Generate Sample Matrix
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{compResult.comparisonTitle}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{compResult.summary}</p>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600">
                          <tr>
                            <th className="p-3">Evaluation Dimension</th>
                            <th className="p-3 text-emerald-950 bg-emerald-50 font-bold">{brandName} Advantage</th>
                            <th className="p-3 text-slate-700">{compCompetitor} Gap</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {compResult.dimensions.map((dim, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="p-3 font-semibold text-slate-900 align-top">{dim.dimension}</td>
                              <td className="p-3 text-slate-800 bg-emerald-50/30 align-top leading-relaxed">{dim.brandAdvantage}</td>
                              <td className="p-3 text-slate-600 align-top leading-relaxed">{dim.competitorGap}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                          Deploy-Ready Markdown Block
                        </label>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {compResult.positioningSnippet}
                      </div>
                    </div>
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
