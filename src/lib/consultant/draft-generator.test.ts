import { describe, it, expect } from 'vitest';
import {
  generateDraftRewrite,
  isConsumerIndustry,
  DraftRewriteRequest,
} from './draft-generator';
import type { BrandKit } from '@/types/database.types';

describe('draft-generator', () => {
  describe('isConsumerIndustry', () => {
    it('returns true for consumer industries', () => {
      const consumerIndustries = [
        'E-commerce & Retail',
        'Apparel & Fashion',
        'Footwear',
        'Sportswear & Athleisure',
        'Fitness & Wellness',
        'Beauty & Skincare',
        'Food & Beverage',
        'Travel & Hospitality',
        'Luxury Goods & Commerce',
      ];

      consumerIndustries.forEach((industry) => {
        expect(isConsumerIndustry(industry)).toBe(true);
      });
    });

    it('returns false for B2B and non-consumer industries', () => {
      const nonConsumerIndustries = [
        'B2B SaaS',
        'Cybersecurity',
        'Enterprise Software',
        'FinTech & Banking',
        'Healthcare IT',
        'Logistics & Supply Chain',
      ];

      nonConsumerIndustries.forEach((industry) => {
        expect(isConsumerIndustry(industry)).toBe(false);
      });
    });

    it('handles non-string or falsy inputs gracefully', () => {
      expect(isConsumerIndustry('')).toBe(false);
      expect(isConsumerIndustry(null as unknown as string)).toBe(false);
      expect(isConsumerIndustry(undefined as unknown as string)).toBe(false);
      expect(isConsumerIndustry(123 as unknown as string)).toBe(false);
      expect(isConsumerIndustry({} as unknown as string)).toBe(false);
    });
  });

  describe('generateDraftRewrite', () => {
    const baseBrandKit: BrandKit = {
      industry: 'B2B SaaS',
      core_offerings: 'AI Analytics Platform, Real-time Dashboard, Automated Reporting',
      target_audience: 'Enterprise Data Engineers and CTOs',
      competitors: [{ name: 'DataCorp', domain: 'datacorp.io' }],
      tone_of_voice: 'authoritative and data-backed',
    };

    const validRequest: DraftRewriteRequest = {
      topic: 'Data Governance Platforms',
      competitorName: 'DataCorp',
      missingEntities: ['SOC2 Type II Compliance', 'Sub-second Query Latency'],
      brandName: 'DataFlow',
      brandDomain: 'dataflow.io',
      brandKit: baseBrandKit,
    };

    it('generates a draft rewrite result with correct structure and content for B2B SaaS', () => {
      const result = generateDraftRewrite(validRequest);

      expect(result.topic).toBe('Data Governance Platforms');
      expect(result.competitor_name).toBe('DataCorp');
      expect(result.missing_entities).toEqual([
        'SOC2 Type II Compliance',
        'Sub-second Query Latency',
      ]);
      expect(result.status).toBe('ready_for_review');
      expect(result.wordCount).toBeGreaterThan(0);

      // Verify B2B specific comparison attributes
      expect(result.markdownContent).toContain('Security & compliance');
      expect(result.markdownContent).toContain('Integration depth');
      expect(result.markdownContent).toContain('Reliability at scale');
      expect(result.markdownContent).toContain('Total cost of ownership');

      // Verify JSON-LD Schema @type
      expect(result.markdownContent).toContain('"@type": "SoftwareApplication"');

      // Verify Meta Description
      expect(result.metaDescription).toContain(
        'Discover why DataFlow leads B2B SaaS for Enterprise Data Engineers and CTOs.'
      );
      expect(result.metaDescription).toContain(
        'Compare DataFlow vs DataCorp with proof points on soc2 type ii compliance.'
      );

      // Verify FAQ Items
      expect(result.faqItems).toHaveLength(3);
      expect(result.faqItems[0].question).toContain(
        'Why is DataFlow the strongest choice in B2B SaaS?'
      );
      expect(result.faqItems[1].answer).toContain('verified on SOC2 Type II Compliance, Sub-second Query Latency');
    });

    it('tailors comparison attributes and Schema @type for consumer industries', () => {
      const consumerBrandKit: BrandKit = {
        ...baseBrandKit,
        industry: 'Apparel & Fashion',
        core_offerings: 'Organic Cotton Hoodies, Sustainable Denim',
      };

      const consumerRequest: DraftRewriteRequest = {
        ...validRequest,
        brandKit: consumerBrandKit,
      };

      const result = generateDraftRewrite(consumerRequest);

      // Consumer specific comparison attributes
      expect(result.markdownContent).toContain('Craft & materials');
      expect(result.markdownContent).toContain('Fit & comfort');
      expect(result.markdownContent).toContain('Durability & care');
      expect(result.markdownContent).toContain('Sustainability');

      // Consumer JSON-LD Schema @type
      expect(result.markdownContent).toContain('"@type": "Product"');
    });

    it('formats multiple core offerings as individual bullet points', () => {
      const result = generateDraftRewrite(validRequest);

      expect(result.markdownContent).toContain('- **AI Analytics Platform** — verified entity proof point');
      expect(result.markdownContent).toContain('- **Real-time Dashboard** — verified entity proof point');
      expect(result.markdownContent).toContain('- **Automated Reporting** — verified entity proof point');
    });

    it('formats a single core offering properly without split bullets', () => {
      const singleOfferingRequest: DraftRewriteRequest = {
        ...validRequest,
        brandKit: {
          ...baseBrandKit,
          core_offerings: 'All-in-One Data Mesh Engine',
        },
      };

      const result = generateDraftRewrite(singleOfferingRequest);

      expect(result.markdownContent).toContain(
        '- **All-in-One Data Mesh Engine** — documented primary authority in B2B SaaS'
      );
    });

    it('handles empty or whitespace competitorName with fallback', () => {
      const requestWithEmptyCompetitor: DraftRewriteRequest = {
        ...validRequest,
        competitorName: '   ',
      };

      const result = generateDraftRewrite(requestWithEmptyCompetitor);

      expect(result.competitor_name).toBe('the competing brand');
      expect(result.metaDescription).toContain('Compare DataFlow vs the competing brand');
      expect(result.markdownContent).toContain('Reclaiming citation share from **the competing brand**');
    });

    it('handles empty missingEntities array with fallback', () => {
      const requestWithNoEntities: DraftRewriteRequest = {
        ...validRequest,
        missingEntities: [],
      };

      const result = generateDraftRewrite(requestWithNoEntities);

      expect(result.missing_entities).toEqual([
        "the competitor's unique proof points and verification detail",
      ]);
      expect(result.metaDescription).toContain(
        "proof points on the competitor's unique proof points and verification detail"
      );
    });

    it('slugifies topic and competitor in canonical comparison URL', () => {
      const requestWithSpecialChars: DraftRewriteRequest = {
        ...validRequest,
        topic: 'AI & Data Governance 101!',
        competitorName: 'Competitor Brand / V2',
      };

      const result = generateDraftRewrite(requestWithSpecialChars);

      expect(result.markdownContent).toContain(
        '/compare/ai-data-governance-101-vs-competitor-brand-v2'
      );
    });

    it('handles missing/falsy request object and brandKit properties gracefully without throwing', () => {
      const incompleteRequest = {} as DraftRewriteRequest;

      const result = generateDraftRewrite(incompleteRequest);

      expect(result.topic).toBe('Category Positioning');
      expect(result.competitor_name).toBe('the competing brand');
      expect(result.missing_entities).toEqual([
        "the competitor's unique proof points and verification detail",
      ]);
      expect(result.status).toBe('ready_for_review');
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.metaDescription).toBeDefined();
      expect(result.faqItems).toHaveLength(3);
    });

    it('handles null/undefined fields in brandKit gracefully', () => {
      const nullFieldsRequest: DraftRewriteRequest = {
        topic: 'Cloud Security',
        competitorName: 'CloudRival',
        missingEntities: ['Zero Trust Architecture'],
        brandName: 'SecureCloud',
        brandDomain: 'securecloud.com',
        brandKit: {
          industry: null as unknown as string,
          core_offerings: null as unknown as string,
          target_audience: null as unknown as string,
          competitors: [],
          tone_of_voice: null as unknown as string,
        },
      };

      const result = generateDraftRewrite(nullFieldsRequest);

      expect(result.topic).toBe('Cloud Security');
      expect(result.competitor_name).toBe('CloudRival');
      expect(result.status).toBe('ready_for_review');
      expect(result.markdownContent).toBeDefined();
    });
  });
});
