import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

interface EvaluateMentionParams {
  responseText: string;
  brandName: string;
  domain: string;
}

interface MentionResult {
  isMentioned: boolean;
  method: 'regex' | 'llm' | 'none';
  reasoning?: string;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .trim();
}

export async function evaluateMention({
  responseText,
  brandName,
  domain,
}: EvaluateMentionParams): Promise<MentionResult> {
  if (!responseText) {
    return { isMentioned: false, method: 'none' };
  }

  const sanitizedBrand = escapeRegex(brandName.trim());
  const sanitizedDomain = escapeRegex(cleanDomain(domain));

  const brandPattern = new RegExp(`\\b${sanitizedBrand}\\b`, 'i');
  const domainPattern = new RegExp(sanitizedDomain, 'i');

  if (brandPattern.test(responseText) || (sanitizedDomain && domainPattern.test(responseText))) {
    return {
      isMentioned: true,
      method: 'regex',
    };
  }

  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: z.object({
        isMentioned: z.boolean().describe(
          'Whether the target brand or website is explicitly cited, listed, recommended, or discussed as a relevant entity in the text.'
        ),
        reasoning: z.string().describe(
          'A concise 1-sentence explanation of why the brand was or was not considered mentioned.'
        ),
      }),
      prompt: `
You are an expert AI visibility evaluator. Analyze the following AI-generated search result and determine if the target entity is recommended, listed, cited, or explicitly discussed.

Target Brand: "${brandName}"
Target Domain: "${domain}"

Text to analyze:
"""
${responseText}
"""
`,
    });

    return {
      isMentioned: object.isMentioned,
      method: 'llm',
      reasoning: object.reasoning,
    };
  } catch (error) {
    console.error('Error running Gemini evaluation fallback:', error);
    return {
      isMentioned: false,
      method: 'none',
      reasoning: 'Evaluation failed due to LLM provider error.',
    };
  }
}
