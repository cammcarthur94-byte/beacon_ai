'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
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
  Code2,
  Share2,
  Copy,
  Check,
  Download,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CompetitorFeatureItem } from '@/app/api/competitor-mapping/route';

export type ActionModalType = 'pr-pitch' | 'faq-schema' | 'proof-point';

interface CompetitorActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: ActionModalType | null;
  feat: CompetitorFeatureItem | null;
  brandName: string;
  topCompetitor: {
    name: string;
    domain?: string;
    hasFeature?: boolean;
    detail?: string;
    citationShare?: number;
    isUnlisted?: boolean;
  } | null;
}

export function CompetitorActionModal({
  isOpen,
  onClose,
  actionType,
  feat,
  brandName,
  topCompetitor,
}: CompetitorActionModalProps) {
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const competitorName = topCompetitor?.name || 'Competitor';
  const featureName = feat?.featureName || 'Feature';

  // Auto-generate or set proof point on open
  useEffect(() => {
    if (!isOpen || !actionType || !feat) {
      setGeneratedText('');
      setError(null);
      setIsGenerating(false);
      return;
    }

    if (actionType === 'proof-point') {
      const proofPointText = `# AI Search Visibility Proof Point
**Topic:** ${featureName}
**Brand:** ${brandName} (AI Recommendation Rate: ${feat.brandCitationShare}%)
**Primary Competitor:** ${competitorName} (AI Recommendation Rate: ${topCompetitor?.citationShare ?? 0}%)

### Executive Validation
${brandName} maintains a decisive recommendation lead over ${competitorName} for "${featureName}" in answer engines (ChatGPT, Claude, Gemini, and Perplexity).

### Specification Proof Point
${feat.brandDetail}

### Verified Disparity
While ${competitorName} provides ${topCompetitor?.detail || 'alternative specifications'}, ${brandName}'s offering is favored by generative models for superior performance parity and verified citation authority.`;

      setGeneratedText(proofPointText);
      setIsGenerating(false);
      setError(null);
      return;
    }

    // Trigger streaming generation for pr-pitch or faq-schema
    let isMounted = true;

    async function startStream() {
      setIsGenerating(true);
      setGeneratedText('');
      setError(null);

      try {
        const response = await fetch('/api/generate-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptType: actionType,
            brandName,
            featureName: feat?.featureName,
            category: feat?.category,
            brandDetail: feat?.brandDetail,
            competitorName,
            competitorDetail: topCompetitor?.detail || '',
            competitorShare: topCompetitor?.citationShare,
            brandShare: feat?.brandCitationShare,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Generation failed: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No readable stream available');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (isMounted) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          if (isMounted) {
            setGeneratedText(accumulated);
            // Auto scroll to bottom while streaming
            if (contentContainerRef.current) {
              contentContainerRef.current.scrollTop = contentContainerRef.current.scrollHeight;
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Action generation stream failed:', err);
          setError(err?.message || 'Failed to stream response from Claude.');
          toast.error('Failed to generate action content.');
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    }

    startStream();

    return () => {
      isMounted = false;
    };
  }, [isOpen, actionType, feat, brandName, competitorName, featureName, topCompetitor]);

  const handleCopy = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    if (!generatedText) return;
    const isFaq = actionType === 'faq-schema';
    const filename = isFaq
      ? `faq-schema-${featureName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
      : `pr-pitch-${featureName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    const mimeType = isFaq ? 'application/json' : 'text/plain;charset=utf-8;';

    const blob = new Blob([generatedText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleRegenerate = () => {
    if (actionType === 'proof-point') return;
    setGeneratedText('');
    setError(null);
    // Trigger generation by re-running effect logic
    const evt = new CustomEvent('regenerate-action');
    window.dispatchEvent(evt);
  };

  const getModalMeta = () => {
    switch (actionType) {
      case 'pr-pitch':
        return {
          title: `Draft PR & Editorial Pitch`,
          badgeLabel: 'PR & Media Outreach',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: Sparkles,
          description: `Strategic media pitch positioning ${brandName} above ${competitorName} for "${featureName}".`,
        };
      case 'faq-schema':
        return {
          title: `Generate FAQ Schema (JSON-LD)`,
          badgeLabel: 'AEO Structured Data',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: Code2,
          description: `Schema.org FAQPage structured markup designed to win AI Overviews and answer engine citations.`,
        };
      case 'proof-point':
        return {
          title: `Export Leadership Proof Point`,
          badgeLabel: 'Market Share Validation',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: Share2,
          description: `Verified parity proof point validating ${brandName}'s AI recommendation superiority.`,
        };
      default:
        return {
          title: 'AEO Recommended Action',
          badgeLabel: 'Action Tool',
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Sparkles,
          description: '',
        };
    }
  };

  const meta = getModalMeta();
  const Icon = meta.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-7 rounded-xl font-sans">
        <DialogHeader className="space-y-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${meta.badgeClass}`}
            >
              {meta.badgeLabel}
            </span>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              Powered by Claude Haiku 4.5
            </span>
          </div>

          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Icon className="h-5 w-5 text-slate-700" />
            <span>{meta.title}</span>
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            {meta.description}
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="py-4 space-y-3">
          {/* Status banner while streaming */}
          {isGenerating && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50/70 border border-purple-100 text-purple-800 text-xs font-medium animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-600" />
              <span>Streaming generation from Claude Haiku 4.5 in real time...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Error</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Text/Code Display Box */}
          <div
            ref={contentContainerRef}
            className="relative bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-[380px] overflow-y-auto font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-text scrollbar-thin shadow-2xs"
          >
            {generatedText ? (
              <>
                {generatedText}
                {isGenerating && (
                  <span className="inline-block w-1.5 h-3.5 bg-purple-600 animate-pulse ml-0.5 align-middle" />
                )}
              </>
            ) : isGenerating ? (
              <div className="flex items-center gap-2 text-slate-400 italic font-sans text-xs py-8 justify-center">
                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                Synthesizing strategic displacement angle...
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 pt-4 mt-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 self-start sm:self-center font-sans">
            {isGenerating ? (
              <span className="text-purple-600 font-medium">Generating content...</span>
            ) : generatedText ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Ready for deployment
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {actionType !== 'proof-point' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="h-8 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Regenerate
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!generatedText || isGenerating}
              className="h-8 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Download
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              disabled={!generatedText || isGenerating}
              className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800 shadow-2xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
