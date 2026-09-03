'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { signOut } from '@/app/login/actions';
import {
  Radio,
  Bot,
  LayoutDashboard,
  Link2,
  Search,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Target,
} from 'lucide-react';

interface AppSidebarLayoutProps {
  project: {
    id: string;
    name: string;
    domain: string;
    tier?: string;
  };
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
  badge?: string;
  pulse?: boolean;
}

export function AppSidebarLayout({ project, children }: AppSidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const navItems: NavItem[] = [
    {
      title: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      title: 'Prompts',
      href: '/audits',
      icon: Search,
      active: pathname.startsWith('/audits'),
    },
    {
      title: 'Citations',
      href: '/citations',
      icon: Link2,
      active: pathname.startsWith('/citations'),
    },
    {
      title: 'Authority Gap',
      href: '/authority-gap',
      icon: TrendingUp,
      active: pathname.startsWith('/authority-gap'),
      badge: 'New',
    },
    {
      title: 'Competitor Mapping',
      href: '/competitor-mapping',
      icon: Target,
      active: pathname.startsWith('/competitor-mapping'),
    },
    {
      title: 'AI Co-worker',
      href: '/consultant',
      icon: Bot,
      active: pathname.startsWith('/consultant'),
      badge: 'Sentinel',
    },
    {
      title: 'Settings & Billing',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col lg:flex-row selection:bg-zinc-200 selection:text-zinc-950">
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden h-16 border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-950 tracking-tight text-base">Beacon</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandOpen(true)}
            className="h-9 w-9 text-zinc-700 hover:bg-zinc-100"
            title="Search or jump to (Cmd+K)"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="text-[10px] font-mono border-zinc-200 bg-zinc-50 text-zinc-700">
            {project.tier?.toUpperCase() || 'STARTER'}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="h-9 w-9 text-zinc-700 hover:bg-zinc-100"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/30 backdrop-blur-xs z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-white border-r border-zinc-200 p-5 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
                    <Radio className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-zinc-950 tracking-tight text-base">
                    Beacon
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 text-zinc-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>


              {/* Navigation links */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        item.active
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${item.active ? 'text-white' : 'text-zinc-500'}`} />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-zinc-200 pt-4 space-y-3">
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 text-xs border-zinc-200"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP PERSISTENT LEFT SIDEBAR */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-zinc-200 bg-zinc-50/50 min-h-screen sticky top-0 h-screen p-5">
        <div className="space-y-6">
          {/* Top Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group px-1">
            <div className="h-9 w-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-zinc-800 transition-colors">
              <Radio className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-zinc-950 tracking-tight text-base block leading-none">
                Beacon
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                AEO / GEO Platform
              </span>
            </div>
          </Link>

          <Separator className="bg-zinc-200" />

          {/* Navigation Menu */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold px-2 block mb-2">
                Generative Engines
              </span>
              {navItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      item.active
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${item.active ? 'text-white' : 'text-zinc-500'}`} />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        {item.badge}
                      </span>
                    )}
                    {item.pulse && !item.active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold px-2 block mb-2">
                Administration
              </span>
              {navItems.slice(5).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      item.active
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${item.active ? 'text-white' : 'text-zinc-500'}`} />
                      <span>{item.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom User & Sign Out Section */}
        <div className="border-t border-zinc-200 pt-4 space-y-3">
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5 mr-2 text-zinc-500" /> Sign Out
            </Button>
          </form>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
            <span>Beacon v1.4</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>

      {/* COMMAND PALETTE DIALOG (Cmd+K / Ctrl+K) */}
      {commandOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type a page or command to jump..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent border-none outline-none text-zinc-900 placeholder:text-zinc-400"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-400 font-semibold">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Pages & Navigation
              </div>
              {navItems
                .filter((item) =>
                  item.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        setCommandOpen(false);
                        router.push(item.href);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-zinc-500" />
                        <span>{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge variant="outline" className="text-[10px] font-mono border-zinc-200">
                            {item.badge}
                          </Badge>
                        )}
                        <ArrowRight className="h-3 w-3 text-zinc-400" />
                      </div>
                    </button>
                  );
                })}

              <div className="px-2 pt-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                External & Public Links
              </div>
              <button
                onClick={() => {
                  setCommandOpen(false);
                  router.push('/');
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="h-4 w-4 text-zinc-500" />
                  <span>Return to Landing Page</span>
                </div>
                <ArrowRight className="h-3 w-3 text-zinc-400" />
              </button>
            </div>

            <div className="p-2.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-[11px] font-mono text-zinc-400 px-4">
              <span>Quick switcher (Cmd+K)</span>
              <span>Press ESC to exit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
