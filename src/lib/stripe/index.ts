import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key', {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'Beacon GEO Platform',
    version: '1.0.0',
  },
});

export interface BillingPlan {
  id: 'starter' | 'pro' | 'growth' | 'enterprise';
  name: string;
  price: string;
  monthlyPrice: number;
  auditLimit: number;
  description: string;
  features: string[];
  stripePriceId?: string;
}

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Tier',
    price: '$0',
    monthlyPrice: 0,
    auditLimit: 20,
    description: 'Essential answer engine observability for growing brands.',
    features: [
      '20 scheduled prompt audits / mo',
      'ChatGPT, Gemini, Claude & Perplexity tracking',
      '30-day Share of Voice analytics',
      'Daily execution cadence',
      'Community support',
    ],
  },
  {
    id: 'growth',
    name: 'Pro Tier',
    price: '$99',
    monthlyPrice: 99,
    auditLimit: 100,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID || 'price_growth_test',
    description: 'Autonomous GEO intelligence and automated competitor displacement.',
    features: [
      '100 scheduled prompt audits / mo',
      'Google AI Overviews tracking (SERP)',
      'Proactive visibility drop email alerts (Resend)',
      'Autonomous Coworker AI Agent (`draftRewrite`)',
      'Unlimited AI Strategy Audit Reports',
      'Hourly execution options',
      'Priority email & Slack support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Tier',
    price: '$399',
    monthlyPrice: 399,
    auditLimit: 500,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_test',
    description: 'Full-scale generative visibility domination and dedicated strategic consulting.',
    features: [
      '500 scheduled prompt audits / mo',
      'Custom LLM temperature & grounding controls',
      'Multi-team workspaces & RLS tenants',
      'Real-time automated content syndication hooks',
      'Dedicated GEO account strategist',
      '99.9% uptime SLA & custom billing',
    ],
  },
];
