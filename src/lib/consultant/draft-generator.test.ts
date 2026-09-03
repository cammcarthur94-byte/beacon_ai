import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateDraftRewrite, isConsumerIndustry } from './draft-generator';
import type { DraftRewriteRequest } from './draft-generator';
import type { BrandKit } from '@/types/database.types';

describe('isConsumerIndustry', () => {
  it('returns true for consumer industries regardless of casing', () => {
    assert.equal(isConsumerIndustry('Retail'), true);
    assert.equal(isConsumerIndustry('E-COMMERCE'), true);
    assert.equal(isConsumerIndustry('Apparel & Fashion'), true);
    assert.equal(isConsumerIndustry('Footwear'), true);
    assert.equal(isConsumerIndustry('Sporting Goods'), true);
    assert.equal(isConsumerIndustry('Fitness'), true);
    assert.equal(isConsumerIndustry('Athleisure'), true);
    assert.equal(isConsumerIndustry('Beauty'), true);
    assert.equal(isConsumerIndustry('Food and Beverage'), true);
    assert.equal(isConsumerIndustry('Travel'), true);
    assert.equal(isConsumerIndustry('Hospitality'), true);
  });

  it('returns false for B2B or tech industries', () => {
    assert.equal(isConsumerIndustry('B2B SaaS'), false);
    assert.equal(isConsumerIndustry('Cybersecurity'), false);
    assert.equal(isConsumerIndustry('Financial Services'), false);
    assert.equal(isConsumerIndustry('Cloud Infrastructure'), false);
  });

  it('handles empty, null, or non-string input safely', () => {
    assert.equal(isConsumerIndustry(''), false);
    // @ts-ignore
    assert.equal(isConsumerIndustry(null), false);
    // @ts-ignore
    assert.equal(isConsumerIndustry(undefined), false);
  });
});

describe('generateDraftRewrite', () => {
  const baseBrandKit: BrandKit = {
    industry: 'B2B Software',
    core_offerings: 'AI Analytics Platform, Real-time Dashboard, Custom Reports',
    target_audience: 'Enterprise CMOs',
    tone_of_voice: 'Authoritative',
    competitors: [{ name: 'AcmeCorp', domain: 'acmecorp.com' }],
  };

  const validRequest: DraftRewriteRequest = {
    topic: 'Best AI Analytics Tools 2026',
    competitorName: 'AcmeCorp',
    missingEntities: ['Real-time Streaming API', 'SOC2 Type II Certification'],
    brandName: 'Beacon',
    brandDomain: 'beacon.io',
    brandKit: baseBrandKit,
  };

  it('generates a draft rewrite result for B2B SaaS brand kit', () => {
    const result = generateDraftRewrite(validRequest);

    assert.equal(result.topic, 'Best AI Analytics Tools 2026');
    assert.equal(result.competitor_name, 'AcmeCorp');
    assert.deepEqual(result.missing_entities, [
      'Real-time Streaming API',
      'SOC2 Type II Certification',
    ]);
    assert.equal(result.status, 'ready_for_review');
    assert.ok(result.wordCount > 50);
    assert.ok(result.metaDescription.includes('Beacon'));
    assert.ok(result.metaDescription.includes('AcmeCorp'));
    assert.equal(result.faqItems.length, 3);
    assert.ok(result.markdownContent.includes('SoftwareApplication'));
    assert.ok(result.markdownContent.includes('Security & compliance'));
  });

  it('generates a draft rewrite result for Consumer industry brand kit', () => {
    const consumerRequest: DraftRewriteRequest = {
      ...validRequest,
      brandKit: {
        ...baseBrandKit,
        industry: 'Apparel & Footwear',
        core_offerings: 'Organic Cotton Hoodies, Trail Shoes',
        target_audience: 'Outdoor Enthusiasts',
      },
    };

    const result = generateDraftRewrite(consumerRequest);

    assert.ok(result.markdownContent.includes('Product'));
    assert.ok(result.markdownContent.includes('Craft & materials'));
  });

  it('handles empty competitorName by using fallback string', () => {
    const req: DraftRewriteRequest = {
      ...validRequest,
      competitorName: '   ',
    };

    const result = generateDraftRewrite(req);

    assert.equal(result.competitor_name, 'the competing brand');
    assert.ok(result.markdownContent.includes('the competing brand'));
  });

  it('handles empty missingEntities array by using default entity fallback', () => {
    const req: DraftRewriteRequest = {
      ...validRequest,
      missingEntities: [],
    };

    const result = generateDraftRewrite(req);

    assert.equal(result.missing_entities.length, 1);
    assert.equal(
      result.missing_entities[0],
      "the competitor's unique proof points and verification detail"
    );
  });

  it('handles single core offering gracefully in markdown list formatting', () => {
    const req: DraftRewriteRequest = {
      ...validRequest,
      brandKit: {
        ...baseBrandKit,
        core_offerings: 'All-in-one Analytics',
      },
    };

    const result = generateDraftRewrite(req);
    assert.ok(result.markdownContent.includes('- **All-in-one Analytics** — documented primary authority'));
  });

  it('throws descriptive Error if request or brandKit is missing/invalid', () => {
    // @ts-ignore
    assert.throws(() => generateDraftRewrite(null), /DraftRewriteRequest is required/);
    // @ts-ignore
    assert.throws(() => generateDraftRewrite({ ...validRequest, brandKit: null }), /brandKit is required/);
  });

  it('handles null or missing fields in brandKit gracefully', () => {
    const incompleteReq: DraftRewriteRequest = {
      topic: 'Test Topic',
      competitorName: 'Comp',
      missingEntities: ['Entity1'],
      brandName: 'BrandX',
      brandDomain: 'brandx.com',
      brandKit: {
        industry: null as any,
        core_offerings: null as any,
        target_audience: undefined as any,
        tone_of_voice: null as any,
        competitors: [],
      },
    };

    const result = generateDraftRewrite(incompleteReq);
    assert.equal(result.topic, 'Test Topic');
    assert.equal(result.status, 'ready_for_review');
    assert.ok(result.wordCount > 0);
  });
});
