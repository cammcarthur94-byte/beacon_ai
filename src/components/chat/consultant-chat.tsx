'use client';

import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/chat/markdown-renderer';
import {
  Radio,
  Send,
  Bot,
  User,
  Download,
  Check,
  Copy,
  FileText,
  Loader2,
  Sparkles,
  AlertTriangle,
  Zap,
  LineChart,
  Globe,
  Square,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface DraftRewriteOutput {
  topic: string;
  competitor_name: string;
  missing_entities: string[];
  markdownContent: string;
  metaDescription?: string;
  faqItems?: Array<{ question: string; answer: string }>;
  wordCount?: number;
  status?: string;
}

export interface ConsultantChatProps {
  workspace: {
    projectId: string;
    brandName: string;
    domain: string;
    tier: string;
  };
  initialMessages: UIMessage[];
  hasUnreadAlerts: boolean;
}

/* ------------------------------------------------------------------ */
/* Quick actions                                                        */
/* ------------------------------------------------------------------ */

const QUICK_ACTIONS = [
  {
    icon: LineChart,
    label: 'How is our Share of Voice trending?',
    text: 'How is our Share of Voice trending across engines over the last 30 days?',
  },
  {
    icon: Globe,
    label: 'Why did we drop on Perplexity?',
    text: 'Why did we drop on Perplexity? What did the competitor do differently?',
  },
  {
    icon: Zap,
    label: 'Analyze our citation gap',
    text: 'Analyze our citation gap and recommend backlink strategies to win more citations.',
  },
  {
    icon: Sparkles,
    label: 'Draft an FAQ block for our top prompt',
    text: 'Draft an optimized FAQ block and meta description for our top tracked prompt.',
  },
];

/* ------------------------------------------------------------------ */
/* Main chat component                                                  */
/* ------------------------------------------------------------------ */

export function ConsultantChat({ workspace, initialMessages, hasUnreadAlerts }: ConsultantChatProps) {
  const [input, setInput] = React.useState('');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Esc collapses expanded mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        projectId: workspace.projectId,
      },
    }),
    messages: initialMessages,
    onError: () => {
      toast.error('Beacon Sentinel hit a snag. Please try again.');
    },
  });

  const isBusy = status === 'submitted' || status === 'streaming';

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput('');
    sendMessage({ text: trimmed });
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Clipboard unavailable in this browser');
    }
  };

  const handleExportMarkdown = (title: string, markdown: string) => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-beacon-draft.md`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Draft exported to your downloads');
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Expanded / Standard container with smooth transition */}
      <div
        className={cn(
          'flex flex-col bg-white overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded
            ? 'fixed inset-2 sm:inset-4 md:inset-6 z-50 rounded-2xl border border-zinc-200 shadow-2xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] w-auto'
            : 'h-[calc(100vh-8.5rem)] w-full max-w-6xl mx-auto rounded-2xl border border-gray-200/80 shadow-sm'
        )}
      >
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center ring-2 ring-emerald-200/60">
                <Radio className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">Beacon Sentinel</span>
                <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-purple-600" />
                  Claude Sonnet 5
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span className="font-medium text-gray-700">{workspace.brandName}</span>
                <span className="text-gray-300">/</span>
                <span>{workspace.domain}</span>
                <span className="text-gray-300">/</span>
                <span className="capitalize">{workspace.tier}</span>
              </p>
            </div>
          </div>

          {/* Top-Right Corner Controls (Expand / Collapse) */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2.5 gap-1.5 text-xs text-zinc-700 hover:text-zinc-950 border-zinc-200 bg-white hover:bg-zinc-50 rounded-lg shadow-2xs cursor-pointer transition-colors"
              title={isExpanded ? 'Collapse canvas (Esc)' : 'Expand canvas to full view'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="hidden sm:inline font-medium">Collapse</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="hidden sm:inline font-medium">Expand Canvas</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── MESSAGE STREAM ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 bg-gray-50/50">
          {!hasMessages && (
            <EmptyState
              brandName={workspace.brandName}
              onAction={handleSend}
              disabled={isBusy}
            />
          )}

          {hasMessages && (
            <div className={cn('space-y-6 mx-auto w-full transition-all duration-300', isExpanded ? 'max-w-5xl' : 'max-w-4xl')}>
              {messages.map((message) => {
                const isAgent = message.role === 'assistant';
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isAgent
                          ? 'bg-emerald-50 ring-1 ring-emerald-200/60'
                          : 'bg-gray-100 ring-1 ring-gray-200/60'
                      }`}
                    >
                      {isAgent ? (
                        <Bot className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-gray-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`space-y-2 min-w-0 ${isAgent ? 'w-full max-w-[96%]' : 'max-w-[85%] items-end'}`}>
                      <span className={`text-[11px] text-gray-500 font-medium block ${isAgent ? '' : 'text-right'}`}>
                        {isAgent ? 'Beacon Sentinel' : 'You'}
                      </span>

                      {message.parts.map((part, partIdx) => {
                        if (part.type === 'text' && part.text.trim()) {
                          return (
                            <div key={`${message.id}-text-${partIdx}`}>
                              <div
                                className={`rounded-2xl text-sm leading-relaxed ${
                                  isAgent
                                    ? 'bg-white border border-gray-200/70 border-l-emerald-500 border-l-[3.5px] p-4 sm:p-5 shadow-sm'
                                    : 'bg-gray-900 text-white px-4 py-2.5 inline-block'
                                }`}
                              >
                                {isAgent ? (
                                  <MarkdownContent content={part.text} />
                                ) : (
                                  <p className="whitespace-pre-wrap">{part.text}</p>
                                )}
                              </div>
                              {isAgent && (
                                <div className="flex justify-start mt-1.5 pl-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(part.text)}
                                    className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="h-3 w-3" />
                                    Copy
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }

                        /* Tool parts: draftRewrite gets rich action card;
                           analytics tools get structured cards. */
                        if (part.type === 'tool-draftRewrite') {
                          return (
                            <DraftRewriteCard
                              key={`${message.id}-tool-${partIdx}`}
                              part={part}
                              onCopy={handleCopy}
                              onExport={handleExportMarkdown}
                            />
                          );
                        }
                        if (part.type === 'tool-queryAuditTelemetry') {
                          return (
                            <AnalyticsToolCard
                              key={`${message.id}-telemetry-${partIdx}`}
                              label="queryAuditTelemetry"
                              icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
                              part={part}
                            />
                          );
                        }
                        if (part.type === 'tool-analyzeCitationGap') {
                          return (
                            <AnalyticsToolCard
                              key={`${message.id}-citations-${partIdx}`}
                              label="analyzeCitationGap"
                              icon={<Globe className="h-3.5 w-3.5 text-emerald-600" />}
                              part={part}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isBusy && (
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 ring-1 ring-emerald-200/60">
                    <Bot className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="bg-white border border-gray-200/60 border-l-emerald-400/60 border-l-[3px] rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && !isBusy && (
                <div className="flex items-center gap-2 text-xs text-red-500 pl-10">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Something went wrong reaching the agent. Please try again.</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── INPUT AREA ─────────────────────────────────────────── */}
        <div className="border-t border-gray-100 bg-white p-4 space-y-3">
          {/* Proactive alert banner */}
          {hasUnreadAlerts && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Proactive alert — Sentinel detected a significant drop while you were away.
              </span>
            </div>
          )}

          {/* Quick actions */}
          {hasMessages && (
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleSend(action.text)}
                    disabled={isBusy}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200/60 bg-white hover:bg-emerald-50/50 hover:border-emerald-200/60 hover:text-emerald-700 text-gray-500 transition-all cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    <Icon className="h-3 w-3" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="relative"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about visibility, citations, or request a draft..."
              className="w-full h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 pl-4 pr-24 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-all disabled:opacity-40"
              disabled={isBusy}
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isBusy ? (
                <Button
                  type="button"
                  onClick={() => stop()}
                  className="h-8 px-3 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-xs font-medium gap-1.5 shadow-sm"
                >
                  <Square className="h-3 w-3 fill-current" /> Stop
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-8 w-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm disabled:opacity-30 disabled:bg-gray-300 p-0 flex items-center justify-center"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

function EmptyState({
  brandName,
  onAction,
  disabled,
}: {
  brandName: string;
  onAction: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-12 max-w-lg mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mb-4 ring-1 ring-emerald-200/40">
        <Sparkles className="h-6 w-6 text-emerald-500" />
      </div>
      <h2 className="text-lg font-medium text-gray-900 mb-1">
        How can I help with {brandName}?
      </h2>
      <p className="text-sm text-gray-400 mb-8 max-w-sm">
        I&apos;m monitoring your brand across ChatGPT, Gemini, Claude, Perplexity, and Google AI.
        Ask me anything.
      </p>

      <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => onAction(action.text)}
              disabled={disabled}
              className="group text-left p-3 rounded-xl border border-gray-200/60 bg-white hover:border-emerald-200/60 hover:bg-emerald-50/30 transition-all cursor-pointer disabled:opacity-40 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                <ArrowUpRight className="h-3 w-3 text-gray-300 group-hover:text-emerald-400 transition-colors ml-auto" />
              </div>
              <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors leading-relaxed">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* draftRewrite action card (Enhanced Visual Hierarchy & Contrast)      */
/* ------------------------------------------------------------------ */

function DraftRewriteCard({
  part,
  onCopy,
  onExport,
}: {
  part: {
    state: string;
    errorText?: string;
    output?: unknown;
  };
  onCopy: (text: string) => void;
  onExport: (title: string, markdown: string) => void;
}) {
  const [approved, setApproved] = React.useState(false);

  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return (
      <div className="rounded-xl border border-gray-200/60 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
          <span>Composing draft...</span>
        </div>
      </div>
    );
  }

  if (part.state === 'output-error') {
    return (
      <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4 text-xs text-red-600 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          Draft generation failed: {part.errorText}
        </div>
      </div>
    );
  }

  if (part.state !== 'output-available') return null;

  const result = part.output as DraftRewriteOutput;
  if (!result) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-emerald-50 via-emerald-50/30 to-white px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-100/70 border border-emerald-200 flex items-center justify-center">
            <FileText className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm block">
              {result.topic}
            </span>
            <span className="text-[11px] text-gray-500">
              Positioning Blueprint · Grounded in Brand Kit
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-950 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-full shadow-2xs">
          vs {result.competitor_name}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* 1. RECLAIMED ENTITIES SECTION (Distinct Visual Hierarchy) */}
        {result.missing_entities?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-md shadow-2xs">
                Reclaimed Entities
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">
                {result.missing_entities.length} high-authority proof points
              </span>
            </div>

            {/* Refined Pill Contrast: Softer background fill with darker text */}
            <div className="flex flex-wrap gap-2 pt-1">
              {result.missing_entities.map((entity, eidx) => (
                <span
                  key={eidx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-950 shadow-2xs transition-all hover:bg-emerald-100/60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>{entity}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 2. META DESCRIPTION CALLOUT (Distinct Visual Hierarchy) */}
        {result.metaDescription && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md shadow-2xs">
                Deploy-Ready Meta Description
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">
                SERP &amp; AI Snippet
              </span>
            </div>
            <div className="rounded-xl bg-zinc-50/90 border border-zinc-200 p-4 shadow-2xs">
              <p className="text-xs sm:text-sm text-zinc-900 leading-relaxed font-normal">
                &ldquo;{result.metaDescription}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* 3. DRAFT PREVIEW (Generous line spacing & readable Markdown) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md shadow-2xs">
              Positioning Content Blueprint
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">
              {result.wordCount ?? 0} words · Markdown
            </span>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 sm:p-5 max-h-96 overflow-y-auto shadow-2xs">
            <MarkdownContent content={result.markdownContent} />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">
            Ready for canonical deployment
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCopy(result.markdownContent)}
              className="h-8 px-3 gap-1.5 text-xs border-gray-200 text-gray-700 hover:text-gray-950 rounded-lg cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" /> Copy Markdown
            </Button>
            <Button
              type="button"
              onClick={() => {
                onExport(result.topic, result.markdownContent);
                setApproved(true);
              }}
              className={`h-8 px-4 gap-1.5 text-xs font-semibold rounded-lg shadow-sm cursor-pointer ${
                approved
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {approved ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Exported
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" /> Approve &amp; Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Analytics tool cards (telemetry + citation gap)                      */
/* ------------------------------------------------------------------ */

function AnalyticsToolCard({
  label,
  icon,
  part,
}: {
  label: string;
  icon: React.ReactNode;
  part: { state: string; output?: unknown; errorText?: string };
}) {
  // Loading state
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white px-3 py-1.5 text-[11px] text-gray-500 shadow-sm">
        <Loader2 className="h-3 w-3 animate-spin text-emerald-500" /> {label}
      </div>
    );
  }

  // Error state
  if (part.state === 'output-error') {
    return (
      <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-3 text-xs text-red-600">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          {label} failed: {part.errorText}
        </div>
      </div>
    );
  }

  if (part.state !== 'output-available') return null;

  const result = (part.output && typeof part.output === 'object' ? part.output : {}) as Record<string, unknown>;
  const summary = typeof result.summary === 'string' ? result.summary : 'Analysis complete.';
  const engineTotals = Array.isArray(result.engine_totals) ? result.engine_totals as Array<Record<string, unknown>> : [];
  const competitorWins = Array.isArray(result.competitor_wins) ? result.competitor_wins as Array<Record<string, unknown>> : [];
  const recommendations = Array.isArray(result.recommendations) ? result.recommendations as Array<Record<string, unknown>> : [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
        {icon}
        <span className="text-xs font-semibold text-gray-800">{label}</span>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{summary}</p>

        {/* Engine visibility bars */}
        {engineTotals.length > 0 && (
          <div className="space-y-2">
            {engineTotals.slice(0, 5).map((engine, index) => {
              const score = typeof engine.avg_visibility === 'number' ? engine.avg_visibility : 0;
              const engineName = String(engine.engine || 'engine');
              return (
                <div key={engineName + index} className="flex items-center gap-2.5 text-[11px]">
                  <span className="w-28 truncate text-gray-600 font-medium">{engineName}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-gray-700 text-[10px]">
                    {score.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Competitor wins */}
        {competitorWins.length > 0 && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            {competitorWins.slice(0, 4).map((win, index) => (
              <div
                key={String(win.domain || index)}
                className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-gray-100 last:border-0 even:bg-gray-50/30"
              >
                <span className="text-gray-700 font-medium">{String(win.domain || 'unknown domain')}</span>
                <span className="text-amber-700 font-semibold">{String(win.citations || 0)} wins</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendation */}
        {recommendations.length > 0 && (
          <div className="flex items-start gap-2 bg-emerald-50/60 border border-emerald-200 rounded-lg px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-800 leading-relaxed">
              <span className="font-semibold text-emerald-900">Next move:</span>{' '}
              {String(recommendations[0].play || '')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
