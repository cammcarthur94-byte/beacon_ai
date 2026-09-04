/**
 * Standardized Industry & Category Taxonomy, Geographic Regions,
 * and Tone Dimensions for Beacon Brand Kit context injection.
 */

export interface TaxonomySector {
  id: string;
  name: string;
  categories: string[];
}

export const INDUSTRY_TAXONOMY: TaxonomySector[] = [
  {
    id: 'retail_apparel',
    name: 'Retail, Apparel & Consumer Goods',
    categories: [
      'Activewear & Athleisure',
      'Footwear & Athletic Shoes',
      'Luxury & Designer Fashion',
      'Consumer Electronics & Tech',
      'Beauty, Skincare & Cosmetics',
      'Home Goods & Lifestyle Furniture',
      'Outdoor Gear & Sporting Equipment',
    ],
  },
  {
    id: 'b2b_saas',
    name: 'B2B Software & Cloud Technology',
    categories: [
      'Enterprise SaaS & Productivity',
      'AI & Machine Learning Platforms',
      'Cloud Infrastructure & DevOps',
      'Cybersecurity & Compliance',
      'Data Analytics & Business Intelligence',
      'Developer Tooling & APIs',
      'MarTech & Customer Engagement',
    ],
  },
  {
    id: 'fintech_finance',
    name: 'Financial Services & FinTech',
    categories: [
      'Digital Banking & Neobanks',
      'Payment Processing & Gateways',
      'WealthTech & Investment Platforms',
      'InsurTech & Policy Management',
      'Corporate Spend & Expense Management',
      'Blockchain, Crypto & Web3',
    ],
  },
  {
    id: 'health_wellness',
    name: 'Healthcare, Wellness & Life Sciences',
    categories: [
      'Digital Health & Telemedicine',
      'Fitness, Longevity & Holistic Wellness',
      'Biotechnology & Clinical Research',
      'Medical Devices & Diagnostics',
      'Nutraceuticals & Functional Food',
    ],
  },
  {
    id: 'media_hospitality',
    name: 'Media, Travel & Hospitality',
    categories: [
      'Digital Media & Publishing',
      'Travel, Airlines & Booking',
      'Hospitality, Hotels & Resorts',
      'Food, Beverage & Fast Casual',
      'Entertainment & Streaming Platforms',
    ],
  },
  {
    id: 'professional_services',
    name: 'Professional Services & Consulting',
    categories: [
      'Management & Strategy Consulting',
      'Digital Marketing & PR Agencies',
      'LegalTech & Corporate Advisory',
      'Commercial Real Estate & PropTech',
    ],
  },
];

export const GEOGRAPHIC_REGIONS = [
  { id: 'global', label: 'Global / Worldwide' },
  { id: 'north_america', label: 'North America (US & Canada)' },
  { id: 'europe_uk', label: 'Europe & United Kingdom' },
  { id: 'apac', label: 'Asia-Pacific (APAC)' },
  { id: 'latam', label: 'Latin America (LATAM)' },
  { id: 'mea', label: 'Middle East & Africa (MEA)' },
] as const;

export const TONE_DIMENSIONS_CONFIG = [
  {
    key: 'formal_casual' as const,
    label: 'Formality',
    leftLabel: 'Formal & Corporate',
    rightLabel: 'Casual & Conversational',
    description: 'Dictates sentence structure, greetings, and executive posture',
  },
  {
    key: 'technical_accessible' as const,
    label: 'Technical Depth',
    leftLabel: 'Deep Technical & Spec-Driven',
    rightLabel: 'Accessible & Plainspoken',
    description: 'Determines density of industry jargon, acronyms, and engineering data',
  },
  {
    key: 'bold_understated' as const,
    label: 'Assertiveness',
    leftLabel: 'Bold & Disruptive',
    rightLabel: 'Understated & Measured',
    description: 'Controls strength of market-leader assertions and competitive claims',
  },
  {
    key: 'analytical_inspiring' as const,
    label: 'Inspiration vs Logic',
    leftLabel: 'Analytical & Empirical',
    rightLabel: 'Inspiring & Visionary',
    description: 'Balances data-backed proof points with emotional and aspirational hooks',
  },
];

export interface ToneTagCategory {
  category: string;
  description: string;
  tags: string[];
}

export const CATEGORIZED_TONE_TAGS: ToneTagCategory[] = [
  {
    category: 'Executive & Authority',
    description: 'Establish market leadership, institutional weight, and decisive clarity',
    tags: ['Authoritative', 'Crisp Executive', 'Institutional', 'Prestigious'],
  },
  {
    category: 'Mindset & Resonance',
    description: 'Connect emotionally through purpose, mindfulness, and elevated inspiration',
    tags: ['Mindful', 'Empowering', 'Visionary', 'Elevated'],
  },
  {
    category: 'Communication Style',
    description: 'Control interpersonal tone, jargon tolerance, and technical depth',
    tags: ['Direct', 'Technical', 'Data-Driven', 'Friendly & Accessible', 'Colleague-to-Colleague'],
  },
];

