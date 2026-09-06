'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Save,
  RefreshCw,
  ChevronDown,
  Mail,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Share2,
  FileText,
  Maximize2,
  Minimize2,
  Trash2,
  Search,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DomainFavicon } from '@/components/citations/domain-favicon';
import {
  inferContentTypeFromSource,
  getSourceTypeBadgeInfo,
} from '@/lib/content-studio/source-mapping';
import type { ContentStudioFormat, ContentDraft } from '@/types/database.types';
import type { AuthorityGapItem } from '@/app/api/authority-gap/route';
import { cn } from '@/lib/utils';

export interface QuickContentStudioDrawerProps {
  gap: AuthorityGapItem | null;
  brandName?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface GeneratedAngle {
  id: string;
  angleTitle: string;
  angleBadge: string;
  summary: string;
  content: string;
}

const QUICK_FORMATS: Array<{
  type: ContentStudioFormat;
  label: string;
  icon: any;
}> = [
  { type: 'Outreach Email', label: 'Editorial Outreach Pitch', icon: Mail },
  { type: 'Blog Post', label: 'Authority Blog & Guide', icon: BookOpen },
  { type: 'Reddit Post', label: 'Reddit Community Post', icon: MessageSquare },
  { type: 'FAQ', label: 'FAQ & Q&A Blocks', icon: HelpCircle },
  { type: 'LinkedIn Post', label: 'LinkedIn Industry Post', icon: Share2 },
  { type: 'Social Media Post', label: 'Social Media Post', icon: Share2 },
  { type: 'Newsletter', label: 'Industry Newsletter', icon: FileText },
];

export function QuickContentStudioDrawer({
  gap,
  brandName = 'Our Brand',
  isOpen,
  onClose,
}: QuickContentStudioDrawerProps) {
  // Expansion and tabs state
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'drafts'>('studio');

  // Content configuration state
  const [contentType, setContentType] = useState<ContentStudioFormat>('Outreach Email');
  const [isAutoInferred, setIsAutoInferred] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [angles, setAngles] = useState<GeneratedAngle[]>([]);
  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);
  const [editedContent, setEditedContent] = useState('');

  // Interaction state
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  // Saved Drafts state
  const [savedDrafts, setSavedDrafts] = useState<ContentDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [draftFilterFormat, setDraftFilterFormat] = useState<string>('all');

