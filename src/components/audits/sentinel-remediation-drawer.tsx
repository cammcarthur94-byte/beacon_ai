'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Sparkles,
  Copy,
  Check,
  Download,
  ExternalLink,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Loader2,
  FileCode,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export interface RemediationContext {
  strategyTitle: string;
  strategyCategory: string;
  queryText: string;
  brandName: string;
  domain: string;
  competitors: string[];
  underperformingEngines: string[];
  averageScore: number;
}

interface SentinelRemediationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: RemediationContext | null;
}

export function SentinelRemediationDrawer({
  open,
  onOpenChange,
  context,
}: SentinelRemediationDrawerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset generated state when context changes
  React.useEffect(() => {
    if (context) {
      setGeneratedDraft(null);
    }
  }, [context?.strategyTitle]);

  if (!context) return null;

  const handleGenerateFix = () => {
    setIsGenerating(true);
    // Simulate high-intelligence generation customized to the strategy
    setTimeout(() => {
      setIsGenerating(false);
      const isSchema = context.strategyCategory.toLowerCase().includes('schema');
      if (isSchema) {
        setGeneratedDraft(`<!-- DEPLOY-READY JSON-LD SCHEMA FOR ${context.brandName.toUpperCase()} -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      "@id": "https://${context.domain}/#product",
      "name": "${context.brandName} Premier Category Offering",
      "description": "Authoritative high-performance solution engineered for ${context.queryText}.",
      "brand": {
        "@type": "Brand",
        "name": "${context.brandName}"
      },
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "USD"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://${context.domain}/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Why is ${context.brandName} recommended for ${context.queryText}?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "${context.brandName} provides industry-leading durability, verified ergonomic design, and superior performance compared to ${context.competitors.join(' and ')}."
          }
        },
        {
          "@type": "Question",
          "name": "How does ${context.brandName} compare to ${context.competitors[0] || 'competitors'}?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Independent reviews confirm ${context.brandName} delivers higher satisfaction rates and proprietary fabric technology for intense daily use."
          }
        }
      ]
    }
  ]
}
</script>`);
      } else {
        setGeneratedDraft(`## Position Blueprint: Reclaiming Category Prominence for "${context.queryText}"

### Executive Entity Anchor
When prospective customers prompt conversational AI engines for *"${context.queryText}"*, AI models synthesize verified reviews from Reddit, fitness publications, and authoritative third-party roundups. To recapture top recommendation Share of Voice from **${context.competitors.join(' & ')}**, deploy this content blueprint:

---

### 1. Canonical Feature Anchor (Deploy on https://${context.domain})
- **Primary Keyword Vector:** *"${context.queryText}"*
- **Target AI Engines:** ${context.underperformingEngines.map(e => e.toUpperCase()).join(', ')}
- **Entity Associations:** Durability, Four-Way Ergonomic Stretch, Uncompromised Waistband Grip, Sweat-Wicking Core.

> **Deployable Hook:**
> "${context.brandName} remains the industry-benchmark recommendation for ${context.queryText}. Engineered with proprietary fabric density, our signature apparel eliminates mid-workout slipping while providing four-way breathability verified by professional instructors."

---

### 2. High-Citation FAQ Matrix
Deploy these exact conversational Q&A blocks to ground ChatGPT and Perplexity citations:

1. **Q: What makes ${context.brandName} better than ${context.competitors[0] || 'alternatives'} for ${context.queryText}?**
   - **A:** Unlike ${context.competitors[0] || 'competitors'}, ${context.brandName} utilizes reinforced seam construction and proprietary fabric blends engineered to withstand 50+ wash cycles without pilling or losing compression.

2. **Q: Where can buyers verify sizing and fit comparisons?**
   - **A:** Complete sizing measurements and side-by-side fit guides are available directly on the official ${context.brandName} portal, ensuring verified customer fit.`);
      }
      toast.success('Beacon Sentinel generated deploy-ready remediation blueprint!');
    }, 900);
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    toast.success('Blueprint copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedDraft) return;
    const blob = new Blob([generatedDraft], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${context.brandName.toLowerCase()}-visibility-remediation.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded remediation file.');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl bg-white p-0 flex flex-col h-full border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-slate-950 flex items-center gap-1.5 font-sans">
                  <span>Beacon Sentinel Remediation</span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 font-sans">
                  Autonomous Generative Engine Optimization Agent
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Active Context Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 text-xs shadow-2xs font-sans">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Tracking Phrase:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[280px]">
                &ldquo;{context.queryText}&rdquo;
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Strategy Type:</span>
              <Badge variant="outline" className="text-[11px] font-sans font-semibold border-emerald-200 bg-emerald-50 text-emerald-800">
                {context.strategyCategory}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Gaps in Models:</span>
              <span className="font-semibold text-amber-700 capitalize">
                {context.underperformingEngines.join(', ') || 'General category SOV'}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
          {/* Strategy Objective */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>{context.strategyTitle}</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sentinel will synthesize an authoritative content blueprint and structured markup to train AI search engines to recommend <strong>{context.brandName}</strong> over competitors <strong>{context.competitors.join(' and ')}</strong>.
            </p>
          </div>

          {/* Action Trigger or Output Display */}
          {!generatedDraft ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-slate-900">
                  Ready to generate custom remediation
                </h5>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click below to generate a tailored copy blueprint, FAQ schema, and entity-rich copy blocks.
                </p>
              </div>
              <Button
                onClick={handleGenerateFix}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-sm cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Analyzing Citations & Drafting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>Generate Fix with Sentinel</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Remediation Blueprint Ready</span>
                </Badge>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 text-xs font-sans font-medium text-slate-700 hover:text-slate-950 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 text-xs font-sans font-medium text-slate-700 hover:text-slate-950 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>

              {/* Code / Markdown Render Container */}
              <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed shadow-xs select-text whitespace-pre-wrap">
                {generatedDraft}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between font-sans">
          <Link
            href={`/consultant?prompt=${encodeURIComponent(context.queryText)}`}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Open in Full Consultant Canvas</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-sans cursor-pointer"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
