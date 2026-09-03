import { describe, it, expect } from 'vitest';
import {
  describeCompetitors,
  buildSentinelSystemPrompt,
  normalizeEngineName,
  alertContextToPromptLine,
  WorkspaceGrounding,
  AlertContextItem,
} from './system-prompt';
import type { BrandKit, CompetitorInfo } from '@/types/database.types';

describe('describeCompetitors', () => {
  it('should return default instructions when competitors list is empty', () => {
    const brandKit: BrandKit = {
      industry: 'Software',
      target_audience: 'Developers',
      core_offerings: 'SaaS Platform',
      tone_of_voice: 'Professional',
      competitors: [],
    };
    const result = describeCompetitors(brandKit);
    expect(result).toBe(
      'No named competitors on file - ask the user who their closest rivals are before benchmarking.'
    );
  });

  it('should return default instructions when competitors property is undefined', () => {
    const brandKit: BrandKit = {
      industry: 'E-commerce',
      target_audience: 'Consumers',
      core_offerings: 'Apparel',
      tone_of_voice: 'Casual',
      competitors: undefined as unknown as CompetitorInfo[],
    };
    const result = describeCompetitors(brandKit);
    expect(result).toBe(
      'No named competitors on file - ask the user who their closest rivals are before benchmarking.'
    );
  });

  it('should return default instructions when competitors property is null', () => {
    const brandKit: BrandKit = {
      industry: 'Finance',
      target_audience: 'Investors',
      core_offerings: 'Wealth Management',
      tone_of_voice: 'Authoritative',
      competitors: null as unknown as CompetitorInfo[],
    };
    const result = describeCompetitors(brandKit);
    expect(result).toBe(
      'No named competitors on file - ask the user who their closest rivals are before benchmarking.'
    );
  });

  it('should format a single competitor correctly', () => {
    const brandKit: BrandKit = {
      industry: 'Cybersecurity',
      target_audience: 'CISOs',
      core_offerings: 'Threat Detection',
      tone_of_voice: 'Direct',
      competitors: [{ name: 'RivalSec', domain: 'rivalsec.com' }],
    };
    const result = describeCompetitors(brandKit);
    expect(result).toBe('RivalSec (rivalsec.com)');
  });

  it('should format multiple competitors correctly separated by commas', () => {
    const brandKit: BrandKit = {
      industry: 'Cloud Infrastructure',
      target_audience: 'DevOps',
      core_offerings: 'Cloud Hosting',
      tone_of_voice: 'Technical',
      competitors: [
        { name: 'CloudAlpha', domain: 'alpha.io' },
        { name: 'CloudBeta', domain: 'beta.com' },
        { name: 'CloudGamma', domain: 'gamma.net' },
      ],
    };
    const result = describeCompetitors(brandKit);
    expect(result).toBe('CloudAlpha (alpha.io), CloudBeta (beta.com), CloudGamma (gamma.net)');
  });
});

describe('buildSentinelSystemPrompt', () => {
  it('should include fallback competitor text when competitors list is empty', () => {
    const workspace: WorkspaceGrounding = {
      projectId: 'proj-123',
      brandName: 'Acme Health',
      domain: 'acmehealth.com',
      tier: 'growth',
      brandKit: {
        industry: 'Healthcare',
        target_audience: 'Patients and Clinics',
        core_offerings: 'Telehealth Software',
        tone_of_voice: 'Empathetic',
        competitors: [],
      },
    };

    const prompt = buildSentinelSystemPrompt(workspace);
    expect(prompt).toContain('Brand: Acme Health (acmehealth.com)');
    expect(prompt).toContain('Subscription tier: growth');
    expect(prompt).toContain('Industry: Healthcare');
    expect(prompt).toContain(
      'Known competitors: No named competitors on file - ask the user who their closest rivals are before benchmarking.'
    );
  });

  it('should include formatted competitors when brandKit has competitors', () => {
    const workspace: WorkspaceGrounding = {
      projectId: 'proj-456',
      brandName: 'Apex Logistics',
      domain: 'apexlogistics.com',
      tier: 'enterprise',
      brandKit: {
        industry: 'Supply Chain',
        target_audience: 'Fleet Managers',
        core_offerings: 'Route Optimization',
        tone_of_voice: 'Decisive',
        competitors: [
          { name: 'FastFreight', domain: 'fastfreight.com' },
          { name: 'LogiGlobal', domain: 'logiglobal.io' },
        ],
      },
    };

    const prompt = buildSentinelSystemPrompt(workspace);
    expect(prompt).toContain('Known competitors: FastFreight (fastfreight.com), LogiGlobal (logiglobal.io)');
  });
});

