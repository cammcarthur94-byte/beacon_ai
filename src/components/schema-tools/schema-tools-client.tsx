'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Code2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Search,
  RefreshCw,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  Layers,
  Bot,
  Zap,
  HelpCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { SchemaAuditResult, SchemaValidationIssue } from '@/app/api/schema-tools/route';

const PRESETS = [
  {
    label: 'Product Page',
    sub: 'Lululemon Align Pant',
    url: 'https://lululemon.com/p/align-high-rise-pant',
  },
  {
    label: 'Editorial Review',
    sub: 'Wirecutter Leggings Guide',
    url: 'https://nytimes.com/wirecutter/reviews/best-workout-leggings',
  },
  {
    label: 'Custom Landing Page',
    sub: 'Clean Demo Scan',
    url: 'https://lululemon.com/c/womens-pants',
  },
];

export function SchemaToolsClient() {
  const [urlInput, setUrlInput] = useState('https://lululemon.com/p/align-high-rise-pant');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<SchemaAuditResult | null>(null);

  const [generatingFix, setGeneratingFix] = useState(false);
  const [correctiveCode, setCorrectiveCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    runAudit(urlInput);
  }, []);

  const runAudit = async (target: string) => {
    if (!target.trim()) return;
    setLoading(true);
    setCorrectiveCode(null);
    try {
      const res = await fetch('/api/schema-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: target, action: 'audit' }),
      });
      if (res.ok) {
        const json = await res.json();
        setAuditResult(json.audit);
      }
    } catch (err) {
      console.error('Failed to run schema audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFix = async () => {
    if (!auditResult?.url) return;
    setGeneratingFix(true);
    try {
      const res = await fetch('/api/schema-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: auditResult.url, action: 'generate_fix' }),
      });
      if (res.ok) {
        const json = await res.json();
        setCorrectiveCode(json.correctiveJsonLd);
      }
    } catch (err) {
      console.error('Failed to generate corrective JSON-LD:', err);
    } finally {
      setGeneratingFix(false);
    }
  };

  const handleCopyCode = () => {
    if (!correctiveCode) return;
    navigator.clipboard.writeText(correctiveCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCode = () => {
    if (!correctiveCode) return;
    const blob = new Blob([correctiveCode], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beacon-schema-fix.jsonld';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 font-mono text-[11px]">
              <Sparkles className="h-3 w-3 mr-1 text-emerald-600 inline" />
              AI Search &amp; Web Inspection
            </Badge>
            <span className="text-xs text-slate-400">Structured Data &amp; Website Code</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Schema & Markup Validator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit pages for AI search engine readiness, diagnose missing website details, and generate website code.
          </p>
        </div>

        {auditResult && auditResult.issues.length > 0 && (
          <Button
            size="sm"
            onClick={handleGenerateFix}
            disabled={generatingFix}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs self-start md:self-auto"
          >
            <Sparkles className={cn('h-3.5 w-3.5 mr-1.5', generatingFix && 'animate-spin')} />
            {generatingFix ? 'Generating Website Code...' : 'Generate Website Code'}
          </Button>
        )}
      </div>

      {/* URL Input Bar & Presets */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAudit(urlInput);
          }}
          className="flex flex-col sm:flex-row items-center gap-2.5"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Enter landing page or product URL (e.g. https://domain.com/product)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 text-xs shadow-2xs font-mono"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shrink-0 shadow-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
            {loading ? 'Auditing...' : 'Audit URL'}
          </Button>
        </form>

        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Test Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p.url}
              onClick={() => {
                setUrlInput(p.url);
                runAudit(p.url);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
            >
              <span className="font-semibold text-slate-900">{p.label}</span>
              <span className="text-slate-400 text-[11px]">({p.sub})</span>
            </button>
          ))}
        </div>
      </div>

      {auditResult && (
        <div className="space-y-6">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-500 block mb-1">AI SEARCH READINESS</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-sans text-slate-900">
                      {auditResult.llmReadinessScore}
                    </span>
                    <span className="text-sm font-mono text-slate-400">/ 100</span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-1">
                    {auditResult.llmReadinessScore >= 80 ? 'Optimal for AI Recommendations' : 'Structured Data Improvements Recommended'}
                  </span>
                </div>
                <div className={cn('h-14 w-14 rounded-2xl border flex items-center justify-center font-bold text-xl', getScoreColor(auditResult.llmReadinessScore))}>
                  <Code2 className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-500 block mb-1">GOOGLE AI OVERVIEWS</span>
                  <div className="flex items-center gap-2 mt-1">
                    {auditResult.aiOverviewEligible ? (
                      <Badge className="bg-emerald-600 text-white text-xs px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Eligible
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs px-2 py-0.5">
                        <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" /> Action Needed
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block mt-2">
                    {auditResult.aiOverviewEligible
                      ? 'Structured signals qualified for rich summaries'
                      : 'Missing FAQ or Speakable elements for AI answer snippets'}
                  </span>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Bot className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-500 block mb-1">SCHEMAS IDENTIFIED</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {auditResult.schemasFound.map((s) => (
                      <Badge key={s} variant="outline" className="border-slate-300 bg-slate-50 text-slate-800 text-[11px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 block mt-2">
                    {auditResult.detectedJsonLd.length} structured code blocks found
                  </span>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <Layers className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>
          </div>

          {correctiveCode && (
            <Card className="border-emerald-300 bg-emerald-50/30 shadow-md animate-in slide-in-from-top-2 duration-300">
              <CardHeader className="py-3 px-5 border-b border-emerald-200 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Optimized Website Code (Ready for Google AI &amp; AI Search Tools)
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyCode}
                    className="h-8 text-xs border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                  >
                    {copiedCode ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copiedCode ? 'Copied' : 'Copy Code'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadCode}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download File
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed select-all">
                  <code>{correctiveCode}</code>
                </pre>
                <p className="text-[11px] text-slate-500 mt-2">
                  Paste this structured markup directly inside your website's <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">&lt;head&gt;</code> tag or CMS script manager.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="py-4 px-5 border-b border-slate-200 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Audit Findings & Missing Schema Elements
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {auditResult.issues.length} items flagged for search engine crawl readiness
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 font-mono text-[11px]">
                  {auditResult.issues.filter((i) => i.type === 'error').length} Errors · {auditResult.issues.filter((i) => i.type === 'warning').length} Warnings
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {auditResult.issues.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    No critical issues detected. Structured data is fully compliant!
                  </div>
                ) : (
                  auditResult.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={cn(
                        'p-3.5 rounded-lg border text-xs space-y-1.5',
                        issue.type === 'error'
                          ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                          : issue.type === 'warning'
                          ? 'bg-amber-50/40 border-amber-200 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {issue.type === 'error' ? (
                            <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          )}
                          <span>{issue.message}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-mono uppercase px-1.5 py-0 shrink-0',
                            issue.impactOnAiCrawl === 'high' ? 'border-rose-300 text-rose-800' : 'border-slate-300 text-slate-700'
                          )}
                        >
                          {issue.impactOnAiCrawl} AI Impact
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-[11px] pl-5 leading-relaxed">
                        <span className="font-semibold text-slate-800">Recommendation:</span> {issue.recommendation}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="py-4 px-5 border-b border-slate-200">
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Verified Information Signals
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Confirmed tags and details recognized by AI search tools
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {auditResult.passedChecks.map((check, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100 text-xs text-slate-800"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{check}</span>
                  </div>
                ))}

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                    Discovered Brand &amp; Product Details:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {auditResult.semanticEntitiesIdentified.map((ent) => (
                      <span
                        key={ent}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {ent}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
