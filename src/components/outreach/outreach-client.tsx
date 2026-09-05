'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Kanban,
  Table as TableIcon,
  Plus,
  RefreshCw,
  Search,
  Mail,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Trophy,
  Copy,
  Check,
  Building2,
  User,
  AlertCircle,
  Filter,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DomainFavicon } from '@/components/citations/domain-favicon';
import { cn } from '@/lib/utils';
import type { OutreachPitch, OutreachStage, OutreachPriority } from '@/types/database.types';

const STAGES: { id: OutreachStage; title: string; desc: string; color: string; badgeClass: string }[] = [
  {
    id: 'generated',
    title: 'Generated',
    desc: 'AI Sentinel drafts ready for review',
    color: 'border-slate-300',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    id: 'pitch_sent',
    title: 'Pitch Sent',
    desc: 'Outreached to editorial desk',
    color: 'border-blue-300',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'review_scheduled',
    title: 'Review Scheduled',
    desc: 'Samples dispatched & evaluation set',
    color: 'border-amber-300',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'published_won',
    title: 'Published / Won',
    desc: 'Live citation & link secured',
    color: 'border-emerald-300',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
];

const PRIORITIES: { id: OutreachPriority; label: string; color: string }[] = [
  { id: 'critical', label: 'Critical', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'high', label: 'High', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export function OutreachClient() {
  const [pitches, setPitches] = useState<OutreachPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedPitch, setSelectedPitch] = useState<OutreachPitch | null>(null);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  // New Pitch Dialog state
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newPubName, setNewPubName] = useState('');
  const [newPubDomain, setNewPubDomain] = useState('');
  const [newArticleUrl, setNewArticleUrl] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newPriority, setNewPriority] = useState<OutreachPriority>('medium');
  const [creating, setCreating] = useState(false);

  const fetchPitches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/outreach');
      if (res.ok) {
        const json = await res.json();
        setPitches(json.pitches || []);
      }
    } catch (err) {
      console.error('Failed to load outreach pitches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPitches();
  }, []);

  const handleUpdateStage = async (id: string, nextStage: OutreachStage) => {
    setPitches((prev: OutreachPitch[]) =>
      prev.map((p) => (p.id === id ? { ...p, stage: nextStage, updated_at: new Date().toISOString() } : p))
    );
    if (selectedPitch?.id === id) {
      setSelectedPitch((prev: OutreachPitch | null) => (prev ? { ...prev, stage: nextStage } : null));
    }

    try {
      await fetch('/api/outreach', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stage: nextStage }),
      });
    } catch (err) {
      console.error('Failed to update stage:', err);
      fetchPitches();
    }
  };

  const handleDeletePitch = async (id: string) => {
    setPitches((prev: OutreachPitch[]) => prev.filter((p) => p.id !== id));
    if (selectedPitch?.id === id) setSelectedPitch(null);

    try {
      await fetch(`/api/outreach?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete pitch:', err);
      fetchPitches();
    }
  };

  const handleCreatePitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPubDomain || !newSubject || !newBody) return;

    setCreating(true);
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicationName: newPubName || newPubDomain,
          publicationDomain: newPubDomain,
          articleUrl: newArticleUrl,
          contactName: newContactName,
          contactEmail: newContactEmail,
          stage: 'generated',
          priority: newPriority,
          pitchSubject: newSubject,
          pitchBody: newBody,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.pitch) {
          setPitches((prev: OutreachPitch[]) => [json.pitch, ...prev]);
        }
        setIsNewDialogOpen(false);
        setNewPubName('');
        setNewPubDomain('');
        setNewArticleUrl('');
        setNewContactName('');
        setNewContactEmail('');
        setNewSubject('');
        setNewBody('');
      }
    } catch (err) {
      console.error('Failed to create pitch:', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredPitches = useMemo(() => {
    if (!searchQuery.trim()) return pitches;
    const q = searchQuery.toLowerCase();
    return pitches.filter(
      (p) =>
        p.publication_name.toLowerCase().includes(q) ||
        p.publication_domain.toLowerCase().includes(q) ||
        p.pitch_subject.toLowerCase().includes(q) ||
        (p.contact_name && p.contact_name.toLowerCase().includes(q))
    );
  }, [pitches, searchQuery]);

  const stats = useMemo(() => {
    const total = pitches.length;
    const won = pitches.filter((p) => p.stage === 'published_won').length;
    const inFlight = pitches.filter((p) => p.stage === 'pitch_sent' || p.stage === 'review_scheduled').length;
    const conversion = total > 0 ? Math.round((won / total) * 100) : 0;
    return { total, won, inFlight, conversion };
  }, [pitches]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 font-mono text-[11px]">
              <Sparkles className="h-3 w-3 mr-1 text-emerald-600 inline" />
              Automated Digital PR & Authority Pipeline
            </Badge>
            <span className="text-xs text-slate-400">Syncs directly with AI Sentinel Authority Gaps</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Outreach & Editorial PR CRM
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track pitch lifecycles to displace competitor citations across premier editorial publications and industry desks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all',
                viewMode === 'kanban'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all',
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setIsNewDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Pitch
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPitches}
            disabled={loading}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs shadow-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="text-xs font-mono text-slate-500 mb-1">TOTAL PITCHES CREATED</div>
            <div className="text-3xl font-bold text-slate-900 font-sans">{stats.total}</div>
            <p className="text-xs text-slate-400 mt-1">Across publications & authority gaps</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="text-xs font-mono text-slate-500 mb-1">ACTIVE IN REVIEW / OUTREACH</div>
            <div className="text-3xl font-bold text-blue-600 font-sans">{stats.inFlight}</div>
            <p className="text-xs text-slate-400 mt-1">Pitches sent or evaluation scheduled</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="text-xs font-mono text-slate-500 mb-1">WON / PUBLISHED CITATIONS</div>
            <div className="text-3xl font-bold text-emerald-600 font-sans">{stats.won}</div>
            <p className="text-xs text-slate-400 mt-1">Recommendations secured in AI search</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="text-xs font-mono text-slate-500 mb-1">WIN CONVERSION RATE</div>
            <div className="text-3xl font-bold text-slate-900 font-sans">{stats.conversion}%</div>
            <p className="text-xs text-slate-400 mt-1">From initial draft to published win</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Quick Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search publication, journalist, or pitch subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white border-slate-200 text-xs shadow-2xs"
          />
        </div>
        <Link
          href="/authority-gap"
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate more pitches from Authority Gaps
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {STAGES.map((stage) => {
            const stagePitches = filteredPitches.filter((p) => p.stage === stage.id);
            return (
              <div key={stage.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-3 flex flex-col min-h-[500px]">
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 px-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                        {stage.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-white border border-slate-200 text-slate-600">
                        {stagePitches.length}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{stage.desc}</span>
                  </div>
                </div>

                {/* Stage Cards */}
                <div className="space-y-2.5 flex-1">
                  {stagePitches.length === 0 ? (
                    <div className="h-32 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                      <span>No pitches in this stage</span>
                    </div>
                  ) : (
                    stagePitches.map((pitch) => (
                      <Card
                        key={pitch.id}
                        onClick={() => setSelectedPitch(pitch)}
                        className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-all bg-white cursor-pointer group"
                      >
                        <CardContent className="p-3.5 space-y-2.5">
                          {/* Top: Publication Domain & Priority */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <DomainFavicon domain={pitch.publication_domain} size="sm" />
                              <span className="font-semibold text-xs text-slate-900 truncate">
                                {pitch.publication_name}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-mono px-1.5 py-0 shrink-0 capitalize',
                                PRIORITIES.find((p) => p.id === pitch.priority)?.color
                              )}
                            >
                              {pitch.priority}
                            </Badge>
                          </div>

                          {/* Pitch Subject Preview */}
                          <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed">
                            {pitch.pitch_subject}
                          </p>

                          {/* Displaced Competitor */}
                          {pitch.competitor_displaced && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span className="text-slate-400">Target:</span>
                              <span className="font-medium text-slate-700">Displace {pitch.competitor_displaced}</span>
                            </div>
                          )}

                          {/* Contact */}
                          {pitch.contact_name && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-100">
                              <User className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{pitch.contact_name}</span>
                            </div>
                          )}

                          {/* Stage Mover Buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(pitch.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-6 px-1.5 text-[11px] text-slate-500 hover:text-slate-900"
                                  >
                                    Move <ChevronRight className="h-3 w-3 ml-0.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 bg-white border-slate-200">
                                  {STAGES.map((s) => (
                                    <DropdownMenuItem
                                      key={s.id}
                                      onClick={() => handleUpdateStage(pitch.id, s.id)}
                                      className={cn('text-xs cursor-pointer', s.id === pitch.stage && 'font-bold text-emerald-700')}
                                    >
                                      {s.title}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeletePitch(pitch.id)}
                                    className="text-xs text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1.5" /> Delete Pitch
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200">
                <TableHead className="font-mono text-xs uppercase tracking-wider text-slate-500">Publication</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-slate-500">Subject</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-slate-500">Contact</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-slate-500">Stage</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-slate-500">Priority</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-slate-500">Displaced Competitor</TableHead>
                <TableHead className="w-20 text-right font-mono text-xs uppercase tracking-wider text-slate-500">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPitches.map((pitch) => (
                <TableRow
                  key={pitch.id}
                  className="border-slate-200 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelectedPitch(pitch)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DomainFavicon domain={pitch.publication_domain} size="sm" />
                      <div>
                        <span className="font-semibold text-slate-900 text-xs block">{pitch.publication_name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{pitch.publication_domain}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-xs text-slate-800 line-clamp-1 font-medium">{pitch.pitch_subject}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="text-slate-900 font-medium block">{pitch.contact_name || '—'}</span>
                      <span className="text-[11px] text-slate-400">{pitch.contact_email || ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs font-mono', STAGES.find((s) => s.id === pitch.stage)?.badgeClass)}>
                      {STAGES.find((s) => s.id === pitch.stage)?.title}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px] font-mono capitalize', PRIORITIES.find((p) => p.id === pitch.priority)?.color)}>
                      {pitch.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-600">{pitch.competitor_displaced || '—'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-slate-600 hover:text-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPitch(pitch);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* PITCH DETAIL DIALOG / DRAWER */}
      {selectedPitch && (
        <Dialog open={Boolean(selectedPitch)} onOpenChange={(open) => !open && setSelectedPitch(null)}>
          <DialogContent className="max-w-2xl bg-white border-slate-200">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <DomainFavicon domain={selectedPitch.publication_domain} size="md" />
                <span className="text-xs font-mono text-slate-500">{selectedPitch.publication_domain}</span>
                <Badge variant="outline" className={cn('text-[10px] font-mono ml-auto capitalize', PRIORITIES.find((p) => p.id === selectedPitch.priority)?.color)}>
                  {selectedPitch.priority} priority
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {selectedPitch.publication_name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Created {new Date(selectedPitch.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Stage Progress Bar */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700 text-[11px] block">Pipeline Stage</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STAGES.map((s) => {
                    const isCurrent = s.id === selectedPitch.stage;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleUpdateStage(selectedPitch.id, s.id)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer',
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {s.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Editorial Contact</span>
                  <span className="font-medium text-slate-900 block mt-0.5">{selectedPitch.contact_name || 'Desk Editor'}</span>
                  <span className="text-slate-500 text-[11px]">{selectedPitch.contact_role || 'Staff Reviewer'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Email Address</span>
                  <span className="font-mono text-slate-800 block mt-0.5">{selectedPitch.contact_email || 'editorial@' + selectedPitch.publication_domain}</span>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 text-[11px]">Subject Line</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPitch.pitch_subject);
                      setCopiedSubject(true);
                      setTimeout(() => setCopiedSubject(false), 2000);
                    }}
                    className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 text-[11px]"
                  >
                    {copiedSubject ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedSubject ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-2.5 rounded bg-slate-100 border border-slate-200 font-mono text-xs text-slate-900 select-all">
                  {selectedPitch.pitch_subject}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 text-[11px]">Pitch Body</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPitch.pitch_body);
                      setCopiedBody(true);
                      setTimeout(() => setCopiedBody(false), 2000);
                    }}
                    className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 text-[11px]"
                  >
                    {copiedBody ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedBody ? 'Copied' : 'Copy Body'}
                  </button>
                </div>
                <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto font-sans">
                  {selectedPitch.pitch_body}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeletePitch(selectedPitch.id)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
              <div className="flex items-center gap-2">
                {selectedPitch.contact_email && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                    onClick={() => {
                      window.location.href = `mailto:${selectedPitch.contact_email}?subject=${encodeURIComponent(selectedPitch.pitch_subject)}&body=${encodeURIComponent(selectedPitch.pitch_body)}`;
                    }}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Open in Mail Client
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedPitch(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* CREATE NEW PITCH DIALOG */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Add New Outreach Pitch</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Link an editorial pitch to target publications to get your brand recommended in AI search.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePitch} className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Publication Name</label>
                <Input
                  required
                  placeholder="e.g. Wirecutter"
                  value={newPubName}
                  onChange={(e) => setNewPubName(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Publication Domain</label>
                <Input
                  required
                  placeholder="nytimes.com/wirecutter"
                  value={newPubDomain}
                  onChange={(e) => setNewPubDomain(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Name</label>
                <Input
                  placeholder="Editor Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Email</label>
                <Input
                  type="email"
                  placeholder="editor@publication.com"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pitch Subject</label>
              <Input
                required
                placeholder="Subject Line"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="h-8 text-xs bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pitch Body</label>
              <Textarea
                required
                rows={5}
                placeholder="Pitch content..."
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="text-xs bg-white border-slate-200"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {creating ? 'Saving...' : 'Save Pitch to CRM'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
