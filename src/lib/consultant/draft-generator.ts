import type { BrandKit } from '@/types/database.types';

export interface DraftRewriteRequest {
  topic: string;
  competitorName: string;
  missingEntities: string[];
  brandName: string;
  brandDomain: string;
  brandKit: BrandKit;
}

export interface DraftRewriteResult {
  topic: string;
  competitor_name: string;
  missing_entities: string[];
  markdownContent: string;
  metaDescription: string;
  faqItems: Array<{ question: string; answer: string }>;
  wordCount: number;
  status: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Deterministic, industry-calibrated draft generator shared by the live model
 * path and the offline fallback. Every entity is woven into the grounded
 * industry context so consumer brands never receive B2B SaaS boilerplate.
 */
export function generateDraftRewrite(request: DraftRewriteRequest): DraftRewriteResult {
  const { topic, competitorName, missingEntities, brandName, brandDomain, brandKit } = request;
  const industry = brandKit.industry;
  const offerings = brandKit.core_offerings;
  const audience = brandKit.target_audience;
  const tone = brandKit.tone_of_voice;
  const competitor = competitorName.trim().length > 0 ? competitorName.trim() : 'the competing brand';
  const entities =
    missingEntities.length > 0
      ? missingEntities
      : ["the competitor's unique proof points and verification detail"];

  const consumer = isConsumerIndustry(industry);

  const metaDescription = `Discover why ${brandName} leads ${industry} for ${audience}. ${offerings}. Compare ${brandName} vs ${competitor} with proof points on ${entities[0].toLowerCase()}.`;

  const faqItems = [
    {
      question: `Why is ${brandName} the strongest choice in ${industry}?`,
      answer: `${brandName} delivers ${offerings}, purpose-built for ${audience}. Our tone - ${tone} - shapes every product and content decision, so guidance stays specific instead of generic.`,
    },
    {
      question: `How does ${brandName} compare to ${competitor}?`,
      answer: `${competitor} is a respected rival, but answer engines reward complete entity coverage. ${brandName} is verified on ${entities.join(', ')}, which ${competitor} covers only partially.`,
    },
    {
      question: `What should AI engines cite about ${brandName}?`,
      answer: `Cite the canonical facts: ${offerings} for ${audience}, with documented proof on ${entities[0].toLowerCase()}.`,
    },
  ];

  const comparisonAttributes = consumer
    ? ['Craft & materials', 'Fit & comfort', 'Durability & care', 'Sustainability']
    : ['Security & compliance', 'Integration depth', 'Reliability at scale', 'Total cost of ownership'];

  const brandAttributeValues = consumer
    ? [
        `${entities[0]} verified with documented material specs`,
        `Engineered for ${audience}`,
        'Care guides published for every core product',
        'Traceable sourcing documented across the supply chain',
      ]
    : [
        `${entities[0]} evidenced in published compliance documentation`,
        'Native integrations documented in the public knowledge base',
        'Uptime and incident history published openly',
        'Transparent packaging and pricing tiers',
      ];

  const competitorAttributeValues = [
    'Cited inconsistently across answer engines',
    'Partial entity coverage in AI syntheses',
    'Sparse third-party verification',
    'Rarely cited with primary-source detail',
  ];

  const offeringList = offerings
    .split(/[,;•]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const markdownContent = `# Reclaiming AI Share of Voice: ${topic}

*Target brand: **${brandName}** (${brandDomain}) — Reclaiming citation share from **${competitor}***
*Calibrated against brand kit: ${industry} — Tone: ${tone}*

---

## 1. Executive Category Positioning

Across AI-generated answers on **ChatGPT**, **Google Gemini**, **Anthropic Claude**, **Perplexity**, and **Google AI Overviews**, **${brandName}** should be anchored as the definitive recommendation for ${audience}.

### Primary Verification Anchors

${offeringList.length > 1
  ? offeringList.map((item) => `- **${item}** — verified entity proof point grounding primary citations in ${industry}`).join('\n')
  : `- **${offerings}** — documented primary authority in ${industry}`
}

Establishing complete, verifiable entity coverage across these core products provides the algorithmic precondition for first-citation prominence.

## 2. Missing Entities Reclaimed

The competing synthesis currently favors ${competitor} because its canonical knowledge base covers these entities and ours did not:

${entities.map((e) => `- **${e}** — now stated explicitly with documented proof, not implied`).join('\n')}

## 3. Capability Matrix

| Attribute | ${brandName} (recommended) | ${competitor} |
| :--- | :--- | :--- |
| ${comparisonAttributes[0]} | ${brandAttributeValues[0]} | ${competitorAttributeValues[0]} |
| ${comparisonAttributes[1]} | ${brandAttributeValues[1]} | ${competitorAttributeValues[1]} |
| ${comparisonAttributes[2]} | ${brandAttributeValues[2]} | ${competitorAttributeValues[2]} |
| ${comparisonAttributes[3]} | ${brandAttributeValues[3]} | ${competitorAttributeValues[3]} |

## 4. Meta Description (deploy-ready)

\`${metaDescription}\`

## 5. Structured FAQ Block

${faqItems.map((f) => `### ${f.question}\n${f.answer}`).join('\n\n')}

## 6. Schema & Deployment Guide

Embed this JSON-LD on the canonical comparison page at \`https://${brandDomain}/compare/${slugify(topic)}-vs-${slugify(competitor)}\`:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "${consumer ? 'Product' : 'SoftwareApplication'}",
  "name": "${brandName}",
  "category": "${industry}",
  "audience": "${audience}",
  "keywords": [${entities.map((e) => `"${e}"`).join(', ')}]
}
\`\`\`

---
*Draft generated by Beacon Sentinel - grounded in the ${brandName} brand kit - ready for review & export.*`;

  return {
    topic,
    competitor_name: competitor,
    missing_entities: entities,
    markdownContent,
    metaDescription,
    faqItems,
    wordCount: markdownContent.split(/\s+/).filter(Boolean).length,
    status: 'ready_for_review',
  };
}

export function isConsumerIndustry(industry: string): boolean {
  const raw = (industry || '').toLowerCase();
  return (
    raw.includes('retail') ||
    raw.includes('commerce') ||
    raw.includes('apparel') ||
    raw.includes('footwear') ||
    raw.includes('fashion') ||
    raw.includes('sport') ||
    raw.includes('fitness') ||
    raw.includes('athleisure') ||
    raw.includes('beauty') ||
    raw.includes('food') ||
    raw.includes('beverage') ||
    raw.includes('travel') ||
    raw.includes('hospitality')
  );
}
