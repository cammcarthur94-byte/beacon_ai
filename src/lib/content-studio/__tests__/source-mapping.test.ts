import { describe, it, expect } from 'vitest';
import { inferContentTypeFromSource, getSourceTypeBadgeInfo } from '../source-mapping';

describe('Source Type to Content Type Inference', () => {
  it('maps news source types to Outreach Email', () => {
    expect(inferContentTypeFromSource('news', 'nytimes.com/wirecutter')).toBe('Outreach Email');
    expect(inferContentTypeFromSource('news', 'gearjunkie.com')).toBe('Outreach Email');
    expect(inferContentTypeFromSource('editorial', 'techcrunch.com')).toBe('Outreach Email');
    expect(inferContentTypeFromSource('press', 'forbes.com')).toBe('Outreach Email');
  });

  it('identifies news publishers by domain even without explicit sourceType', () => {
    expect(inferContentTypeFromSource(undefined, 'nytimes.com/wirecutter')).toBe('Outreach Email');
    expect(inferContentTypeFromSource(undefined, 'gearjunkie.com/apparel')).toBe('Outreach Email');
    expect(inferContentTypeFromSource(undefined, 'wsj.com/personal-tech')).toBe('Outreach Email');
    expect(inferContentTypeFromSource(undefined, 'theverge.com')).toBe('Outreach Email');
  });

  it('maps forum source types to Reddit Post', () => {
    expect(inferContentTypeFromSource('forum', 'reddit.com/r/running')).toBe('Reddit Post');
    expect(inferContentTypeFromSource('community', 'quora.com')).toBe('Reddit Post');
    expect(inferContentTypeFromSource(undefined, 'reddit.com')).toBe('Reddit Post');
  });

  it('maps documentation/analyst source types to FAQ', () => {
    expect(inferContentTypeFromSource('documentation', 'gartner.com')).toBe('FAQ');
    expect(inferContentTypeFromSource('docs', 'docs.stripe.com')).toBe('FAQ');
  });

  it('maps blog source types to Blog Post', () => {
    expect(inferContentTypeFromSource('blog', 'medium.com/@techlead')).toBe('Blog Post');
    expect(inferContentTypeFromSource('blog', 'industry-review.substack.com')).toBe('Blog Post');
  });

  it('returns badge info correctly', () => {
    const newsBadge = getSourceTypeBadgeInfo('news');
    expect(newsBadge.label).toBe('News & Editorial');
    expect(newsBadge.recommendation).toContain('Editorial Outreach Pitch');

    const forumBadge = getSourceTypeBadgeInfo('forum');
    expect(forumBadge.label).toBe('Forums & Communities');
    expect(forumBadge.recommendation).toContain('Reddit Community Post');
  });
});