  const fetchDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const res = await fetch('/api/content-studio/drafts');
      if (res.ok) {
        const data = await res.json();
        if (data.drafts && Array.isArray(data.drafts)) {
          setSavedDrafts(data.drafts);
        }
      }
    } catch (err) {
      console.error('Failed to load saved drafts:', err);
    } finally {
      setLoadingDrafts(false);
    }
  };

  // When a new gap is opened, auto-configure format and generate angles
  useEffect(() => {
    if (!isOpen || !gap) return;

    const recommendedFormat = inferContentTypeFromSource(
      gap.sourceType,
      gap.domain,
      gap.recommendedAngle
    );
    setContentType(recommendedFormat);
    setIsAutoInferred(true);
    setAngles([]);
    setSelectedAngleIndex(0);
    setEditedContent('');
    setSavedDraftId(null);
    setActiveTab('studio');

    // Automatically trigger fast generation
    generateContentAngles(recommendedFormat, gap);
    fetchDrafts();
  }, [isOpen, gap?.id]);

  const generateContentAngles = async (format: ContentStudioFormat, targetGap: AuthorityGapItem) => {
    setIsGenerating(true);
    setAngles([]);
    setSavedDraftId(null);

    try {
      const competitorsStr = targetGap.competitorsCited.map((c) => c.name).join(', ');
      const res = await fetch('/api/content-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: targetGap.id,
          targetDomain: targetGap.domain,
          targetTopic: targetGap.relevanceTopic,
          competitors: competitorsStr,
          contentType: format,
          sourceType: targetGap.sourceType,
          buyerStage: 'Consideration (Comparison)',
          productFocus: `${brandName} Performance & Innovation`,
          customerSearchQuery: `best alternatives and reviews for ${targetGap.relevanceTopic}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.angles && Array.isArray(data.angles) && data.angles.length > 0) {
          setAngles(data.angles);
          setSelectedAngleIndex(0);
          setEditedContent(data.angles[0].content);
          toast.success(`Generated 3 distinct angles for ${format}`);
        } else {
          toast.error('Could not generate angles. Please retry.');
        }
      } else {
        toast.error('Failed to generate content. Please try again.');
      }
    } catch (err) {
      console.error('Quick Studio generation failed:', err);
      toast.error('Network error during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormatChange = (newFormat: ContentStudioFormat) => {
    setContentType(newFormat);
    setIsAutoInferred(false);
    if (gap) {
      generateContentAngles(newFormat, gap);
    }
  };

  const handleSelectAngle = (index: number) => {
    setSelectedAngleIndex(index);
    if (angles[index]) {
      setEditedContent(angles[index].content);
      setSavedDraftId(null);
    }
  };

  const handleCopy = () => {
    if (!editedContent) return;
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast.success('Copied content to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = async () => {
    if (!editedContent.trim() || !gap) return;
    setIsSaving(true);

    try {
      const activeAngle = angles[selectedAngleIndex];
      const competitorsStr = gap.competitorsCited.map((c) => c.name).join(', ');

      const res = await fetch('/api/content-studio/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: gap.id,
          targetDomain: gap.domain,
          targetTopic: gap.relevanceTopic,
          competitors: competitorsStr,
          contentType: contentType,
          angleTitle: activeAngle?.angleTitle || `${contentType} for ${gap.domain}`,
          content: editedContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSavedDraftId(data.draft?.id || 'saved');
        fetchDrafts();
        toast.success('Draft saved to Drafts', {
          action: {
            label: 'View in Drafts',
            onClick: () => setActiveTab('drafts'),
          },
        });
      } else {
        toast.error('Failed to save draft. Please try again.');
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      toast.error('Network error saving draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      const res = await fetch(`/api/content-studio/drafts?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Draft deleted');
        fetchDrafts();
      }
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };

  const handleLoadDraft = (draft: ContentDraft) => {
    setEditedContent(draft.content);
    setContentType(draft.content_type);
    setSavedDraftId(draft.id);
    setActiveTab('studio');
    toast.success('Loaded draft into Studio');
  };

  const handleFormat = (type: 'bold' | 'italic' | 'bullet') => {
    const textarea = document.getElementById('quickStudioTextarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editedContent.substring(start, end);

    let replacement = '';
    switch (type) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        break;
      case 'bullet':
        replacement = `\n• ${selected || 'Key insight'}\n`;
        break;
    }

    const newContent = editedContent.substring(0, start) + replacement + editedContent.substring(end);
    setEditedContent(newContent);
  };

  if (!isOpen || !gap) return null;

  const badgeInfo = getSourceTypeBadgeInfo(gap.sourceType);
  const wordCount = editedContent.trim() ? editedContent.trim().split(/\s+/).length : 0;
  const charCount = editedContent.length;

  const filteredDrafts = savedDrafts.filter((draft) => {
    const q = draftSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      draft.angle_title?.toLowerCase().includes(q) ||
      draft.target_domain?.toLowerCase().includes(q) ||
      draft.content?.toLowerCase().includes(q);

    const matchesFormat =
      draftFilterFormat === 'all' || draft.content_type === draftFilterFormat;

    return matchesSearch && matchesFormat;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Slide-over Right Panel */}
      <div
        className={cn(
          'relative bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden border-l border-slate-200 transition-all duration-300 animate-in slide-in-from-right',
          isExpanded
            ? 'w-full sm:w-[92vw] max-w-5xl'
            : 'w-full sm:w-[580px] md:w-[640px]'
        )}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Content Studio</h2>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-mono font-bold">
                  Quick Access
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Calibrate and draft publication-ready assets for this opportunity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Expand / Collapse Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-none flex items-center gap-1.5"
              title={isExpanded ? 'Collapse to standard drawer' : 'Expand to wide view'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Collapse</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Expand View</span>
                </>
              )}
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs: Studio vs Saved Drafts */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setActiveTab('studio')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                activeTab === 'studio'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Studio</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('drafts');
                fetchDrafts();
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                activeTab === 'drafts'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Saved Drafts</span>
              <Badge
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0 rounded-full font-bold',
                  activeTab === 'drafts'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-200 text-slate-700 border-transparent'
                )}
              >
                {savedDrafts.length}
              </Badge>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            {activeTab === 'studio' ? 'Mode: Pitch Generator' : `Library: ${savedDrafts.length} Saved`}
          </span>
        </div>

        {activeTab === 'studio' ? (
          <>
            {/* Opportunity Context Banner */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <DomainFavicon domain={gap.domain} className="h-4 w-4 rounded shrink-0" />
                  <span className="font-bold text-slate-900">{gap.domain}</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="font-mono text-slate-500">DA {gap.domainAuthority}</span>
                </div>
                <Badge className={cn('text-[10px] font-mono', badgeInfo.badgeClass)}>
                  {badgeInfo.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-slate-600 flex-wrap">
                <span className="truncate max-w-[320px]">
                  <strong className="text-slate-700">Displacing:</strong>{' '}
                  {gap.competitorsCited.map((c) => c.name).join(', ') || 'Competitors'}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium font-mono">
                  Opportunity Score: {gap.opportunityScore}/100
                </span>
              </div>

              <div className="text-xs text-slate-500 pt-1.5 border-t border-slate-200/60 line-clamp-2">
                <span className="font-semibold text-slate-700">Editorial Context: </span>
                {gap.relevanceTopic}
              </div>
            </div>

            {/* Format Selector Bar */}
            <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase font-mono tracking-wider">
                  Format:
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-semibold px-2.5 shadow-none flex items-center gap-1.5 cursor-pointer"
                    >
                      {React.createElement(
                        QUICK_FORMATS.find((f) => f.type === contentType)?.icon || Mail,
                        { className: 'h-3.5 w-3.5 text-emerald-600' }
                      )}
                      <span>{contentType}</span>
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 text-xs font-sans">
                    {QUICK_FORMATS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = contentType === item.type;
                      const isRec = item.type === inferContentTypeFromSource(gap.sourceType, gap.domain);
                      return (
                        <DropdownMenuItem
                          key={item.type}
                          onClick={() => handleFormatChange(item.type)}
                          className={cn(
                            'flex items-center justify-between p-2 cursor-pointer',
                            isSelected && 'bg-emerald-50 text-emerald-950 font-bold'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn('h-3.5 w-3.5', isSelected ? 'text-emerald-700' : 'text-slate-500')} />
                            <span>{item.label}</span>
                          </div>
                          {isRec && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Recommended for this source" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                {isAutoInferred && (
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full hidden sm:inline">
                    ⚡ Auto-tuned for {badgeInfo.label}
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generateContentAngles(contentType, gap)}
                  disabled={isGenerating}
                  className="h-7 px-2 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  title="Regenerate angles"
                >
                  <RefreshCw className={cn('h-3 w-3 mr-1', isGenerating && 'animate-spin text-emerald-600')} />
                  <span>Regenerate</span>
                </Button>
              </div>
            </div>

            {/* Scrollable Main Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Loading State */}
              {isGenerating ? (
                <div className="h-72 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      Synthesizing 3 tailored {contentType} angles...
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Analyzing {gap.domain}&apos;s editorial style to displace {gap.competitorsCited[0]?.name || 'competitors'}
                    </p>
                  </div>
                </div>
              ) : angles.length > 0 ? (
                <div className="space-y-4">
                  {/* 3 Angle Selector Tabs */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-[11px] font-bold text-slate-700 uppercase font-mono tracking-wide">
                        Select Strategic Angle:
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">3 AI Options</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {angles.map((angle, idx) => {
                        const isSelected = selectedAngleIndex === idx;
                        return (
                          <button
                            key={angle.id}
                            onClick={() => handleSelectAngle(idx)}
                            className={cn(
                              'p-2.5 rounded-lg border text-left transition-all cursor-pointer shadow-none relative flex flex-col justify-between',
                              isSelected
                                ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/40 text-emerald-950'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            )}
                          >
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider block text-emerald-800 truncate">
                              Angle {idx + 1}
                            </span>
                            <span className="text-xs font-bold leading-tight line-clamp-1 mt-0.5">
                              {angle.angleTitle}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Angle Summary Callout */}
                  {angles[selectedAngleIndex] && (
                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-white text-emerald-800 border-emerald-200 text-[10px] font-mono font-bold px-1.5 py-0">
                          {angles[selectedAngleIndex].angleBadge}
                        </Badge>
                        <span className="text-xs font-bold text-emerald-950 truncate">
                          {angles[selectedAngleIndex].angleTitle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {angles[selectedAngleIndex].summary}
                      </p>
                    </div>
                  )}

                  {/* Content Editor Surface */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                    {/* Editor Toolbar */}
                    <div className="bg-slate-50/90 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <button
                          onClick={() => handleFormat('bold')}
                          className="h-6 w-6 font-bold rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Bold (**text**)"
                        >
                          B
                        </button>
                        <button
                          onClick={() => handleFormat('italic')}
                          className="h-6 w-6 italic rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Italic (*text*)"
                        >
                          I
                        </button>
                        <button
                          onClick={() => handleFormat('bullet')}
                          className="h-6 px-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer font-bold"
                          title="Bullet point (• item)"
                        >
                          &bull;
                        </button>
                      </div>

                      <span className="text-[11px] font-mono text-slate-500">
                        {wordCount} words &bull; {charCount} chars
                      </span>
                    </div>

                    {/* Textarea */}
                    <textarea
                      id="quickStudioTextarea"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={isExpanded ? 18 : 14}
                      placeholder="Draft content will appear here..."
                      className="w-full p-4 text-xs font-sans text-slate-900 leading-relaxed resize-y focus:outline-none bg-white selection:bg-emerald-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-slate-200 rounded-xl p-6">
                  <Sparkles className="h-6 w-6 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">No content generated yet</p>
                  <Button
                    size="sm"
                    onClick={() => generateContentAngles(contentType, gap)}
                    className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-none"
                  >
                    Generate {contentType}
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!editedContent}
                  className="h-8 px-3 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-none"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1 text-slate-500" />
                      Copy
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSaving || !editedContent}
                  className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-none flex items-center gap-1"
                >
                  <Save className="h-3 w-3" />
                  <span>{savedDraftId ? 'Saved' : 'Save Draft'}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* SAVED DRAFTS LIBRARY TAB */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={draftSearchQuery}
                    onChange={(e) => setDraftSearchQuery(e.target.value)}
                    placeholder="Search drafts by title, domain, or body keywords..."
                    className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={() => setActiveTab('studio')}
                  className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shrink-0 shadow-none flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>New Draft</span>
                </Button>
              </div>

              {/* Format Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setDraftFilterFormat('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all shrink-0 cursor-pointer',
                    draftFilterFormat === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  All ({savedDrafts.length})
                </button>
                {QUICK_FORMATS.map((item) => {
                  const count = savedDrafts.filter((d) => d.content_type === item.type).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setDraftFilterFormat(item.type)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all shrink-0 cursor-pointer',
                        draftFilterFormat === item.type
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      {item.type} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drafts List Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {loadingDrafts ? (
                <div className="h-48 flex items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                  <span className="text-xs">Loading drafts...</span>
                </div>
              ) : filteredDrafts.length === 0 ? (
                <div className="h-64 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <FileText className="h-8 w-8 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">No saved drafts found</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    {draftSearchQuery
                      ? 'No drafts match your current search criteria.'
                      : 'Generate and save your first draft in the Studio tab.'}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('studio')}
                    className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-none"
                  >
                    Go to Studio
                  </Button>
                </div>
              ) : (
                filteredDrafts.map((draft) => {
                  const draftWords = draft.content.trim().split(/\s+/).length;
                  const draftDate = new Date(draft.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={draft.id}
                      className="border border-slate-200 rounded-xl bg-white p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                    >
                      {/* Top row: Target & Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <DomainFavicon domain={draft.target_domain} className="h-4 w-4 rounded shrink-0" />
                          <span className="text-xs font-bold text-slate-900">{draft.target_domain}</span>
                          <span className="text-slate-300">&bull;</span>
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-mono font-semibold">
                            {draft.content_type}
                          </Badge>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{draftDate}</span>
                      </div>

                      {/* Title & Preview */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900">{draft.angle_title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          {draft.content}
                        </p>
                      </div>

                      {/* Bottom action row */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <span className="text-[11px] font-mono text-slate-500">
                          {draftWords} words &bull; {draft.content.length} chars
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(draft.content);
                              toast.success('Copied draft to clipboard');
                            }}
                            className="h-7 px-2.5 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-none"
                          >
                            <Copy className="h-3 w-3 mr-1 text-slate-500" />
                            Copy
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleLoadDraft(draft)}
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-none flex items-center gap-1"
                          >
                            <span>Load into Studio</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Delete draft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <span className="text-xs font-mono text-slate-500">
                Total Saved: {savedDrafts.length} drafts
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 px-3 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
