import { createId } from '@sandbox/ui-kit';
import { CURRENT_SCHEMA_VERSION, type ProjectRecord } from './ProjectStore';
import { createEmptySnapshot, migrateProjectRecord } from './migrations';

/** Portable JSON shape (id is reassigned on import). */
export interface ProjectExportPayload {
  name: string;
  schemaVersion: number;
  snapshot: ProjectRecord['snapshot'];
}

export function createProjectRecord(name: string, snapshot = createEmptySnapshot()): ProjectRecord {
  return {
    id: createId('project'),
    name: name.trim() || 'Без названия',
    updatedAt: Date.now(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    snapshot,
  };
}

export function serializeProject(record: ProjectRecord): string {
  const payload: ProjectExportPayload = {
    name: record.name,
    schemaVersion: record.schemaVersion,
    snapshot: record.snapshot,
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parseImportedProject(json: string): ProjectRecord {
  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch {
    throw new Error('Invalid JSON');
  }

  const migrated = migrateProjectRecord({
    ...(typeof data === 'object' && data !== null ? data : {}),
    id: createId('project'),
    updatedAt: Date.now(),
  });

  return migrated;
}

export function downloadProjectJson(record: ProjectRecord): void {
  const blob = new Blob([serializeProject(record)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = record.name.replace(/[^\w\-а-яА-ЯёЁ]+/gi, '_').slice(0, 64) || 'project';
  anchor.href = url;
  anchor.download = `${safeName}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
