import type { SceneSnapshot } from '../model/types';

/** Bump when Epics 06+ change the persisted snapshot shape. */
export const CURRENT_SCHEMA_VERSION = 2;

export interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: number;
  schemaVersion: number;
  snapshot: SceneSnapshot;
}

export interface ProjectStore {
  list(): Promise<ProjectRecord[]>;
  get(id: string): Promise<ProjectRecord | null>;
  save(record: ProjectRecord): Promise<void>;
  delete(id: string): Promise<void>;
}
