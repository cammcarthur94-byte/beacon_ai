'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { signOut } from '@/app/login/actions';
import { switchActiveWorkspace } from '@/actions/switch-workspace';
import { BrandAvatar } from '@/components/citations/domain-favicon';
import {
  Home,
  Star,
  MessageSquare,
  Search,
  Share2,
  PencilLine,
  TrendingUp,
  Sliders,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Check,
  Plus,
  Building2,
  ExternalLink,
  ArrowRight,
  Radio,
} from 'lucide-react';
import type { TeamMemberRole, RolePermissionsConfig } from '@/types/database.types';
import { getRoleBadgeColor, hasPermission } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AppSidebarLayoutProps {
  project: {
    id: string;
    name: string;
    domain: string;
    tier?: string;
    role_permissions?: RolePermissionsConfig;
  };
  children: React.ReactNode;
}

interface SubItem {
  title: string;
  href: string;
  queryParam?: { key: string; value: string };
}

interface NavParentItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  subItems?: SubItem[];
}

const REPORT_ITEMS: NavParentItem[] = [
  {
    title: 'Brand insights',
    href: '/brand-insights',
    icon: Star,
    subItems: [
      { title: 'Overview', href: '/brand-insights?metric=overview', queryParam: { key: 'metric', value: 'overview' } },
      { title: 'Mentions', href: '/brand-insights?metric=mentions', queryParam: { key: 'metric', value: 'mentions' } },
      { title: 'Position', href: '/brand-insights?metric=position', queryParam: { key: 'metric', value: 'position' } },
      { title: 'Share of voice', href: '/brand-insights?metric=sov', queryParam: { key: 'metric', value: 'sov' } },
      { title: 'Visibility score', href: '/brand-insights?metric=visibility', queryParam: { key: 'metric', value: 'visibility' } },
      { title: 'Sentiment', href: '/brand-insights?metric=sentiment', queryParam: { key: 'metric', value: 'sentiment' } },
    ],
  },
  {
    title: 'Prompt analysis',
    href: '/prompt-analysis',
    icon: MessageSquare,
    subItems: [
      { title: 'Overview', href: '/prompt-analysis', queryParam: { key: 'metric', value: 'overview' } },
      { title: 'Visibility', href: '/prompt-analysis?metric=visibility', queryParam: { key: 'metric', value: 'visibility' } },
      { title: 'Share of voice', href: '/prompt-analysis?metric=sov', queryParam: { key: 'metric', value: 'sov' } },
      { title: 'Position', href: '/prompt-analysis?metric=position', queryParam: { key: 'metric', value: 'position' } },
      { title: 'Sentiment', href: '/prompt-analysis?metric=sentiment', queryParam: { key: 'metric', value: 'sentiment' } },
      { title: 'Follow-up questions', href: '/prompt-analysis?metric=fanouts', queryParam: { key: 'metric', value: 'fanouts' } },
    ],
  },
  {
    title: 'Citations',
    href: '/citations',
    icon: Search,
    subItems: [
      { title: 'Overview', href: '/citations', queryParam: { key: 'view', value: 'overview' } },
      { title: 'All domains', href: '/citations?view=domains', queryParam: { key: 'view', value: 'domains' } },
    ],
  },
  {
    title: 'AI model insights',
    href: '/ai-models',
    icon: Share2,
    subItems: [
      { title: 'Overview', href: '/ai-models', queryParam: { key: 'metric', value: 'overview' } },
    ],
  },
];

const TOOL_ITEMS: NavParentItem[] = [
  {
    title: 'Prompt management',
    href: '/audits',
    icon: PencilLine,
  },
  {
    title: 'Growth Opportunities',
    href: '/authority-gap',
    icon: TrendingUp,
  },
];

