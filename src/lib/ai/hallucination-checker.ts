import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import type { BrandTruth, HallucinationAlert, HallucinationSeverity } from '@/types/database.types';

const discrepancySchema = z.object({
  discrepancies: z.array(
    z.object({
      truthId: z.string().optional().describe('ID of the conflicting brand truth statement, if applicable'),
      claimTopic: z.string().describe('The topic of the claim, e.g. Pricing, Security, Features, Availability'),
      hallucinatedStatement: z.string().describe('The exact or paraphrased statement from the LLM text that is factually inaccurate'),
      groundTruthContext: z.string().describe('The verified ground-truth fact that contradicts the hallucinated claim'),
      discrepancySummary: z.string().describe('1-2 sentence explanation of why this is a hallucination or mischaracterization'),
      severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Severity level based on impact on buyer trust or revenue'),
    })
  ),
});

export interface CheckHallucinationsParams {
  responseText: string;
  brandName: string;
  brandTruths: BrandTruth[];
  projectId: string;
  resultId?: string;
  engine: string;
}

/**
 * Compares an LLM response against the brand's verified ground truth knowledge base.
 * Flags factual discrepancies (e.g. wrong pricing, missing features, false claims) and logs alerts.
 */
export async function checkHallucinations(
  params: CheckHallucinationsParams
): Promise<HallucinationAlert[]> {
  const { responseText, brandName, brandTruths, projectId, resultId, engine } = params;

  if (!brandTruths || brandTruths.length === 0 || !responseText.trim()) {
    return [];
  }

  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let flaggedDiscrepancies: Array<{
    truthId?: string;
    claimTopic: string;
    hallucinatedStatement: string;
    groundTruthContext: string;
    discrepancySummary: string;
    severity: HallucinationSeverity;
  }> = [];

  const hasApiKey = Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY
  );

  if (hasApiKey) {
    try {
      const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
        ? google('gemini-2.5-flash')
        : openai('gpt-4o-mini');

      const truthsContext = brandTruths
        .map(
          (t, i) =>
            `[Truth #${i + 1} | ID: ${t.id} | Category: ${t.category}]\nTopic: ${t.claim_topic}\nVerified Fact: ${t.ground_truth_statement}\nContradiction Triggers: ${t.contradiction_triggers?.join(', ') || 'None'}`
        )
        .join('\n\n');

      const evaluationPrompt = `You are an expert fact-checker evaluating an AI engine's response about the brand "${brandName}".

Compare the following AI search response against our verified Ground Truth database. Identify any factual errors, pricing hallucinations, missing capabilities that the brand actually has, non-existent features attributed to the brand, or outdated compliance claims.

VERIFIED BRAND GROUND TRUTHS:
${truthsContext}

AI ENGINE SEARCH RESPONSE TO EVALUATE:
"""
${responseText}
"""

Instructions:
1. Only flag clear factual contradictions or misleading inaccuracies concerning ${brandName}.
2. If the AI is accurate or makes harmless high-level generalizations that do not contradict our facts, do NOT flag them.
3. Assign severity:
   - 'critical': Inaccurate pricing, non-compliant security claims (e.g., claiming lack of SOC-2 or HIPAA when certified), or false claims of discontinuation.
   - 'high': Stating a core feature does not exist when it does, or false limitations.
   - 'medium': Outdated tier naming, minor feature discrepancy.
   - 'low': Minor phrasing ambiguity.`;

      const result = await generateObject({
        model,
        schema: discrepancySchema,
        prompt: evaluationPrompt,
      });

      flaggedDiscrepancies = result.object.discrepancies.map((d) => ({
        truthId: d.truthId,
        claimTopic: d.claimTopic,
        hallucinatedStatement: d.hallucinatedStatement,
        groundTruthContext: d.groundTruthContext,
        discrepancySummary: d.discrepancySummary,
        severity: d.severity as HallucinationSeverity,
      }));
    } catch (err) {
      console.warn('LLM hallucination evaluation error, falling back to heuristic scanning:', err);
      flaggedDiscrepancies = runHeuristicHallucinationScan(responseText, brandTruths);
    }
  } else {
    // Deterministic heuristic fallback when no LLM API keys are provided
    flaggedDiscrepancies = runHeuristicHallucinationScan(responseText, brandTruths);
  }

  // Persist alerts to Supabase if connected
  const createdAlerts: HallucinationAlert[] = [];

  for (const item of flaggedDiscrepancies) {
    const alertRecord: HallucinationAlert = {
      id: 'alert-' + Math.random().toString(36).substring(2, 9),
      project_id: projectId,
      truth_id: item.truthId || null,
      result_id: resultId || 'simulated-result',
      engine,
      discrepancy_summary: item.discrepancySummary,
      hallucinated_statement: item.hallucinatedStatement,
      ground_truth_context: item.groundTruthContext,
      severity: item.severity,
      status: 'unreviewed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const { data, error } = await supabase
          .from('hallucination_alerts')
          .insert({
            project_id: projectId,
            truth_id: item.truthId || null,
            result_id: resultId || 'simulated-result',
            engine,
            discrepancy_summary: item.discrepancySummary,
            hallucinated_statement: item.hallucinatedStatement,
            ground_truth_context: item.groundTruthContext,
            severity: item.severity,
            status: 'unreviewed',
          })
          .select('*')
          .single();

        if (data && !error) {
          createdAlerts.push(data as any);
          continue;
        }
      } catch (dbErr) {
        console.warn('Failed to persist hallucination alert to database:', dbErr);
      }
    }

    createdAlerts.push(alertRecord);
  }

  return createdAlerts;
}

/**
 * Fast keyword & regex contradiction scanner as an instant heuristic fallback.
 */
function runHeuristicHallucinationScan(
  responseText: string,
  brandTruths: BrandTruth[]
): Array<{
  truthId?: string;
  claimTopic: string;
  hallucinatedStatement: string;
  groundTruthContext: string;
  discrepancySummary: string;
  severity: HallucinationSeverity;
}> {
  const discrepancies: any[] = [];
  const lowerText = responseText.toLowerCase();

  for (const truth of brandTruths) {
    if (!truth.is_active) continue;

    // Check contradiction triggers
    if (truth.contradiction_triggers && truth.contradiction_triggers.length > 0) {
      for (const trigger of truth.contradiction_triggers) {
        const trigLower = trigger.toLowerCase().trim();
        if (trigLower && lowerText.includes(trigLower)) {
          discrepancies.push({
            truthId: truth.id,
            claimTopic: truth.claim_topic,
            hallucinatedStatement: `AI output references prohibited claim: "${trigger}"`,
            groundTruthContext: truth.ground_truth_statement,
            discrepancySummary: `Engine asserted "${trigger}" which directly contradicts verified fact for ${truth.claim_topic}.`,
            severity: truth.category === 'pricing' || truth.category === 'compliance' ? 'critical' : 'high',
          });
          break;
        }
      }
    }
  }

  return discrepancies;
}
