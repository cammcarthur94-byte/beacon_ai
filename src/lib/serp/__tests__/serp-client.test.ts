import { describe, it, expect } from 'vitest';
import { parseSerpApiResponse, generateSimulatedGoogleAiResponse, SerpAiQueryParams } from '../serp-client';

const mockParams: SerpAiQueryParams = {
  queryText: 'best activewear leggings',
  brandName: 'Lululemon',
  domain: 'lululemon.com',
  competitors: [
    { name: 'Alo Yoga', domain: 'aloyoga.com' },
    { name: 'Vuori', domain: 'vuoriclothing.com' },
  ],
  mode: 'google_ai_overview',
};

describe('parseSerpApiResponse', () => {
  it('parses ai_overview with array of string snippets and references', () => {
    const mockPayload = {
      ai_overview: {
        snippets: [
          'Lululemon offers high performance leggings.',
          'Alo Yoga and Vuori are key competitors in activewear.',
        ],
        references: [
          { link: 'https://lululemon.com/leggings', title: 'Lululemon Leggings' },
          { url: 'https://aloyoga.com/collections', source: 'Alo Yoga' },
        ],
      },
    };

    const result = parseSerpApiResponse(mockPayload, mockParams);

    expect(result.engine).toBe('google_ai_overview');
    expect(result.summarySnippet).toBe('Lululemon offers high performance leggings.');
    expect(result.rawText).toContain('Lululemon offers high performance leggings.');
    expect(result.rawText).toContain('Alo Yoga and Vuori are key competitors');
    expect(result.isSimulated).toBe(false);
    expect(result.brandMentioned).toBe(true);
    expect(result.citedUrls).toEqual([
      'https://lululemon.com/leggings',
      'https://aloyoga.com/collections',
    ]);
    expect(result.citedCompetitorDomains).toEqual(['aloyoga.com']);
    expect(result.sources).toHaveLength(2);
    expect(result.sources[0]).toEqual({
      title: 'Lululemon Leggings',
      link: 'https://lululemon.com/leggings',
      domain: 'lululemon.com',
    });
    expect(result.sources[1]).toEqual({
      title: 'Alo Yoga',
      link: 'https://aloyoga.com/collections',
      domain: 'aloyoga.com',
    });
  });

  it('parses ai_overview with array of object snippets', () => {
    const mockPayload = {
      ai_overview: {
        snippets: [
          { snippet: 'Top choice: Lululemon Align Pants.' },
          { title: 'Alternative options from Vuori.' },
        ],
        sources: [
          { link: 'https://vuoriclothing.com/pants', title: 'Vuori Store' },
        ],
      },
    };

    const result = parseSerpApiResponse(mockPayload, mockParams);

    expect(result.summarySnippet).toBe('Top choice: Lululemon Align Pants.');
    expect(result.rawText).toBe(
      'Top choice: Lululemon Align Pants.\n\nAlternative options from Vuori.'
    );
    expect(result.citedCompetitorDomains).toEqual(['vuoriclothing.com']);
  });

  it('parses ai_overview with single snippet string', () => {
    const mockPayload = {
      ai_overview: {
        snippet: 'Lululemon produces leading technical apparel.',
        references: [
          { link: 'https://lululemon.com/about' },
        ],
      },
    };

    const result = parseSerpApiResponse(mockPayload, mockParams);

    expect(result.summarySnippet).toBe('Lululemon produces leading technical apparel.');
    expect(result.rawText).toBe('Lululemon produces leading technical apparel.');
    expect(result.sources[0].title).toBe('lululemon.com'); // domain fallback
  });

  it('parses ai_overview with text_blocks array', () => {
    const mockPayload = {
      ai_overview: {
        text_blocks: [
          { snippet: 'Lululemon leggings are recommended for running.' },
          { text: 'Alo Yoga is another top brand.' },
        ],
      },
    };

    const result = parseSerpApiResponse(mockPayload, mockParams);

    expect(result.summarySnippet).toBe('Lululemon leggings are recommended for running.');
    expect(result.rawText).toBe(
      'Lululemon leggings are recommended for running.\n\nAlo Yoga is another top brand.'
    );
  });

  it('falls back to answer_box when ai_overview is missing', () => {
    const mockPayload = {
      answer_box: {
        snippet: 'Lululemon is renowned for superior workout gear.',
        link: 'https://lululemon.com/faq',
      },
    };

    const result = parseSerpApiResponse(mockPayload, mockParams);

    expect(result.summarySnippet).toBe('Lululemon is renowned for superior workout gear.');
    expect(result.rawText).toBe('Lululemon is renowned for superior workout gear.');
    expect(result.citedUrls).toEqual(['https://lululemon.com/faq']);
    expect(result.isSimulated).toBe(false);
  });

  it('falls back to top 3 organic_results when ai_overview and answer_box are missing', () => {
    const mockPayload = {
      organic_results: [
        { title: 'Lululemon Official', snippet: 'Best activewear for fitness.', link: 'https://lululemon.com' },
        { title: 'Alo Yoga Best Sellers', snippet: 'Trending yoga clothing.', link: 'https://aloyoga.com' },
        { title: 'Vuori Wear', snippet: 'Soft performance apparel.', link: 'https://vuoriclothing.com' },
        { title: 'Fourth Result', snippet: 'Ignored result.', link: 'https://other.com' },
      ],
    };

    const result = parseSerpApiResponse(mockPayload, mockParams);

    expect(result.summarySnippet).toBe('Best activewear for fitness.');
    expect(result.rawText).toContain('Lululemon Official: Best activewear for fitness.');
    expect(result.rawText).toContain('Alo Yoga Best Sellers: Trending yoga clothing.');
    expect(result.rawText).toContain('Vuori Wear: Soft performance apparel.');
    expect(result.rawText).not.toContain('Fourth Result');
    expect(result.citedUrls).toHaveLength(3);
    expect(result.citedCompetitorDomains).toEqual(['aloyoga.com', 'vuoriclothing.com']);
  });

  it('falls back to generateSimulatedGoogleAiResponse when payload has no text', () => {
    const mockPayload = {};

    const result = parseSerpApiResponse(mockPayload, mockParams);

    expect(result.isSimulated).toBe(true);
    expect(result.brandMentioned).toBe(true);
    expect(result.rawText).toContain('Lululemon');
  });

  it('handles duplicate cited URLs and normalizes competitor domains correctly', () => {
    const mockPayload = {
      ai_overview: {
        snippet: 'Lululemon, Alo Yoga, and Vuori comparative guide.',
        references: [
          { link: 'https://aloyoga.com/leggings', title: 'Alo' },
          { link: 'https://aloyoga.com/leggings', title: 'Alo Duplicate' },
          { link: 'https://VUORICLOTHING.COM/shorts', title: 'Vuori' },
        ],
      },
    };

    const paramsWithProtocolComp: SerpAiQueryParams = {
      ...mockParams,
      competitors: [
        { name: 'Alo Yoga', domain: 'https://aloyoga.com/' },
        { name: 'Vuori', domain: 'http://vuoriclothing.com/path' },
      ],
    };

    const result = parseSerpApiResponse(mockPayload, paramsWithProtocolComp);

    expect(result.citedUrls).toEqual([
      'https://aloyoga.com/leggings',
      'https://VUORICLOTHING.COM/shorts',
    ]);
    expect(result.citedCompetitorDomains).toEqual(['aloyoga.com', 'vuoriclothing.com']);
  });

  it('correctly maps mode and calculates brand sentiment and position', () => {
    const paramsAiMode: SerpAiQueryParams = {
      ...mockParams,
      mode: 'google_ai_mode',
    };

    const mockPayload = {
      ai_overview: {
        snippet: 'Lululemon is a leading top recommended brand with superior quality.',
      },
    };

    const result = parseSerpApiResponse(mockPayload, paramsAiMode);

    expect(result.engine).toBe('google_ai_mode');
    expect(result.brandMentioned).toBe(true);
    expect(result.sentiment).toBe('positive');
    expect(result.rankingPosition).toBe(1);
  });
});

describe('generateSimulatedGoogleAiResponse', () => {
  it('generates simulated response for google_ai_overview mode', () => {
    const result = generateSimulatedGoogleAiResponse(mockParams);
    expect(result.isSimulated).toBe(true);
    expect(result.engine).toBe('google_ai_overview');
    expect(result.brandMentioned).toBe(true);
    expect(result.citedUrls.length).toBeGreaterThan(0);
  });

  it('generates simulated response for google_ai_mode', () => {
    const result = generateSimulatedGoogleAiResponse({
      ...mockParams,
      mode: 'google_ai_mode',
    });
    expect(result.isSimulated).toBe(true);
    expect(result.engine).toBe('google_ai_mode');
    expect(result.summarySnippet).toContain('Google AI Mode');
  });
});