function SidebarNavigation({
  project,
  onNavigate,
}: {
  project: AppSidebarLayoutProps['project'];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Automatically expand the section matching current pathname
    const initial: Record<string, boolean> = {};
    REPORT_ITEMS.forEach((item) => {
      if (item.subItems && item.href && pathname.startsWith(item.href)) {
        initial[item.title] = true;
      }
    });
    return initial;
  });

  // Keep active section expanded when route changes
  useEffect(() => {
    REPORT_ITEMS.forEach((item) => {
      if (item.subItems && item.href && pathname.startsWith(item.href)) {
        setExpandedSections((prev) => ({ ...prev, [item.title]: true }));
      }
    });
  }, [pathname]);

  const toggleSection = (title: string, defaultHref?: string) => {
    const isCurrentlyExpanded = !!expandedSections[title];
    // If we are expanding and there's a defaultHref and we aren't there, navigate.
    // Keep router.push outside the state updater: updaters must be pure because
    // React may invoke them during render.
    if (!isCurrentlyExpanded && defaultHref && !pathname.startsWith(defaultHref)) {
      router.push(defaultHref);
    }
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isSubItemActive = (sub: SubItem, parentHref: string) => {
    if (!pathname.startsWith(parentHref)) return false;
    if (!sub.queryParam) {
      // It's the overview/default when no query param or param equals overview
      const val = searchParams.get('metric') || searchParams.get('view');
      return !val || val === 'overview';
    }
    const currentVal = searchParams.get(sub.queryParam.key);
    return currentVal === sub.queryParam.value;
  };

  const renderNavParent = (item: NavParentItem) => {
    const Icon = item.icon;
    const isExpanded = !!expandedSections[item.title];
    const isParentPathActive = item.href ? pathname.startsWith(item.href) : false;

    // Single link with no children (e.g. Dashboard, Prompt Management)
    if (!item.subItems) {
      const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : isParentPathActive;
      return (
        <div key={item.title} className="mb-1">
          <Link
            href={item.href || '#'}
            onClick={onNavigate}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
              isActive
                ? 'bg-sky-50 text-sky-600 font-semibold'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-sky-600' : 'text-slate-500')} />
              <span>{item.title}</span>
            </div>
          </Link>
        </div>
      );
    }

    // Collapsible parent with sub-items
    return (
      <div key={item.title} className="mb-1">
        <button
          type="button"
          onClick={() => toggleSection(item.title, item.href)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer',
            isParentPathActive && !isExpanded
              ? 'bg-sky-50 text-sky-600 font-semibold'
              : isParentPathActive
              ? 'text-sky-600 font-semibold'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className={cn('h-4 w-4 shrink-0', isParentPathActive ? 'text-sky-600' : 'text-slate-500')} />
            <span>{item.title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200" />
          )}
        </button>

        {/* Sub-items list */}
        {isExpanded && (
          <div className="pl-6 pt-1 pb-1.5 space-y-1">
            {item.subItems.map((sub) => {
              const active = isSubItemActive(sub, item.href!);
              return (
                <Link
                  key={sub.title}
                  href={sub.href}
                  onClick={onNavigate}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-[12.5px] transition-all duration-150',
                    active
                      ? 'bg-sky-50 text-sky-600 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  )}
                >
                  {active ? (
                    <div className="h-3.5 w-3.5 rounded-full border border-sky-400 bg-sky-100 flex items-center justify-center shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                    </div>
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400 ml-1 mr-1 shrink-0" />
                  )}
                  <span>{sub.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* REPORTS SECTION */}
      <div>
        <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-500 px-3 block mb-1.5">
          Reports
        </span>
        <div className="space-y-0.5">{REPORT_ITEMS.map(renderNavParent)}</div>
      </div>

      {/* TOOLS SECTION */}
      <div>
        <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-500 px-3 block mb-1.5">
          Tools
        </span>
        <div className="space-y-0.5">{TOOL_ITEMS.map(renderNavParent)}</div>
      </div>

      {/* ADMIN / WORKSPACE SECTION */}
      <div>
        <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-500 px-3 block mb-1.5">
          Admin / Workspace
        </span>
        <div className="space-y-0.5">
          <Link
            href="/brand-kit"
            onClick={onNavigate}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
              pathname.startsWith('/brand-kit')
                ? 'bg-sky-50 text-sky-600 font-semibold'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-3">
              <Sliders
                className={cn('h-4 w-4 shrink-0', pathname.startsWith('/brand-kit') ? 'text-sky-600' : 'text-slate-500')}
              />
              <span>Brand Profile</span>
            </div>
          </Link>

          <Link
            href="/settings"
            onClick={onNavigate}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
              pathname.startsWith('/settings')
                ? 'bg-sky-50 text-sky-600 font-semibold'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-3">
              <Settings
                className={cn('h-4 w-4 shrink-0', pathname.startsWith('/settings') ? 'text-sky-600' : 'text-slate-500')}
              />
              <span>Settings &amp; Billing</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function BrandSwitcher({
  project,
}: {
  project: AppSidebarLayoutProps['project'];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelectWorkspace = (workspaceId: string, name: string) => {
    setOpen(false);
    startTransition(async () => {
      await switchActiveWorkspace(workspaceId);
      toast.success(`Switched active workspace to ${name}`);
      router.refresh();
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Brand Card Button matching screenshot */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer select-none text-left',
          open && 'ring-2 ring-sky-500/20 border-sky-400'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <BrandAvatar name={project.name} domain={project.domain} size="lg" className="rounded-xl" />
          <div className="min-w-0">
            <span className="font-bold text-slate-900 text-sm tracking-tight truncate block leading-tight">
              {project.name}
            </span>
            <span className="text-[11px] text-slate-400 font-mono truncate block">
              {project.domain || 'beacon.io'}
            </span>
          </div>
        </div>

        <ChevronDown
          className={cn('h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150 space-y-1">
          <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Workspaces
          </div>

          {/* Current Workspace */}
          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50 text-slate-900 text-xs font-semibold">
            <div className="flex items-center gap-2.5 min-w-0">
              <BrandAvatar name={project.name} domain={project.domain} />
              <span className="truncate">{project.name} (Active)</span>
            </div>
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          </div>

          {/* Demo Workspaces */}
          <button
            type="button"
            disabled={isPending || project.id === 'project-gymshark-dtc'}
            onClick={() => handleSelectWorkspace('project-gymshark-dtc', 'Gymshark')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors text-left cursor-pointer',
              project.id === 'project-gymshark-dtc' && 'opacity-60 pointer-events-none'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BrandAvatar name="Gymshark" domain="gymshark.com" />
              <div className="min-w-0">
                <span className="block truncate font-semibold">Gymshark</span>
                <span className="block truncate text-[10px] text-slate-400">gymshark.com · DTC Demo</span>
              </div>
            </div>
            {project.id === 'project-gymshark-dtc' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
          </button>

          <button
            type="button"
            disabled={isPending || project.id === 'project-datadog-saas'}
            onClick={() => handleSelectWorkspace('project-datadog-saas', 'Datadog')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors text-left cursor-pointer',
              project.id === 'project-datadog-saas' && 'opacity-60 pointer-events-none'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BrandAvatar name="Datadog" domain="datadoghq.com" />
              <div className="min-w-0">
                <span className="block truncate font-semibold">Datadog</span>
                <span className="block truncate text-[10px] text-slate-400">datadoghq.com · SaaS Demo</span>
              </div>
            </div>
            {project.id === 'project-datadog-saas' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
          </button>

          <Separator className="my-1 bg-slate-100" />

          {/* Add Workspace */}
          <Link
            href="/onboarding"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-sky-600 hover:bg-sky-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Workspace</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export function AppSidebarLayout({ project, children }: AppSidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentUser, setCurrentUser] = useState<{
    email?: string;
    name?: string;
    role?: TeamMemberRole;
    assignedBrandId?: string;
  }>({
    role: 'owner',
    name: 'Cameron M.',
    email: 'cam@beaconmetrics.io',
  });

  useEffect(() => {
    try {
      const match = document.cookie.match(/beacon_active_user=([^;]+)/);
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[1]));
        if (parsed) setCurrentUser(parsed);
      }
    } catch {}
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const userRole = currentUser.role || 'owner';

  const searchableLinks = [
    { title: 'Brand Insights - Overview', href: '/brand-insights?metric=overview', icon: Star },
    { title: 'Brand Insights - Mentions', href: '/brand-insights?metric=mentions', icon: Star },
    { title: 'Brand Insights - Share of Voice', href: '/brand-insights?metric=sov', icon: Star },
    { title: 'Prompt Analysis - Overview', href: '/prompt-analysis?metric=overview', icon: MessageSquare },
    { title: 'Prompt Analysis - Visibility', href: '/prompt-analysis?metric=visibility', icon: MessageSquare },
    { title: 'Citations - Overview', href: '/citations', icon: Search },
    { title: 'Citations - All Domains', href: '/citations?view=domains', icon: Search },
    { title: 'AI Model Insights - Overview', href: '/ai-models', icon: Share2 },
    { title: 'Prompt Management (Audits)', href: '/audits', icon: PencilLine },
    { title: 'Growth Opportunities', href: '/authority-gap', icon: TrendingUp },
    { title: 'Brand Profile', href: '/brand-kit', icon: Sliders },
    { title: 'Settings & Billing', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col lg:flex-row selection:bg-sky-100 selection:text-sky-950 font-sans">
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-base">Beacon</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandOpen(true)}
            className="h-9 w-9 text-slate-700 hover:bg-slate-100"
            title="Search or jump to (Cmd+K)"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="text-[10px] font-mono border-slate-200 bg-slate-50 text-slate-700">
            {project.tier?.toUpperCase() || 'PRO'}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="h-9 w-9 text-slate-700 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-white border-r border-slate-200 p-4 flex flex-col justify-between shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
                    <Radio className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 tracking-tight text-base">
                    Beacon
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 text-slate-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Brand Switcher */}
              <BrandSwitcher project={project} />

              {/* Navigation Menu */}
              <React.Suspense fallback={<div className="h-40 animate-pulse bg-slate-100 rounded-xl" />}>
                <SidebarNavigation project={project} onNavigate={() => setMobileOpen(false)} />
              </React.Suspense>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3 mt-6">
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-slate-600 hover:text-slate-950 hover:bg-slate-100 text-xs border-slate-200"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP PERSISTENT LEFT SIDEBAR */}
      <aside className="hidden lg:flex w-68 shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white min-h-screen sticky top-0 h-screen p-4 pb-20 overflow-y-auto">
        <div className="space-y-4">
          {/* Top Brand Selector Card */}
          <BrandSwitcher project={project} />

          {/* Navigation Links */}
          <React.Suspense fallback={<div className="h-64 animate-pulse bg-slate-50 rounded-xl" />}>
            <SidebarNavigation project={project} />
          </React.Suspense>
        </div>

        {/* Bottom User & Sign Out Section */}
        <div className="border-t border-slate-200/80 pt-4 space-y-3 mt-6 mb-12">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-semibold text-xs text-slate-900 truncate block">
                {currentUser.name || currentUser.email || 'Cameron M.'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate block">
                {currentUser.email || 'cam@beaconmetrics.io'}
              </span>
            </div>
            <Badge className={cn('text-[9px] font-mono uppercase px-1.5 py-0.2 shrink-0', getRoleBadgeColor(userRole))}>
              {userRole}
            </Badge>
          </div>

          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-2 text-slate-500" /> Sign Out
            </Button>
          </form>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span>Beacon v2.0</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
        {children}
      </main>

      {/* COMMAND PALETTE DIALOG (Cmd+K / Ctrl+K) */}
      {commandOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type a report or page to jump..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-400 font-semibold">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Reports &amp; Tools
              </div>
              {searchableLinks
                .filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        setCommandOpen(false);
                        router.push(item.href);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-slate-500" />
                        <span>{item.title}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    </button>
                  );
                })}

              <div className="px-2 pt-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                External &amp; Public Links
              </div>
              <button
                onClick={() => {
                  setCommandOpen(false);
                  router.push('/');
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                  <span>Return to Landing Page</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </button>
            </div>

            <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] font-mono text-slate-400 px-4">
              <span>Quick switcher (Cmd+K)</span>
              <span>Press ESC to exit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