export const TONE_TAG_PRESETS = CATEGORIZED_TONE_TAGS.flatMap((c) => c.tags);

import type { NegativeExclusionItem } from '@/types/database.types';

/**
 * Normalizes negative keywords into structured items with severity weighting.
 */
export function normalizeNegativeKeywords(
  keywords?: (string | NegativeExclusionItem)[]
): NegativeExclusionItem[] {
  if (!keywords || !Array.isArray(keywords)) return [];
  return keywords.map((item) => {
    if (typeof item === 'string') {
      return { term: item, severity: 'strict' };
    }
    return {
      term: item.term,
      severity: item.severity === 'mild' ? 'mild' : 'strict',
    };
  });
}

/**
 * Formats negative exclusions into separate prompt instructions for LLMs.
 */
export function formatNegativeKeywordsForPrompt(
  keywords?: (string | NegativeExclusionItem)[]
): {
  strict: string[];
  mild: string[];
  promptText: string;
} {
  const items = normalizeNegativeKeywords(keywords);
  const strict = items.filter((i) => i.severity === 'strict').map((i) => i.term);
  const mild = items.filter((i) => i.severity === 'mild').map((i) => i.term);

  const parts: string[] = [];
  if (strict.length > 0) {
    parts.push(`Strict Dealbreakers (Zero Tolerance - NEVER mention or associate with brand): ${strict.join(', ')}`);
  }
  if (mild.length > 0) {
    parts.push(`Mild Avoidances (Steer clear / avoid unprompted mentions): ${mild.join(', ')}`);
  }

  return {
    strict,
    mild,
    promptText: parts.join(' | ') || 'None specified',
  };
}

/**
 * Human-readable pole interpretation for 4-axis tone sliders.
 */
export function interpretSliderPole(key: string, val: number): string {
  switch (key) {
    case 'formal_casual':
      if (val <= 25) return 'Rigidly Formal';
      if (val <= 45) return 'Polished Executive';
      if (val <= 60) return 'Balanced & Professional';
      if (val <= 80) return 'Conversational & Approachable';
      return 'Informal & Casual';

    case 'technical_accessible':
      if (val <= 25) return 'Deep Technical & Spec-Dense';
      if (val <= 45) return 'Industry Practitioner';
      if (val <= 60) return 'Grounded & Educative';
      if (val <= 80) return 'Clear & Plainspoken';
      return 'Broadly Accessible (Zero Jargon)';

    case 'bold_understated':
      if (val <= 25) return 'Disruptive & Category-Dominant';
      if (val <= 45) return 'Assertive & Confident';
      if (val <= 60) return 'Balanced Market Presence';
      if (val <= 80) return 'Measured & Credible';
      return 'Quiet Luxury & Understated';

    case 'analytical_inspiring':
      if (val <= 25) return 'Pure Empirical & Metric-Led';
      if (val <= 45) return 'Evidence & Proof-Focused';
      if (val <= 60) return 'Pragmatic & Purposeful';
      if (val <= 80) return 'Uplifting & Mission-Driven';
      return 'Visionary & Highly Aspirational';

    default:
      return `${val}/100`;
  }
}

/**
 * Compiles dimensional sliders and tone tags into a structured summary for LLM prompt injection.
 */
export function compileToneOfVoice(
  dimensions: {
    formal_casual: number;
    technical_accessible: number;
    bold_understated?: number;
    analytical_inspiring?: number;
  },
  tags: string[] = []
): string {
  const parts: string[] = [];

  // Formality
  if (dimensions.formal_casual < 35) {
    parts.push('Formal, structured, and authoritative');
  } else if (dimensions.formal_casual > 65) {
    parts.push('Conversational, relatable, and warm');
  } else {
    parts.push('Professional yet accessible');
  }

  // Technical Depth
  if (dimensions.technical_accessible < 35) {
    parts.push('rigorously technical with engineering-grade precision');
  } else if (dimensions.technical_accessible > 65) {
    parts.push('plainspoken, clear, and devoid of unnecessary jargon');
  } else {
    parts.push('technically grounded with clear explanations');
  }

  // Assertiveness
  if ((dimensions.bold_understated ?? 50) < 35) {
    parts.push('bold and market-defining');
  } else if ((dimensions.bold_understated ?? 50) > 65) {
    parts.push('understated, humble, and evidence-led');
  }

  // Inspiration
  if ((dimensions.analytical_inspiring ?? 50) > 65) {
    parts.push('inspiring and aspirational');
  } else if ((dimensions.analytical_inspiring ?? 50) < 35) {
    parts.push('analytical and empirically driven');
  }

  let summary = parts.join(', ');
  if (tags.length > 0) {
    summary += ` (Key traits: ${tags.join(', ')})`;
  }
  return summary;
}
