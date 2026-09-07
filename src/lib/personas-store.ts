import type { Persona } from '@/types/database.types';

// In-memory cache shared across API routes and server actions in the same Node process
const globalPersonasByProject: Record<string, Persona[]> = {};

export function getLocalPersonas(projectId?: string): Persona[] {
  if (projectId && globalPersonasByProject[projectId]) {
    return globalPersonasByProject[projectId];
  }

  // If no explicit project or empty, check if any project has personas
  if (!projectId) {
    const firstKey = Object.keys(globalPersonasByProject)[0];
    if (firstKey) return globalPersonasByProject[firstKey];
  }

  return [];
}

export function saveLocalPersona(persona: Persona, projectId?: string): Persona {
  const targetProject = projectId || persona.project_id || 'default-active-project';
  if (!globalPersonasByProject[targetProject]) {
    globalPersonasByProject[targetProject] = [];
  }

  const existingIdx = globalPersonasByProject[targetProject].findIndex((p) => p.id === persona.id);
  if (existingIdx > -1) {
    globalPersonasByProject[targetProject][existingIdx] = persona;
  } else {
    globalPersonasByProject[targetProject].unshift(persona);
  }

  return persona;
}

export function deleteLocalPersona(id: string, projectId?: string): boolean {
  let found = false;
  if (projectId && globalPersonasByProject[projectId]) {
    const initialLen = globalPersonasByProject[projectId].length;
    globalPersonasByProject[projectId] = globalPersonasByProject[projectId].filter((p) => p.id !== id);
    if (globalPersonasByProject[projectId].length < initialLen) found = true;
  }

  // Also search across all projects if not found
  if (!found) {
    for (const key of Object.keys(globalPersonasByProject)) {
      const initialLen = globalPersonasByProject[key].length;
      globalPersonasByProject[key] = globalPersonasByProject[key].filter((p) => p.id !== id);
      if (globalPersonasByProject[key].length < initialLen) found = true;
    }
  }

  return found;
}

export function findLocalPersonaById(id: string, projectId?: string): Persona | undefined {
  if (projectId && globalPersonasByProject[projectId]) {
    const p = globalPersonasByProject[projectId].find((item) => item.id === id);
    if (p) return p;
  }

  for (const list of Object.values(globalPersonasByProject)) {
    const p = list.find((item) => item.id === id);
    if (p) return p;
  }

  return undefined;
}
