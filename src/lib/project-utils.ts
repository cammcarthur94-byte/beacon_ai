import type { BrandKit } from '@/types/database.types';

export interface ActiveProject {
  id: string;
  name: string;
  domain: string;
  tier: string;
  audit_limit?: number;
  brand_kit?: BrandKit;
  created_at?: string;
}

export function isLegacyMockProject(project: any): boolean {
  if (!project) return false;
  const id = String(project.id || '').toLowerCase();
  const name = String(project.name || '').toLowerCase();
  const domain = String(project.domain || '').toLowerCase();

  return (
    id.includes('lululemon') ||
    name.includes('lululemon') ||
    domain.includes('lululemon')
  );
}

export function parseActiveProjectCookie(cookieValue: string | undefined | null): ActiveProject | null {
  if (!cookieValue) return null;
  try {
    const parsed = typeof cookieValue === 'string' ? JSON.parse(cookieValue) : cookieValue;
    if (isLegacyMockProject(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
