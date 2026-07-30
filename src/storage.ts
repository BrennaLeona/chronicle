import type { Database } from './types';

const KEY = 'chronicle.db.v1';

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function emptyDatabase(): Database {
  return { version: 1, projects: [], data: {} };
}

export function loadDatabase(): Database | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Database;
    if (parsed.version !== 1 || !Array.isArray(parsed.projects)) return null;
    return parsed;
  } catch {
    // A corrupt payload should not brick the app — fall back to a fresh start.
    return null;
  }
}

export function saveDatabase(db: Database): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Chronicle could not save your work', error);
  }
}

/** Download the whole database so a writer can keep their own copy. */
export function exportDatabase(db: Database): void {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chronicle-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseImported(text: string): Database {
  const parsed = JSON.parse(text) as Database;
  if (parsed.version !== 1 || !Array.isArray(parsed.projects) || typeof parsed.data !== 'object') {
    throw new Error('That file is not a Chronicle backup.');
  }
  return parsed;
}
