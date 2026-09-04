import { describe, it, expect } from 'vitest';
import { extractEngineQuote, formatGroundingSources } from './sentiment-context-card';

describe('extractEngineQuote', () => {
  it('extracts sentence mentioning the brand', () => {
    const rawText = `Top recommendations for cloud hosting:
1. Acme Cloud offers industry-leading uptime and elastic scalability across 40 regions.
2. OtherHost is a low-cost alternative.`;
    const quote = extractEngineQuote(rawText, 'Acme Cloud');
    expect(quote).toContain('Acme Cloud offers industry-leading uptime');
  });

  it('cleans leading markdown list numbers and asterisks', () => {
    const rawText = `**Acme Cloud**: The benchmark in managed Kubernetes with 99.99% SLA.`;
    const quote = extractEngineQuote(rawText, 'Acme');
    expect(quote).toBe('Acme Cloud: The benchmark in managed Kubernetes with 99.99% SLA.');
  });

  it('handles empty text gracefully', () => {
    expect(extractEngineQuote('', 'Acme')).toBe('No textual answer returned by engine for this query.');
  });
});

describe('formatGroundingSources', () => {
  it('extracts and formats domains from cited URLs', () => {
    const urls = ['https://www.techcrunch.com/article/1', 'https://forbes.com/best-cloud'];
    const formatted = formatGroundingSources(urls, 'Perplexity');
    expect(formatted).toBe('techcrunch.com & forbes.com');
  });

  it('falls back to engine label when no URLs are present', () => {
    const formatted = formatGroundingSources([], 'ChatGPT');
    expect(formatted).toBe('ChatGPT Grounding & Web Index');
  });
});
