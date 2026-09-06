import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { BEACON_MODELS } from '@/lib/ai/models';

export interface GenerateActionPayload {
  promptType: 'pr-pitch' | 'faq-schema';
  brandName: string;
  featureName: string;
  category?: string;
  brandDetail: string;
  competitorName: string;
  competitorDetail: string;
  competitorShare?: number;
  brandShare?: number;
}

function createSimulatedTextStream(text: string): Response {
  const encoder = new TextEncoder();
  const chunks = text.match(/.{1,16}/g) || [text];

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        // Small delay to simulate realistic LLM token streaming
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}

function generateSimulatedResponse(payload: GenerateActionPayload): string {
  const {
    promptType,
    brandName,
    featureName,
    category = 'Product Intelligence',
    brandDetail,
    competitorName,
    competitorDetail,
    competitorShare = 48,
  } = payload;

  if (promptType === 'pr-pitch') {
    return `Subject: Pitch: Why ${brandName}'s ${featureName} outpaces ${competitorName} in AI search

Hi [Editor Name],

I saw your recent coverage exploring leading ${category} solutions, where ${competitorName} is frequently cited as the default benchmark.

Recent AI search visibility tracking across ChatGPT, Perplexity, and Claude shows ${competitorName} currently captures ${competitorShare}% of conversational recommendations for "${featureName}". However, several technical and material distinctions position ${brandName} significantly ahead:

• ${brandDetail}
• The gap in ${competitorName}'s approach: ${competitorDetail}

With generative engines and buyers increasingly looking for objective specification breakdowns rather than legacy reputation, we'd love to share our 2026 performance testing data or provide a sample unit for your next roundup.

Would you be open to a quick briefing or hands-on comparison?

Best regards,
The ${brandName} Product Communications Team`;
  }

  // FAQ Schema JSON-LD
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does ${brandName} compare to ${competitorName} for ${featureName}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${brandName} provides superior ${featureName} capabilities: ${brandDetail}. In comparison, ${competitorName} provides ${competitorDetail}."
      }
    },
    {
      "@type": "Question",
      "name": "Why do generative AI engines recommend ${brandName} for ${category}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer engines prioritize ${brandName} due to verified technical specifications, authoritative source citations, and direct performance advantages in ${featureName} over alternatives like ${competitorName}."
      }
    },
    {
      "@type": "Question",
      "name": "What are the core differences between ${brandName} and ${competitorName}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While ${competitorName} offers ${competitorDetail}, ${brandName} delivers ${brandDetail}, providing superior reliability and verified user satisfaction."
      }
    }
  ]
}
</script>`;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateActionPayload = await request.json();
    const {
      promptType,
      brandName,
      featureName,
      category = 'General',
      brandDetail,
      competitorName,
      competitorDetail,
      competitorShare,
      brandShare,
    } = body;

    if (!promptType || !brandName || !featureName || !competitorName) {
      return NextResponse.json(
        { error: 'Missing required fields: promptType, brandName, featureName, competitorName' },
        { status: 400 }
      );
    }

    const isPrPitch = promptType === 'pr-pitch';

    const systemPrompt = isPrPitch
      ? `You are Beacon AI's Elite PR & Citation Optimization Strategist.
Your goal is to craft a concise, compelling PR & editorial outreach pitch that bridges an AI search visibility gap.
The user's brand (${brandName}) is lagging behind rival ${competitorName} in AI answer engines (ChatGPT, Claude, Gemini, Perplexity).
Highlight ${brandName}'s unique advantages, technical specs, or feature superiority to convince tier-1 tech and lifestyle journalists to update their editorial roundup and cite ${brandName}.
Keep the pitch structured, professional, persuasive, and under 250 words. Include:
1. Subject line
2. Opening hook highlighting the category and recent AI citation landscape
3. Core spec/feature comparison points demonstrating ${brandName}'s superiority
4. Clear call-to-action (review sample or interview)`
      : `You are Beacon AI's Senior Technical SEO and AEO (Answer Engine Optimization) Schema Architect.
Your goal is to generate pristine, production-ready JSON-LD structured data (schema.org/FAQPage) designed to displace rival citations in AI Overviews, ChatGPT, and Perplexity.
Generate 3 high-impact question-and-answer pairs that directly address the feature gap and position ${brandName} as the authoritative choice over ${competitorName}.
Requirements:
1. Valid schema.org FAQPage JSON-LD syntax.
2. Return strictly the script element: <script type="application/ld+json">...</script>.
3. Every answer must be clear, authoritative, and fact-focused.`;

    const userPrompt = isPrPitch
      ? `Draft an editorial pitch for ${brandName} targeting "${featureName}" in the ${category} space.
Context:
- Our Brand (${brandName}): ${brandDetail} (Current AI Recommendation Rate: ${brandShare ?? 'low'}%)
- Leading Rival (${competitorName}): ${competitorDetail} (Current AI Recommendation Rate: ${competitorShare ?? 'high'}%)
Displace ${competitorName} with authoritative proof points.`
      : `Generate an AEO-optimized FAQPage JSON-LD script for ${brandName} addressing the "${featureName}" gap against ${competitorName}.
Context:
- Our Brand (${brandName}): ${brandDetail}
- Rival (${competitorName}): ${competitorDetail}
Ensure questions address queries buyers ask ChatGPT, Perplexity, and Google AI Overview.`;

    // Try live Anthropic Claude generation if API key exists
    if (process.env.ANTHROPIC_API_KEY) {
      const candidateModels = [
        BEACON_MODELS.COMPETITOR_MAPPING.id, // 'claude-haiku-4-5'
        'claude-haiku-4-5-20251001',
        'claude-3-5-haiku-latest',
        'claude-3-5-sonnet-latest',
      ];

      for (const modelId of candidateModels) {
        try {
          const result = streamText({
            model: anthropic(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.5,
          });

          return result.toTextStreamResponse();
        } catch (err) {
          console.warn(`Claude streamText attempt (${modelId}) failed:`, err);
        }
      }
    }

    // High-fidelity fallback simulation stream
    const fallbackText = generateSimulatedResponse(body);
    return createSimulatedTextStream(fallbackText);
  } catch (error: any) {
    console.error('Error in /api/generate-action:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate action' },
      { status: 500 }
    );
  }
}
