import { IndexedDbProjectStore } from '../core/persistence/IndexedDbProjectStore';
import { MemoryProjectStore } from '../core/persistence/MemoryProjectStore';
import type { FloorRecord, ProjectRecord, ProjectStore } from '../core/persistence/ProjectStore';
import { createDefaultFloor } from '../core/persistence/migrations';
import {
  createProjectRecord,
  downloadProjectJson,
  getActiveFloor,
  parseImportedProject,
} from '../core/persistence/serialize';
import type { SceneSnapshot } from '../core/model/types';

const LAST_PROJECT_KEY = 'sandbox:lastProjectId';

let storeSingleton: ProjectStore | null = null;

export function createBrowserProjectStore(): ProjectStore {
  if (typeof indexedDB !== 'undefined') {
    return new IndexedDbProjectStore();
  }
  return new MemoryProjectStore();
}

export function getProjectStore(): ProjectStore {
  if (!storeSingleton) {
    storeSingleton = createBrowserProjectStore();
  }
  return storeSingleton;
}

/** Swap the store for Vitest (call before mounting UI that uses projects). */
export function setProjectStoreForTests(store: ProjectStore): void {
  storeSingleton = store;
}

export function rememberLastProjectId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAST_PROJECT_KEY, id);
}

export function readLastProjectId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(LAST_PROJECT_KEY);
}

export function clearLastProjectId(id?: string): void {
  if (typeof localStorage === 'undefined') return;
  if (!id || localStorage.getItem(LAST_PROJECT_KEY) === id) {
    localStorage.removeItem(LAST_PROJECT_KEY);
  }
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return getProjectStore().list();
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  return getProjectStore().get(id);
}

export async function createProject(name = 'Новый проект'): Promise<ProjectRecord> {
  const record = createProjectRecord(name);
  await getProjectStore().save(record);
  rememberLastProjectId(record.id);
  return record;
}

export async function saveProjectSnapshot(
  id: string,
  snapshot: SceneSnapshot,
  name?: string,
  floorId?: string,
): Promise<ProjectRecord | null> {
  const existing = await getProjectStore().get(id);
  if (!existing) return null;
  const targetFloorId = floorId ?? existing.activeFloorId ?? existing.floors[0]?.id;
  const floors = existing.floors.map((floor) =>
    floor.id === targetFloorId ? { ...floor, snapshot } : floor,
  );
  const next: ProjectRecord = {
    ...existing,
    name: name ?? existing.name,
    updatedAt: Date.now(),
    floors,
    activeFloorId: targetFloorId,
  };
  await getProjectStore().save(next);
  rememberLastProjectId(id);
  return next;
}

export async function saveProjectRecord(record: ProjectRecord): Promise<ProjectRecord> {
  const next = { ...record, updatedAt: Date.now() };
  await getProjectStore().save(next);
  rememberLastProjectId(next.id);
  return next;
}

export async function addFloorToProject(id: string, name?: string): Promise<ProjectRecord | null> {
  const existing = await getProjectStore().get(id);
  if (!existing) return null;
  const index = existing.floors.length + 1;
  const floor = createDefaultFloor(undefined, index);
  if (name) floor.name = name;
  const next: ProjectRecord = {
    ...existing,
    floors: [...existing.floors, floor],
    activeFloorId: floor.id,
    updatedAt: Date.now(),
  };
  await getProjectStore().save(next);
  return next;
}

export async function setActiveFloor(
  id: string,
  floorId: string,
  currentSnapshot?: SceneSnapshot,
): Promise<ProjectRecord | null> {
  const existing = await getProjectStore().get(id);
  if (!existing) return null;
  if (!existing.floors.some((f) => f.id === floorId)) return existing;

  let floors = existing.floors;
  if (currentSnapshot && existing.activeFloorId) {
    floors = floors.map((f) =>
      f.id === existing.activeFloorId ? { ...f, snapshot: currentSnapshot } : f,
    );
  }

  const next: ProjectRecord = {
    ...existing,
    floors,
    activeFloorId: floorId,
    updatedAt: Date.now(),
  };
  await getProjectStore().save(next);
  return next;
}

export async function updateFloorMeta(
  id: string,
  floorId: string,
  patch: Partial<Pick<FloorRecord, 'name' | 'showCeiling' | 'elevation'>>,
): Promise<ProjectRecord | null> {
  const existing = await getProjectStore().get(id);
  if (!existing) return null;
  const next: ProjectRecord = {
    ...existing,
    floors: existing.floors.map((f) => (f.id === floorId ? { ...f, ...patch } : f)),
    updatedAt: Date.now(),
  };
  await getProjectStore().save(next);
  return next;
}

export async function renameProject(id: string, name: string): Promise<ProjectRecord | null> {
  const existing = await getProjectStore().get(id);
  if (!existing) return null;
  const trimmed = name.trim();
  if (!trimmed) return existing;
  const next: ProjectRecord = { ...existing, name: trimmed, updatedAt: Date.now() };
  await getProjectStore().save(next);
  return next;
}

export async function duplicateProject(id: string): Promise<ProjectRecord | null> {
  const existing = await getProjectStore().get(id);
  if (!existing) return null;
  const copy = createProjectRecord(
    `${existing.name} (копия)`,
    existing.floors.map((f) => ({
      ...f,
      id: `${f.id}_copy`,
      snapshot: structuredClone(f.snapshot),
    })),
  );
  await getProjectStore().save(copy);
  return copy;
}

export async function deleteProject(id: string): Promise<void> {
  await getProjectStore().delete(id);
  clearLastProjectId(id);
}

export async function exportProject(id: string): Promise<void> {
  const existing = await getProjectStore().get(id);
  if (!existing) throw new Error('Project not found');
  downloadProjectJson(existing);
}

export async function importProjectFromJson(json: string): Promise<ProjectRecord> {
  const record = parseImportedProject(json);
  await getProjectStore().save(record);
  rememberLastProjectId(record.id);
  return record;
}

export { getActiveFloor };

export function formatRelativeUpdatedAt(updatedAt: number, now = Date.now()): string {
  const delta = Math.max(0, now - updatedAt);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  return new Date(updatedAt).toLocaleDateString('ru-RU');
}
