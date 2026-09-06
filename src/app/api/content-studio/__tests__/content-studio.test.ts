import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generatePOST } from '@/app/api/content-studio/generate/route';
import {
  GET as draftsGET,
  POST as draftsPOST,
  DELETE as draftsDELETE,
} from '@/app/api/content-studio/drafts/route';

// Mock cookies and Supabase server client
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({
      value: JSON.stringify({
        id: 'test-project-123',
        name: 'Test Brand',
        domain: 'testbrand.com',
        tier: 'pro',
        brand_kit: {
          industry: 'Fitness & Apparel',
          target_audience: 'Athletes and runners',
          core_offerings: 'Technical running apparel',
          tone_of_voice: 'Direct and energetic',
          negative_keywords: ['cheap', 'budget'],
          competitors: [{ name: 'Legacy Rival', domain: 'legacyrival.com' }],
        },
      }),
    }),
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }),
  }),
}));

describe('Beacon Content Studio API Suite', () => {
  describe('POST /api/content-studio/generate', () => {
    it('returns 400 when targetDomain or targetTopic is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/generate', {
        method: 'POST',
        body: JSON.stringify({ targetDomain: '' }),
      });

      const res = await generatePOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('required');
    });

    it('generates exactly 3 distinct angles for Outreach Email', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/generate', {
        method: 'POST',
        body: JSON.stringify({
          targetDomain: 'nytimes.com/wirecutter',
          targetTopic: 'Best Performance Activewear Editorial Review',
          competitors: ['Alo Yoga', 'Athleta'],
          contentType: 'Outreach Email',
        }),
      });

      const res = await generatePOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.angles).toHaveLength(3);

      const [angle1, angle2, angle3] = json.angles;
      expect(angle1.angleTitle).toBeTruthy();
      expect(angle1.content).toContain('Subject:');
      expect(angle2.angleTitle).toBeTruthy();
      expect(angle3.angleTitle).toBeTruthy();
    });

    it('generates 3 distinct angles for LinkedIn Post with Brand Kit context', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/generate', {
        method: 'POST',
        body: JSON.stringify({
          targetDomain: 'techcrunch.com',
          targetTopic: 'Enterprise AI Search Visibility',
          competitors: 'Competitor A, Competitor B',
          contentType: 'LinkedIn Post',
        }),
      });

      const res = await generatePOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.contentType).toBe('LinkedIn Post');
      expect(json.angles).toHaveLength(3);
    });

    it('generates Reddit Post and FAQ blocks without errors', async () => {
      const redditReq = new NextRequest('http://localhost:3000/api/content-studio/generate', {
        method: 'POST',
        body: JSON.stringify({
          targetDomain: 'reddit.com/r/technology',
          targetTopic: 'AI Search Alternatives',
          contentType: 'Reddit Post',
        }),
      });

      const redditRes = await generatePOST(redditReq);
      const redditJson = await redditRes.json();
      expect(redditJson.angles).toHaveLength(3);

      const faqReq = new NextRequest('http://localhost:3000/api/content-studio/generate', {
        method: 'POST',
        body: JSON.stringify({
          targetDomain: 'gartner.com',
          targetTopic: 'GEO Technology Evaluation',
          contentType: 'FAQ',
        }),
      });

      const faqRes = await generatePOST(faqReq);
      const faqJson = await faqRes.json();
      expect(faqJson.angles).toHaveLength(3);
      expect(faqJson.angles[0].content).toContain('**Q:');
    });

    it('accepts and incorporates custom toneDimensions slider values', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/generate', {
        method: 'POST',
        body: JSON.stringify({
          targetDomain: 'forbes.com',
          targetTopic: 'AI Executive Strategy',
          contentType: 'LinkedIn Post',
          toneDimensions: {
            formal_casual: 15,
            technical_accessible: 80,
            bold_understated: 10,
            analytical_inspiring: 90,
          },
        }),
      });

      const res = await generatePOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.toneDimensions.formal_casual).toBe(15);
      expect(json.toneDimensions.technical_accessible).toBe(80);
      expect(json.angles).toHaveLength(3);
    });
  });

  describe('/api/content-studio/drafts CRUD operations', () => {
    let createdDraftId: string;

    it('validates required fields on draft creation', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/drafts', {
        method: 'POST',
        body: JSON.stringify({ targetDomain: '' }),
      });

      const res = await draftsPOST(req);
      expect(res.status).toBe(400);
    });

    it('creates a new content draft in persistence store', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/drafts', {
        method: 'POST',
        body: JSON.stringify({
          gapId: 'gap-wirecutter',
          targetDomain: 'nytimes.com/wirecutter',
          targetTopic: 'Best Performance Activewear',
          competitors: ['Alo Yoga'],
          contentType: 'Outreach Email',
          angleTitle: 'Direct & Data-Driven',
          content: 'Hi Wirecutter Team,\n\nHere is our 2026 performance testing data...',
        }),
      });

      const res = await draftsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.draft).toBeDefined();
      expect(json.draft.angle_title).toBe('Direct & Data-Driven');
      expect(json.draft.target_domain).toBe('nytimes.com/wirecutter');
      createdDraftId = json.draft.id;
    });

    it('retrieves saved drafts', async () => {
      const req = new NextRequest('http://localhost:3000/api/content-studio/drafts', {
        method: 'GET',
      });

      const res = await draftsGET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.drafts)).toBe(true);
      expect(json.drafts.length).toBeGreaterThan(0);
    });

    it('deletes a draft by ID', async () => {
      expect(createdDraftId).toBeDefined();
      const req = new NextRequest(
        `http://localhost:3000/api/content-studio/drafts?id=${createdDraftId}`,
        {
          method: 'DELETE',
        }
      );

      const res = await draftsDELETE(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
