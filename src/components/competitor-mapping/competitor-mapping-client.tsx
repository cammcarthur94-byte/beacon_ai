'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  TrendingUp,
  Target,
  RefreshCw,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Filter,
  Layers,
  Award,
  CircleAlert,
  ArrowUpRight,
  Bot,
  Copy,
  Send,
  MessageSquare,
  FileCode,
} from 'lucide-react';
import { DomainFavicon } from '@/components/citations/domain-favicon';
import { cn } from '@/lib/utils';
import type {
  CompetitorFeatureItem,
  CompetitorMappingData,
} from '@/app/api/competitor-mapping/route';

interface ChatMessage {
  sender: 'sentinel' | 'user';
  text: string;
  code?: string;
  timestamp?: string;
}

export function CompetitorMappingClient() {
  const [data, setData] = useState<CompetitorMappingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('42 mins ago');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [insightsExpanded, setInsightsExpanded] = useState(true);

  // Sentinel Drawer Chatbot state
  const [activeDrawerFeature, setActiveDrawerFeature] = useState<CompetitorFeatureItem | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/competitor-mapping');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load competitor mapping data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, drawerLoading]);

  const handleRunCrawl = async () => {
    setCrawling(true);
    try {
      const res = await fetch('/api/competitor-mapping', { method: 'POST' });
      if (res.ok) {
        setLastSyncText('Just now');
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to run crawl sync:', err);
    } finally {
      setCrawling(false);
    }
  };

  // Open Sentinel Drawer for a given feature
  const handleOpenBridgeGap = (feat: CompetitorFeatureItem) => {
    setActiveDrawerFeature(feat);
    setDrawerLoading(true);
    setCopiedCode(false);
    setUserInput('');

    const topComp = feat.competitors.find((c) => c.citationShare > 0) || feat.competitors[0];
    const brandName = data?.brandName || 'Lululemon';

    setTimeout(() => {
      setDrawerLoading(false);
      setChatMessages([
        {
          sender: 'sentinel',
          text: `I've analyzed how competitors compare for "${feat.featureName}" in ${feat.category}.

**Current Recommendation Rate**:
• ${topComp?.name || 'Competitors'}: **${topComp?.citationShare || 45}% recommendation share** in AI answers
• ${brandName}: **${feat.brandCitationShare}% recommendation share**
• Standing: **${feat.brandStatus.toUpperCase()}**

**3-Step Action Plan to Win More AI Recommendations**:
1. **Website Product Info**: Add clear durability specifications and details to your product pages.
2. **Comparison Content**: Publish an objective specification breakdown contrasting ${brandName} against ${topComp?.name || 'competitor'} materials.
3. **Expert Reviews**: Share product testing results with reviewers and buyer guides to get cited more often.`,
          code: `<!-- WEBSITE CODE FOR ${brandName.toUpperCase()} -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${brandName} ${feat.featureName}",
  "category": "${feat.category}",
  "description": "${feat.brandDetail}",
  "brand": {
    "@type": "Brand",
    "name": "${brandName}"
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Fabric Engineering",
      "value": "Proprietary Anti-Pill Interlock 100-Wash Certified"
    },
    {
      "@type": "PropertyValue",
      "name": "Competitive Differentiation",
      "value": "Outperforms ${topComp?.name || 'competitors'} in multi-planar stretch retention and durability"
    }
  ]
}
</script>`,
        },
      ]);
    }, 450);
  };

  // Send interactive chat message
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || userInput;
    if (!text.trim() || !activeDrawerFeature) return;

    const newMsgs: ChatMessage[] = [...chatMessages, { sender: 'user', text }];
    setChatMessages(newMsgs);
    setUserInput('');
    setDrawerLoading(true);

    const brandName = data?.brandName || 'Lululemon';
    const topComp =
      activeDrawerFeature.competitors.find((c) => c.citationShare > 0) ||
      activeDrawerFeature.competitors[0];

    setTimeout(() => {
      setDrawerLoading(false);
      let reply = '';
      let codeSnippet: string | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('schema') || lower.includes('json') || lower.includes('code')) {
        reply = `Here is the ready-to-use FAQ website code to help AI platforms understand your product advantages:`;
        codeSnippet = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does ${brandName} ${activeDrawerFeature.featureName} compare to ${topComp?.name}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${brandName}'s proprietary ${activeDrawerFeature.featureName} features four-way interlock knit with lab-verified zero pilling over 100 industrial wash cycles, whereas ${topComp?.name} utilizes standard poly-elastane blends."
      }
    }
  ]
}
</script>`;
      } else if (lower.includes('copy') || lower.includes('page') || lower.includes('landing')) {
        reply = `### Draft Comparison Web Section
