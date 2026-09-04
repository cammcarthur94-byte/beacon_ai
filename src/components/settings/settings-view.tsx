'use client';

import * as React from 'react';
import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  updateProjectSettings,
  updateWorkspaceBrandingAndLocalizationAction,
} from '@/app/settings/actions';
import {
  Building,
  Sliders,
  Sparkles,
  Loader2,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Globe,
  Clock,
  Users,
  CreditCard,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { TeamManagementTab } from './team-management-tab';
import { BillingTab } from './billing-tab';
import { ComplianceTab } from './compliance-tab';
import type { BrandKit } from '@/types/database.types';

interface SettingsViewProps {
  project: {
    id: string;
    name: string;
    domain: string;
    tier: 'starter' | 'pro' | 'growth' | 'enterprise';
    audit_limit: number;
    brand_kit: BrandKit;
    workspace_settings?: {
      logoUrl?: string;
      faviconUrl?: string;
      timezone?: string;
      language?: string;
      dateFormat?: string;
      ssoEnabled?: boolean;
    };
  };
  activeAuditsCount: number;
  initialTab?: string;
}

const VALID_TABS = ['general', 'team', 'billing', 'compliance'];

export function SettingsView({ project, activeAuditsCount, initialTab }: SettingsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (urlTab && VALID_TABS.includes(urlTab)) return urlTab;
    if (initialTab && VALID_TABS.includes(initialTab)) return initialTab;
    return 'general';
  });

  const [isPending, startTransition] = useTransition();

  // 1. Workspace Identifiers
  const [brandName, setBrandName] = useState(project.name || '');
  const [domain, setDomain] = useState(project.domain || '');
  const [dropThreshold, setDropThreshold] = useState(15);

  // 2. White-Label Branding Assets (Logo & Favicon)
  const [logoUrl, setLogoUrl] = useState(project.workspace_settings?.logoUrl || '');
  const [faviconUrl, setFaviconUrl] = useState(project.workspace_settings?.faviconUrl || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(project.workspace_settings?.logoUrl || null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(project.workspace_settings?.faviconUrl || null);

  // 3. Timezone & Localization
  const [timezone, setTimezone] = useState(project.workspace_settings?.timezone || 'America/New_York');
  const [language, setLanguage] = useState(project.workspace_settings?.language || 'en-US');
  const [dateFormat, setDateFormat] = useState(project.workspace_settings?.dateFormat || 'MM/DD/YYYY');

  // Handle Tab Switch & URL Query Sync
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.replace(`/settings?tab=${value}`, { scroll: false });
  };

  useEffect(() => {
    if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // File Upload Handlers for Logo & Favicon
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setLogoUrl(base64);
        toast.success('Logo uploaded for white-labeled reports.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Favicon must be under 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFaviconPreview(base64);
        setFaviconUrl(base64);
        toast.success('Favicon uploaded.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('brandName', brandName);
        formData.append('domain', domain);
        formData.append('logoUrl', logoUrl);
        formData.append('faviconUrl', faviconUrl);
        formData.append('timezone', timezone);
        formData.append('language', language);
        formData.append('dateFormat', dateFormat);

        const res1 = await updateProjectSettings(formData);
        await updateWorkspaceBrandingAndLocalizationAction(formData);

        if (res1?.error) {
          toast.error(res1.error);
        } else {
          toast.success('Workspace configuration & localization saved successfully!');
        }
      } catch {
        toast.error('Failed to update workspace settings.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-slate-100/90 p-1 border border-slate-200/80 rounded-xl flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="general"
            className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xs rounded-lg px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <Building className="h-3.5 w-3.5 text-slate-500" />
            General &amp; Workspace
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xs rounded-lg px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="h-3.5 w-3.5 text-slate-500" />
            Team &amp; Access
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xs rounded-lg px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="h-3.5 w-3.5 text-slate-500" />
            Billing &amp; Subscriptions
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xs rounded-lg px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            Data &amp; Compliance
          </TabsTrigger>
        </TabsList>

        {/* 1. GENERAL TAB */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            {/* WORKSPACE IDENTIFIERS CARD */}
            <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-950 font-sans">
                  Workspace Identifiers
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 font-sans">
                  Core metadata associated with this tenant&apos;s AI tracking scope and reporting alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="brand-name" className="text-xs font-semibold text-slate-700">
                      Brand Name
                    </Label>
                    <Input
                      id="brand-name"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="border-slate-200 focus-visible:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="proj-domain" className="text-xs font-semibold text-slate-700">
                      Primary Domain
                    </Label>
                    <Input
                      id="proj-domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="border-slate-200 focus-visible:ring-emerald-500 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between max-w-sm">
                    <Label htmlFor="alert-threshold" className="text-xs font-semibold text-slate-700">
                      Proactive Alert Drop Threshold (%)
                    </Label>
                    <span className="text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      -{dropThreshold}%
                    </span>
                  </div>
                  <Input
                    id="alert-threshold"
                    type="number"
                    min={5}
                    max={50}
                    value={dropThreshold}
                    onChange={(e) => setDropThreshold(Number(e.target.value))}
                    className="max-w-[180px] border-slate-200 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* WHITE-LABEL BRANDING & REPORT ASSETS */}
            <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-700" />
                  <CardTitle className="text-base font-bold text-slate-950 font-sans">
                    White-Labeling &amp; Brand Assets
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-600 font-sans">
                  Upload corporate logos and favicons displayed across executive audit reports and PDF export headers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Brand Logo Upload Dropzone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Brand Logo (Header &amp; Reports)</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
                      {logoPreview ? (
                        <div className="space-y-2 flex flex-col items-center">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-12 max-w-[180px] object-contain rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setLogoPreview(null);
                              setLogoUrl('');
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-700 cursor-pointer font-medium"
                          >
                            Remove Logo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 flex flex-col items-center">
                          <Upload className="h-6 w-6 text-slate-400" />
                          <div className="text-xs font-medium text-slate-700">
                            Drop logo here, or <span className="text-emerald-700 underline">browse</span>
                          </div>
                          <span className="text-[10px] text-slate-400">PNG, SVG up to 2MB</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/jpeg"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        title="Upload logo"
                      />
                    </div>
                    <div className="pt-1">
                      <Input
                        placeholder="Or paste direct image URL (https://...)"
                        value={logoUrl.startsWith('data:') ? '' : logoUrl}
                        onChange={(e) => {
                          setLogoUrl(e.target.value);
                          setLogoPreview(e.target.value || null);
                        }}
                        className="border-slate-200 text-xs font-mono h-8"
                      />
                    </div>
                  </div>

                  {/* Favicon Upload Dropzone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Favicon / Browser Icon</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
                      {faviconPreview ? (
                        <div className="space-y-2 flex flex-col items-center">
                          <img
                            src={faviconPreview}
                            alt="Favicon preview"
                            className="h-8 w-8 object-contain rounded-md shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFaviconPreview(null);
                              setFaviconUrl('');
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-700 cursor-pointer font-medium"
                          >
                            Remove Favicon
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 flex flex-col items-center">
                          <Upload className="h-6 w-6 text-slate-400" />
                          <div className="text-xs font-medium text-slate-700">
                            Drop favicon here, or <span className="text-emerald-700 underline">browse</span>
                          </div>
                          <span className="text-[10px] text-slate-400">ICO, PNG up to 1MB</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/x-icon,image/png"
                        onChange={handleFaviconUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        title="Upload favicon"
                      />
                    </div>
                    <div className="pt-1">
                      <Input
                        placeholder="Or paste direct favicon URL (https://...)"
                        value={faviconUrl.startsWith('data:') ? '' : faviconUrl}
                        onChange={(e) => {
                          setFaviconUrl(e.target.value);
                          setFaviconPreview(e.target.value || null);
                        }}
                        className="border-slate-200 text-xs font-mono h-8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TIMEZONE & LOCALIZATION */}
            <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-700" />
                  <CardTitle className="text-base font-bold text-slate-950 font-sans">
                    Timezone &amp; Localization Preferences
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-600 font-sans">
                  Calibrate data aggregation intervals, reporting timestamps, and localized formatting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-500" /> Default Timezone
                    </Label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="America/New_York">America/New_York (EST/EDT)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                      <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-slate-500" /> Reporting Language
                    </Label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="en-US">English (United States)</option>
                      <option value="en-GB">English (United Kingdom)</option>
                      <option value="es-ES">Spanish (Español)</option>
                      <option value="fr-FR">French (Français)</option>
                      <option value="de-DE">German (Deutsch)</option>
                      <option value="ja-JP">Japanese (日本語)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Date Format</Label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/04/2026)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 04/09/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <span className="text-xs text-slate-500">
                  Settings apply across all team member views and automated PDF reports.
                </span>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-4 py-2 shadow-xs cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    'Save Workspace Settings'
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* BRAND KIT REDIRECT CALLOUT BANNER */}
            <Card className="border-slate-200 bg-gradient-to-br from-slate-50/70 via-white to-emerald-50/30 shadow-xs rounded-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Dedicated Calibration Studio
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-500 font-medium">Model Grounding</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2 font-sans">
                      <Sliders className="h-5 w-5 text-emerald-600" />
                      Brand Kit &amp; AI Grounding
                    </h3>
                    <p className="text-xs text-slate-600 max-w-xl font-sans leading-relaxed">
                      Configure industry taxonomy, core messaging pillars, regional search intent, negative exclusions, and 4-axis tone sliders injected into all AI models.
                    </p>
                  </div>
                  <Link href="/brand-kit" className="shrink-0">
                    <Button
                      type="button"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-5 py-2.5 shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      Calibrate Brand Kit AI Context
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* 2. TEAM & ACCESS TAB */}
        <TabsContent value="team" className="mt-6">
          <TeamManagementTab project={project} />
        </TabsContent>

        {/* 3. BILLING & SUBSCRIPTIONS TAB */}
        <TabsContent value="billing" className="mt-6">
          <BillingTab project={project} activeAuditsCount={activeAuditsCount} />
        </TabsContent>

        {/* 5. DATA PRIVACY & COMPLIANCE TAB */}
        <TabsContent value="compliance" className="mt-6">
          <ComplianceTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
