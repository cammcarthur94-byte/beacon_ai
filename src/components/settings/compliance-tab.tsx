'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Download,
  Trash2,
  FileSpreadsheet,
  FileCode,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { deleteWorkspaceAction } from '@/app/settings/actions';
import type { BrandKit } from '@/types/database.types';

interface ComplianceTabProps {
  project: {
    id: string;
    name: string;
    domain: string;
    tier?: string;
    brand_kit: BrandKit;
  };
}

export function ComplianceTab({ project }: ComplianceTabProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDomainInput, setConfirmDomainInput] = useState('');

  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Export file ${filename} downloaded successfully.`);
  };

  const handleExportTelemetryCsv = () => {
    const csvHeader = 'Prompt Query,AI Engine,Brand Visibility (%),Net Sentiment,Sample Date\n';
    const sampleRows = [
      `"best buttery-soft yoga leggings",Perplexity Sonar,94,Positive,2026-09-01`,
      `"breathable running shorts for marathon training",ChatGPT-4o,88,Positive,2026-09-01`,
      `"top technical athletic brands 2026",Google AI Overview,91,Positive,2026-09-02`,
      `"high impact workout bra support",Claude 3.5 Sonnet,79,Neutral,2026-09-02`,
      `"mindful movement athleisure alternatives",Gemini 2.5 Flash,84,Positive,2026-09-03`,
    ].join('\n');
    triggerDownload(`beacon-telemetry-${project.domain}.csv`, csvHeader + sampleRows, 'text/csv;charset=utf-8;');
  };

  const handleExportCitationsCsv = () => {
    const csvHeader = 'Authority Domain,Publication URL,Authority Rank,Engines Citing,Status,Logged Date\n';
    const sampleRows = [
      `runnersworld.com,https://runnersworld.com/gear/best-athletic-shorts,89,"ChatGPT, Claude",Verified,2026-08-28`,
      `nytimes.com,https://nytimes.com/wirecutter/reviews/best-yoga-pants,94,"Perplexity, Google AI",Verified,2026-08-29`,
      `gearpatrol.com,https://gearpatrol.com/fitness/workout-gear-roundup,82,"ChatGPT, Gemini",Verified,2026-08-30`,
      `wellandgood.com,https://wellandgood.com/fitness-apparel-guide,78,Perplexity,Verified,2026-09-01`,
    ].join('\n');
    triggerDownload(`beacon-citations-${project.domain}.csv`, csvHeader + sampleRows, 'text/csv;charset=utf-8;');
  };

  const handleExportBrandKitJson = () => {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      workspace: {
        id: project.id,
        name: project.name,
        domain: project.domain,
        tier: project.tier,
      },
      brandKit: project.brand_kit,
    };
    triggerDownload(
      `beacon-brand-kit-${project.domain}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8;'
    );
  };

  const handleDeleteWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmDomainInput.trim().toLowerCase() !== project.domain.trim().toLowerCase()) {
      toast.error(`Please type '${project.domain}' exactly to confirm.`);
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteWorkspaceAction(confirmDomainInput);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success('Workspace and all associated data permanently deleted.');
          window.location.href = '/login';
        }
      } catch {
        toast.error('Failed to complete workspace deletion.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. DATA EXPORT SUITE */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-700" />
            <CardTitle className="text-base font-bold text-slate-950 font-sans">
              Export Your Data
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-600 font-sans">
            Download your search history, citing websites, and brand guidelines in standard CSV and JSON spreadsheet files.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Search History */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-sans">Search History</h4>
                <p className="text-xs text-slate-500 font-sans">
                  Full list of tracked search queries, AI recommendation scores, and tone.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportTelemetryCsv}
                className="w-full text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>

            {/* Export Citations */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-sans">Websites Citing Your Brand</h4>
                <p className="text-xs text-slate-500 font-sans">
                  All websites, articles, and reviews AI platforms use when recommending your brand.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCitationsCsv}
                className="w-full text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>

            {/* Export Brand Kit */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="h-9 w-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-800">
                  <FileCode className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-sans">Brand Profile &amp; Guidelines</h4>
                <p className="text-xs text-slate-500 font-sans">
                  File containing your products, key selling points, excluded terms, and brand voice guidelines.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportBrandKitJson}
                className="w-full text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. DATA RETENTION & PRIVACY POLICY CARD */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-700" />
          <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900">
            Privacy Guarantee: Never Used for AI Training
          </h4>
        </div>
        <p className="text-xs text-slate-600 font-sans leading-relaxed">
          Beacon protects your business data. Your product details, selling points, and competitors are <strong>never used to train public AI models</strong> (OpenAI, Anthropic, or Google).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>SOC2 Type II Certified</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>GDPR &amp; CCPA Compliant</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Private &amp; Isolated Data</span>
          </div>
        </div>
      </Card>

      {/* 3. DANGER ZONE: ACCOUNT DELETION */}
      <Card className="border-rose-200 bg-rose-50/30 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-rose-100 bg-rose-50/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-rose-950 font-sans flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-700" />
                Danger Zone: Delete Workspace
              </CardTitle>
              <CardDescription className="text-xs text-rose-700 font-sans">
                Permanently delete this workspace, including all search history, tracked competitors, and citing websites.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-rose-300 bg-rose-100 text-rose-900 text-[10px] font-mono">
              Irreversible Action
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-950">
              Delete workspace for {project.name} ({project.domain})
            </span>
            <p className="text-xs text-rose-700/80 font-sans">
              All team access will be revoked immediately and active subscriptions will be terminated.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Workspace
          </Button>
        </CardContent>
      </Card>

      {/* DELETION CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold font-sans">Confirm Workspace Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDeleteWorkspace} className="p-5 space-y-4">
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                This will permanently delete the <strong>{project.name}</strong> workspace and remove all associated search history, tracked queries, and citing websites. This action <strong>cannot be undone</strong>.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <Label htmlFor="confirm-domain" className="text-xs font-semibold text-slate-700">
                  To verify, type <span className="font-mono text-rose-700 select-all font-bold">{project.domain}</span> below:
                </Label>
                <Input
                  id="confirm-domain"
                  placeholder={project.domain}
                  value={confirmDomainInput}
                  onChange={(e) => setConfirmDomainInput(e.target.value)}
                  className="border-slate-200 text-sm font-mono"
                  autoFocus
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModalOpen(false)}
                  className="text-xs border-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isPending || confirmDomainInput.trim().toLowerCase() !== project.domain.trim().toLowerCase()}
                  className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Purging Data...
                    </>
                  ) : (
                    'Permanently Delete'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