**Headline**: Engineered for Longevity: ${brandName} vs. ${topComp?.name}

* **Tensile Recovery**: 99.4% shape retention after 24h continuous wear tests.
* **Seam Construction**: Flatlock ergonomic stitching designed for zero friction under load.
* **Alterations & Warranty**: Complimentary lifetime in-store hemming on any style.

*Recommendation*: Place this section on your main product page so AI tools see and recommend your product advantages.`;
      } else if (lower.includes('pitch') || lower.includes('pr') || lower.includes('editor')) {
        reply = `### Targeted Editorial PR Hook
**Subject**: Review Sample Offer: 2026 Wear Test Data for ${activeDrawerFeature.featureName}

*Hi Editorial Team,*

I saw your recent roundup reviewing activewear performance and noticed ${topComp?.name} was highlighted. 

We just concluded an independent laboratory wear test comparing ${brandName} with category alternatives across 100 wash cycles. Would you be open to review samples for your team to evaluate firsthand in your upcoming guides?`;
      } else {
        reply = `I've analyzed that angle for ${activeDrawerFeature.featureName}. To help AI tools recommend you more often, add clear comparison details and FAQ sections to your website.`;
      }

      setChatMessages([
        ...newMsgs,
        {
          sender: 'sentinel',
          text: reply,
          code: codeSnippet,
        },
      ]);
    }, 600);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Categories list
  const categories = useMemo(() => {
    if (!data?.features) return [];
    return Array.from(new Set(data.features.map((f) => f.category)));
  }, [data?.features]);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    if (!data?.features) return [];
    return data.features.filter((f) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.featureName.toLowerCase().includes(q);
        const matchesDesc = f.description.toLowerCase().includes(q);
        const matchesCat = f.category.toLowerCase().includes(q);
        const matchesBrand = f.brandDetail.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesBrand) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && f.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && f.brandStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [data?.features, searchQuery, selectedCategory, selectedStatus]);

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* ── 1. STREAMLINED PAGE HEADER & PRIMARY ACTION ──────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              PRODUCT INTELLIGENCE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Competitor Product &amp; Feature Comparison
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Monitor rival product catalogs, feature claims, and pricing tiers to see where AI models favor competing brands over yours.
          </p>
        </div>

        {/* Consolidated action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/consultant">
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
              Content Studio
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleRunCrawl}
            disabled={crawling}
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5 text-white', crawling && 'animate-spin')} />
            {crawling ? 'Updating Competitor Data...' : 'Refresh Competitor Data'}
          </Button>
        </div>
      </div>

      {/* ── 2. KPI OVERVIEW CARDS ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tracked Competitors */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Tracked Competitors
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data?.summary.trackedCompetitorsCount ?? 3}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Key Rivals
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 truncate">
              {data?.competitors?.map((c) => c.name).join(' • ') || 'Alo Yoga • Vuori • Athleta'}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Parity Score */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Competitive Match Score
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data?.summary.overallParityScore ?? 78}%
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Strong Foundation
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Core athletic performance specs lead peer group
            </p>
          </CardContent>
        </Card>

        {/* Card 3: High Risk Gaps */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Missing Product Features
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-amber-600">
                {data?.summary.highRiskGapsCount ?? 2}
              </span>
              <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Needs Attention
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Areas where competitors get recommended more often
            </p>
          </CardContent>
        </Card>

        {/* Card 4: AI Citation Disparity */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Recommendation Advantage
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-purple-700">
                {data?.summary.aiCitationDisparity || '+14% Advantage'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Last updated: {lastSyncText}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. COLLAPSIBLE "ACTIONABLE INSIGHTS" PANEL ───────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden transition-all">
        <div
          onClick={() => setInsightsExpanded(!insightsExpanded)}
          className="p-4 bg-gradient-to-r from-emerald-50/40 via-white to-slate-50/40 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Key Recommendations &amp; Opportunities
                </h2>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                  {data?.recommendations?.length || 3} Recommendations
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Top opportunities to improve your brand&apos;s recommendations compared to competitors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              {insightsExpanded ? 'Collapse' : 'Expand Insights'}
            </span>
            <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
              {insightsExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>

        {insightsExpanded && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/30">
            {data?.recommendations?.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {rec.category}
                    </span>
                    <Badge
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5',
                        rec.impact === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {rec.impact} Priority
                    </Badge>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{rec.title}</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                    {rec.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const matchingFeat =
                        data?.features?.find((f) => f.category === rec.category) ||
                        data?.features?.[0];
                      if (matchingFeat) handleOpenBridgeGap(matchingFeat);
                    }}
                    className="w-full text-xs font-semibold h-7.5 text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all justify-between px-2.5 cursor-pointer"
                  >
                    <span className="truncate">{rec.actionLabel}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. UNIFIED FILTER BAR & SEARCH TOOLBAR ───────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search features, specifications, fabrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8.5 text-xs bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Parity Dropdown & Clear Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8.5 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-sans',
                    selectedStatus !== 'all' && 'border-emerald-500 text-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-500 font-semibold'
                  )}
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  {selectedStatus === 'all'
                    ? 'All Standings'
                    : `Status: ${selectedStatus.toUpperCase()}`}
                  <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs font-sans">
                <DropdownMenuLabel>Filter by Standing</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                  All Standings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('leader')}
                  className="font-semibold text-emerald-700"
                >
                  Leader (Market Leading)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('parity')}
                  className="font-semibold text-blue-700"
                >
                  Even (Matching Competitors)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('gap')}
                  className="font-semibold text-amber-700"
                >
                  Behind (Competitors Ahead)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedStatus('missing')}
                  className="font-semibold text-rose-700"
                >
                  Missing (Not Found by AI)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8.5 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium cursor-pointer"
              >
                <X className="h-3 w-3 mr-1" />
                Clear filters ({activeFiltersCount})
              </Button>
            )}

            <span className="text-xs text-slate-400 pl-1">
              ({filteredFeatures.length} matching)
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center shrink-0">
            <Layers className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Category:
          </span>

          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full transition-all border shrink-0 cursor-pointer',
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            )}
          >
            All Categories ({data?.features?.length || 0})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full transition-all border shrink-0 cursor-pointer',
                  isSelected
                    ? 'bg-purple-50 text-purple-800 border-purple-600 ring-1 ring-purple-600 font-semibold shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. FEATURE COMPARISON MATRIX TABLE ──────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Competitor Comparison Table ({filteredFeatures.length} Tracked Features)
            </h3>
            <p className="text-xs text-slate-500">
              Comparing your products and claims against rivals across major AI platforms
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Green bars show where your brand is recommended more often by AI
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[240px] text-xs font-semibold text-slate-600 py-3.5 pl-6">
                  Feature or Product Spec
                </TableHead>
                <TableHead className="w-[110px] text-xs font-semibold text-slate-600 text-center">
                  Standing
                </TableHead>
                <TableHead className="w-[260px] text-xs font-semibold text-slate-600">
                  {data?.brandName || 'Our Brand'} Details
                </TableHead>
                <TableHead className="min-w-[340px] text-xs font-semibold text-slate-600">
                  Competitor Comparison
                </TableHead>
                <TableHead className="w-[160px] text-xs font-semibold text-slate-600 text-center">
                  AI Recommendation Rate
                </TableHead>
                <TableHead className="w-[130px] text-xs font-semibold text-slate-600 text-right pr-6">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
                      <span>Evaluating competitor product catalogues and citation shares...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredFeatures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Target className="h-8 w-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">No matching features found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="mt-2 text-xs border-slate-200"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeatures.map((feat) => {
                  return (
                    <TableRow
                      key={feat.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Feature & Category */}
                      <TableCell className="pl-6 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {feat.category}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {feat.featureName}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-2">
                            {feat.description}
                          </span>
                        </div>
                      </TableCell>

                      {/* Parity Status */}
                      <TableCell className="text-center py-4 align-top">
                        {feat.brandStatus === 'leader' && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
                            Leader
                          </Badge>
                        )}
                        {feat.brandStatus === 'parity' && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold">
                            Parity
                          </Badge>
                        )}
                        {feat.brandStatus === 'gap' && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold">
                            Gap
                          </Badge>
                        )}
                        {feat.brandStatus === 'missing' && (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-semibold">
                            Missing
                          </Badge>
                        )}
                      </TableCell>

                      {/* Our Brand Detail */}
                      <TableCell className="py-4 align-top">
                        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                          {feat.brandDetail}
                        </p>
                      </TableCell>

                      {/* Competitor Coverage with Micro-Progress Bar beneath */}
                      <TableCell className="py-4 align-top">
                        <div className="space-y-2">
                          {feat.competitors.map((comp) => (
                            <div
                              key={comp.name}
                              className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/70 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs text-slate-800 shrink-0">
                                  {comp.name}
                                </span>
                                <span className="text-[10px] font-mono font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                  {comp.citationShare}% share
                                </span>
                              </div>

                              <p
                                className={cn(
                                  'text-[11px] leading-relaxed',
                                  comp.hasFeature ? 'text-slate-600' : 'text-slate-400 italic'
                                )}
                              >
                                {comp.detail}
                              </p>

                              {/* Dedicated mini horizontal progress bar directly beneath the competitor text */}
                              <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    comp.citationShare >= 45
                                      ? 'bg-amber-500'
                                      : comp.citationShare >= 25
                                      ? 'bg-indigo-500'
                                      : comp.citationShare > 0
                                      ? 'bg-slate-400'
                                      : 'bg-transparent'
                                  )}
                                  style={{ width: `${comp.citationShare}%` }}
                                  title={`${comp.name} Recommendation Share: ${comp.citationShare}%`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      {/* AI Citation Share Bar */}
                      <TableCell className="text-center py-4 align-top">
                        <div className="flex flex-col items-center gap-1.5 pt-1">
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                            <span className="text-emerald-700">{feat.brandCitationShare}%</span>
                            <span className="text-slate-400 text-[10px]">vs rivals</span>
                          </div>

                          {/* Multi-segment Share bar */}
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${feat.brandCitationShare}%` }}
                              title={`${data?.brandName || 'Our Brand'}: ${feat.brandCitationShare}%`}
                            />
                            <div
                              className="h-full bg-amber-400"
                              style={{ width: `${100 - feat.brandCitationShare}%` }}
                              title={`Competitors: ${100 - feat.brandCitationShare}%`}
                            />
                          </div>

                          <span className="text-[10px] text-slate-400">
                            Impact: {feat.aiImpactScore}/100
                          </span>
                        </div>
                      </TableCell>

                      {/* Action - Opens Beacon Sentinel Drawer */}
                      <TableCell className="text-right pr-6 py-4 align-top">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenBridgeGap(feat)}
                          className="h-8 px-2.5 text-xs text-purple-700 border-purple-200 bg-purple-50/50 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all font-medium cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Bridge Gap
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── 6. SLIDE-OUT BEACON SENTINEL PARITY REMEDIATION DRAWER ── */}
      {activeDrawerFeature && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveDrawerFeature(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-md bg-emerald-600 flex items-center justify-center text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Competitor Gap Action Plan
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  AI Assistant helping you improve your product claims and visibility for{' '}
                  <span className="font-semibold text-slate-800">
                    &ldquo;{activeDrawerFeature.featureName}&rdquo;
                  </span>
                </p>
              </div>

              <button
                onClick={() => setActiveDrawerFeature(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Feature Metadata Summary Card */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Category &amp; Standing</span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 bg-white">
                    {activeDrawerFeature.category}
                  </Badge>
                  <Badge
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 uppercase',
                      activeDrawerFeature.brandStatus === 'leader'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : activeDrawerFeature.brandStatus === 'gap'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : activeDrawerFeature.brandStatus === 'parity'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                  >
                    {activeDrawerFeature.brandStatus}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">AI Recommendation Rate</span>
                <span className="font-bold text-slate-900">
                  <span className="text-emerald-700">{activeDrawerFeature.brandCitationShare}%</span> vs{' '}
                  <span className="text-amber-700">
                    {activeDrawerFeature.competitors.find((c) => c.citationShare > 0)?.citationShare || 45}%{' '}
                    ({activeDrawerFeature.competitors.find((c) => c.citationShare > 0)?.name || 'Competitors'})
                  </span>
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-slate-400 block text-[11px] mb-0.5">Your Current Details:</span>
                <p className="text-slate-800 font-medium leading-relaxed bg-white p-2 rounded border border-slate-200/60">
                  {activeDrawerFeature.brandDetail}
                </p>
              </div>
            </div>

            {/* Chatbot Message Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex gap-2.5 max-w-[92%]',
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  )}
                >
                  {msg.sender === 'sentinel' && (
                    <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'p-3.5 rounded-xl text-xs leading-relaxed space-y-2.5',
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                    )}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                    {msg.code && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                            <FileCode className="h-3 w-3" />
                            Website Code / Schema Markup
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(msg.code!)}
                            className="h-6 text-[10px] text-slate-500 hover:text-emerald-700 px-1.5"
                          >
                            {copiedCode ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            {copiedCode ? 'Copied!' : 'Copy Code'}
                          </Button>
                        </div>
                        <pre className="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-normal">
                          {msg.code}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {drawerLoading && (
                <div className="flex gap-2.5 items-center text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 w-fit">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                  <span>Analyzing competitors and generating recommendations...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Presets */}
            <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick Ask:</span>
              <button
                type="button"
                onClick={() => handleSendMessage('Generate FAQ website code')}
                className="text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md shrink-0 transition-colors cursor-pointer"
              >
                + FAQ Code
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Draft comparison web page copy')}
                className="text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md shrink-0 transition-colors cursor-pointer"
              >
                + Comparison Copy
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Draft an editorial PR pitch for gear review desks')}
                className="text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md shrink-0 transition-colors cursor-pointer"
              >
                + Editorial PR Pitch
              </button>
            </div>

            {/* Chat Input Bar */}
            <div className="p-3.5 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  type="text"
                  placeholder="Ask to draft comparison copy, website code, or PR pitch..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="h-9 text-xs bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white font-sans"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!userInput.trim() || drawerLoading}
                  className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shrink-0 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDrawerFeature(null)}
                className="text-xs border-slate-200 text-slate-600 cursor-pointer"
              >
                Close
              </Button>

              <Link
                href={`/consultant?q=${encodeURIComponent(
                  `Sentinel, analyze how we compare for "${activeDrawerFeature.featureName}" (${activeDrawerFeature.category}). Currently competitors hold ${activeDrawerFeature.competitors[0]?.citationShare || 40}% recommendation share vs our ${activeDrawerFeature.brandCitationShare}%. Provide an action plan to win more AI recommendations.`
                )}`}
              >
                <Button
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Continue in AI Co-Worker
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