describe('normalizeEngineName', () => {
  it('should normalize known search engine keys regardless of case and spacing', () => {
    expect(normalizeEngineName('chatgpt')).toBe('ChatGPT (OpenAI)');
    expect(normalizeEngineName(' ChatGPT ')).toBe('ChatGPT (OpenAI)');
    expect(normalizeEngineName('GEMINI')).toBe('Gemini (Google)');
    expect(normalizeEngineName('claude')).toBe('Claude (Anthropic)');
    expect(normalizeEngineName('perplexity')).toBe('Perplexity Sonar');
    expect(normalizeEngineName('google_ai_overview')).toBe('Google AI Overviews');
    expect(normalizeEngineName('google_ai_mode')).toBe('Google AI Mode');
  });

  it('should return unknown engine string as provided', () => {
    expect(normalizeEngineName('Baidu AI')).toBe('Baidu AI');
    expect(normalizeEngineName('Custom Internal Engine')).toBe('Custom Internal Engine');
  });

  it('should return default string for empty or falsy engine inputs', () => {
    expect(normalizeEngineName('')).toBe('AI search engines');
    expect(normalizeEngineName(null as unknown as string)).toBe('AI search engines');
    expect(normalizeEngineName(undefined as unknown as string)).toBe('AI search engines');
  });
});

describe('alertContextToPromptLine', () => {
  it('should construct alert system notification with valid drop', () => {
    const alert: AlertContextItem = {
      id: 'alert-1',
      content: 'SOV drop detected',
      createdAt: '2026-09-03T12:00:00Z',
      promptId: 'p-1',
      promptQueryText: 'best enterprise CRM software',
      engine: 'chatgpt',
      competitor: 'Salesforce',
      drop: 15.4,
    };

    const line = alertContextToPromptLine(alert);
    expect(line).toContain('[SYSTEM NOTIFICATION - raised by the background audit pipeline at 2026-09-03T12:00:00Z]');
    expect(line).toContain('tracker "best enterprise CRM software" on ChatGPT (OpenAI)');
    expect(line).toContain('Share of Voice fell roughly 15 points');
    expect(line).toContain('Salesforce took');
  });

  it('should handle null/missing drop and fallbacks gracefully', () => {
    const alert: AlertContextItem = {
      id: 'alert-2',
      content: 'Visibility change',
      createdAt: '2026-09-03T14:00:00Z',
      promptId: null,
      promptQueryText: null,
      engine: null,
      competitor: null,
      drop: null,
    };

    const line = alertContextToPromptLine(alert);
    expect(line).toContain('tracker "a tracked prompt" on AI search engines.');
    expect(line).not.toContain('Share of Voice fell roughly');
    expect(line).toContain('a competitor took');
  });

  it('should handle non-finite drop numbers gracefully', () => {
    const alert: AlertContextItem = {
      id: 'alert-3',
      content: 'Non-finite drop test',
      createdAt: '2026-09-03T15:00:00Z',
      promptId: 'p-3',
      promptQueryText: 'top CRM tools',
      engine: 'gemini',
      competitor: 'HubSpot',
      drop: NaN,
    };

    const line = alertContextToPromptLine(alert);
    expect(line).not.toContain('Share of Voice fell roughly');
    expect(line).toContain('HubSpot took');
  });
});
