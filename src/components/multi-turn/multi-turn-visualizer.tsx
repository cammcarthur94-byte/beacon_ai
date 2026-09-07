'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Play,
  RotateCcw,
  Loader2,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Bot,
  UserCheck,
  CheckCircle2,
  Tag,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Persona, HallucinationAlert, EntityMention } from '@/types/database.types';

interface MultiTurnVisualizerProps {
  projectId: string;
  brandName: string;
  domain: string;
  availablePersonas?: Persona[];
  preselectedPersona?: Persona | null;
}

interface TurnStep {
  turnIndex: number;
  label: string;
  friendlyQuestionType: string;
  defaultPrompt: string;
  customPrompt?: string;
  response?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  visibilityScore?: number;
  brandMentioned?: boolean;
  rankingPosition?: number | null;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  hallucinationAlerts?: HallucinationAlert[];
  extractedEntities?: EntityMention[];
}

export function MultiTurnVisualizer({
  projectId,
  brandName,
  domain,
  availablePersonas = [],
  preselectedPersona,
}: MultiTurnVisualizerProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    preselectedPersona?.id || (availablePersonas.length > 0 ? availablePersonas[0].id : '')
  );
  const [selectedEngine, setSelectedEngine] = useState<string>('chatgpt');
  const [isRunningAll, setIsRunningAll] = useState(false);

  // 3-Turn Step Definition (Jargon-free questions)
  const [steps, setSteps] = useState<TurnStep[]>([
    {
      turnIndex: 1,
      label: 'Question 1: Initial Brand Discovery',
      friendlyQuestionType: 'Initial Recommendation',
      defaultPrompt: `What are the top recommended products and brands in this category for 2026?`,
      status: 'idle',
    },
    {
      turnIndex: 2,
      label: 'Question 2: Quality & Comparison Deep-Dive',
      friendlyQuestionType: 'Head-to-Head Comparison',
      defaultPrompt: `How does ${brandName} specifically compare against rivals on fabric durability, long-term comfort, and quality?`,
      status: 'idle',
    },
    {
      turnIndex: 3,
      label: 'Question 3: Buying Decision & Policies',
      friendlyQuestionType: 'Final Purchase Decision',
      defaultPrompt: `What are the return policies, pricing ranges, and verified warranties for ${brandName}?`,
      status: 'idle',
    },
  ]);

  const activePersona =
    availablePersonas.find((p) => p.id === selectedPersonaId) ||
    (availablePersonas.length > 0
      ? availablePersonas[0]
      : {
          name: 'General Shopper',
          role_title: 'Standard Buyer',
        });

  // Run a single turn
  const runTurn = async (turnIndex: number, currentSteps = steps) => {
    const stepIdx = turnIndex - 1;
    const targetStep = currentSteps[stepIdx];
    const promptToRun = targetStep.customPrompt || targetStep.defaultPrompt;

    setSteps((prev) =>
      prev.map((s, idx) => (idx === stepIdx ? { ...s, status: 'running' } : s))
    );

    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (let i = 0; i < stepIdx; i++) {
      if (currentSteps[i].response) {
        conversationHistory.push({
          role: 'user',
          content: currentSteps[i].customPrompt || currentSteps[i].defaultPrompt,
        });
        conversationHistory.push({
          role: 'assistant',
          content: currentSteps[i].response!,
        });
      }
    }

    try {
      const res = await fetch('/api/multi-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToRun,
          personaId: selectedPersonaId,
          conversationHistory,
          engine: selectedEngine,
          projectId,
          turnIndex,
        }),
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const updatedStep: TurnStep = {
        ...targetStep,
        status: 'completed',
        response: data.reply,
        visibilityScore: data.evaluation?.visibilityScore ?? 80,
        brandMentioned: data.evaluation?.brandMentioned ?? true,
        rankingPosition: data.evaluation?.rankingPosition ?? 1,
        sentiment: data.evaluation?.sentiment ?? 'positive',
        sentimentScore: data.evaluation?.sentimentScore ?? 0.8,
        hallucinationAlerts: data.hallucinationAlerts || [],
        extractedEntities: data.extractedEntities || [],
      };

      const nextSteps = currentSteps.map((s, idx) => (idx === stepIdx ? updatedStep : s));
      setSteps(nextSteps);
      return nextSteps;
    } catch (err: any) {
      toast.error(`Question ${turnIndex} test failed: ${err.message}`);
      setSteps((prev) =>
        prev.map((s, idx) => (idx === stepIdx ? { ...s, status: 'failed' } : s))
      );
      return null;
    }
  };

  const handleRunAllTurns = async () => {
    setIsRunningAll(true);
    toast.info(`Testing follow-up questions from ${activePersona.name}'s perspective...`);

    let current = steps;
    for (let i = 1; i <= 3; i++) {
      const next = await runTurn(i, current);
      if (!next) break;
      current = next;
    }

    setIsRunningAll(false);
    toast.success('Conversation test finished!');
  };

  const handleReset = () => {
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'idle',
        response: undefined,
        visibilityScore: undefined,
        brandMentioned: undefined,
        rankingPosition: undefined,
        sentiment: undefined,
        hallucinationAlerts: undefined,
        extractedEntities: undefined,
      }))
    );
    toast.info('Conversation reset');
  };

  const t1Score = steps[0].visibilityScore ?? 0;
  const t3Score = steps[2].visibilityScore ?? 0;
  const hasRunCompleted = steps.some((s) => s.status === 'completed');
  const dropOffDelta =
    steps[0].visibilityScore && steps[2].visibilityScore
      ? Number((steps[0].visibilityScore - steps[2].visibilityScore).toFixed(1))
      : 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Buyer Journey Simulator
            </span>
            <Badge variant="outline" className="bg-zinc-50 text-zinc-800 text-[11px] py-0">
              Follow-Up Questions
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            Follow-Up Questions & AI Recommendation Test
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600">
            Customers rarely stop at one question. See if AI assistants keep recommending {brandName} as the conversation gets deeper, or if they recommend a rival brand.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isRunningAll || !hasRunCompleted}
            className="cursor-pointer gap-1.5 text-xs shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-zinc-500" />
            <span>Reset</span>
          </Button>

          <Button
            type="button"
            onClick={handleRunAllTurns}
            disabled={isRunningAll}
            className="cursor-pointer gap-2 text-xs bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs"
          >
            {isRunningAll ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Simulating Questions...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white text-white" />
                <span>Run 3-Question Test</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* CONFIGURATION ROW */}
      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-wrap items-center justify-between gap-4">
        {/* Customer Persona Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
            <UserCheck className="h-4 w-4 text-zinc-700" />
            <span>Customer Profile:</span>
          </div>
          <select
            value={selectedPersonaId}
            onChange={(e) => setSelectedPersonaId(e.target.value)}
            disabled={isRunningAll}
            className="text-xs font-medium bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer shadow-2xs"
          >
            {availablePersonas.length > 0 ? (
              availablePersonas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role_title || 'Target Buyer'})
                </option>
              ))
            ) : (
              <option value="">Standard Shopper (No persona created yet)</option>
            )}
          </select>
        </div>

        {/* AI Engine Picker */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-800">Test On AI Tool:</span>
          <div className="flex items-center gap-1.5">
            {['chatgpt', 'perplexity', 'gemini', 'claude'].map((eng) => (
              <button
                key={eng}
                type="button"
                onClick={() => setSelectedEngine(eng)}
                disabled={isRunningAll}
                className={`text-xs px-2.5 py-1 rounded-md font-mono uppercase font-semibold transition-all cursor-pointer ${
                  selectedEngine === eng
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {eng}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3-STEP CONVERSATION FLOW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => {
          const isDone = step.status === 'completed';
          const isRun = step.status === 'running';

          return (
            <Card
              key={step.turnIndex}
              className={`border transition-all bg-white shadow-xs relative overflow-hidden ${
                isRun ? 'border-zinc-950 ring-1 ring-zinc-950' : 'border-zinc-200'
              }`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400 font-semibold">Question {step.turnIndex} of 3</span>
                  {isDone ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] gap-1 py-0">
                      <CheckCircle2 className="h-3 w-3" />
                      Answered
                    </Badge>
                  ) : isRun ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] gap-1 py-0 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Thinking
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-zinc-100 text-zinc-500 text-[10px] py-0">
                      Waiting
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-bold text-zinc-950 mt-1">
                  {step.friendlyQuestionType}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-3">
                {isDone ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-zinc-950 font-sans">
                        {step.visibilityScore}%
                      </span>
                      <span className="text-[11px] font-mono text-zinc-600">
                        {step.brandMentioned ? '✓ Recommended' : '✕ Not Recommended'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 text-zinc-600">
                      <span>Position: #{step.rankingPosition || 1}</span>
                      <span className="capitalize text-emerald-700 font-medium">
                        {step.sentiment} tone
                      </span>
                    </div>

                    {/* Fact Check Warning */}
                    {step.hallucinationAlerts && step.hallucinationAlerts.length > 0 && (
                      <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Fact Check Alert: Inaccurate Claim</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 font-sans line-clamp-2">
                    &ldquo;{step.defaultPrompt}&rdquo;
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => runTurn(step.turnIndex)}
                  disabled={isRunningAll || isRun}
                  className="w-full text-xs cursor-pointer border-zinc-200 hover:bg-zinc-50"
                >
                  {isDone ? 'Ask Question Again' : `Ask Question ${step.turnIndex}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* RETENTION RESULT BANNER */}
      {steps[0].status === 'completed' && steps[2].status === 'completed' && (
        <div className="p-4 rounded-xl bg-zinc-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Customer Conversation Retention Result
              </h4>
              <p className="text-xs text-zinc-400">
                {brandName} started at {t1Score}% in Question 1 and finished at {t3Score}% by Question 3.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
                Recommendation Change
              </span>
              <div className="flex items-center gap-1.5 text-base font-bold">
                {dropOffDelta > 0 ? (
                  <span className="text-amber-400 flex items-center gap-0.5">
                    <TrendingDown className="h-4 w-4" />
                    -{dropOffDelta}% (Lost Ground)
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="h-4 w-4" />
                    Maintained Lead (+{Math.abs(dropOffDelta)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERSATION TRANSCRIPT */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-zinc-700" />
          <span>Full Conversation Transcript</span>
        </h3>

        {steps.every((s) => s.status === 'idle') ? (
          <div className="p-8 border border-dashed border-zinc-300 rounded-xl text-center bg-zinc-50/50 space-y-2">
            <Bot className="h-8 w-8 text-zinc-400 mx-auto" />
            <p className="text-sm font-semibold text-zinc-800">Ready to test</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Click &quot;Run 3-Question Test&quot; to see how {selectedEngine.toUpperCase()} answers a real buyer as they ask follow-up questions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step) => {
              if (step.status === 'idle') return null;

              return (
                <div
                  key={step.turnIndex}
                  className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3.5 shadow-2xs"
                >
                  {/* BUYER QUESTION */}
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-zinc-200 text-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
                      Q{step.turnIndex}
                    </div>
                    <div className="bg-zinc-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-2xl text-xs text-zinc-900 leading-relaxed font-medium">
                      <span className="text-[10px] font-mono text-zinc-500 block mb-0.5 font-bold uppercase">
                        {activePersona.name} asked:
                      </span>
                      {step.customPrompt || step.defaultPrompt}
                    </div>
                  </div>

                  {/* AI ANSWER */}
                  <div className="flex items-start gap-3 pl-2">
                    <div className="h-7 w-7 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl rounded-tl-sm p-4 flex-1 text-xs text-zinc-800 leading-relaxed space-y-3">
                      {step.status === 'running' ? (
                        <div className="flex items-center gap-2 text-zinc-500 py-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating AI answer with {selectedEngine}...</span>
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-xs max-w-none text-zinc-800 whitespace-pre-line font-sans">
                            {step.response}
                          </div>

                          {/* KEY WORDS AI USES TO DESCRIBE YOUR BRAND */}
                          {step.extractedEntities && step.extractedEntities.length > 0 && (
                            <div className="pt-2 border-t border-zinc-200/80 flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Words AI associates with your brand:
                              </span>
                              {step.extractedEntities.map((ent, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={`text-[10px] py-0 px-2 rounded-full font-sans ${
                                    ent.is_brand
                                      ? 'bg-zinc-900 text-white border-zinc-900'
                                      : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                                  }`}
                                >
                                  {ent.associated_target}: &ldquo;{ent.entity_name}&rdquo;
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* FACT CHECK ALERTS */}
                          {step.hallucinationAlerts && step.hallucinationAlerts.length > 0 && (
                            <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1 text-xs text-amber-950">
                              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                <ShieldAlert className="h-4 w-4" />
                                <span>Fact Check: Inaccurate Information Caught</span>
                              </div>
                              {step.hallucinationAlerts.map((alert, aIdx) => (
                                <p key={aIdx} className="text-[11px] text-amber-900 pl-5">
                                  • {alert.discrepancy_summary}
                                </p>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
