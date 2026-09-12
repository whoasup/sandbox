import type { SceneSnapshot } from '../model/types';

/** Bump when Epics 06+ change the persisted snapshot shape. */
export const CURRENT_SCHEMA_VERSION = 6;

export interface FloorRecord {
  id: string;
  name: string;
  /** Meters relative to ground. */
  elevation: number;
  snapshot: SceneSnapshot;
  showCeiling?: boolean;
}

export interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: number;
  schemaVersion: number;
  floors: FloorRecord[];
  /** Preference for which floor the editor opens. */
  activeFloorId?: string;
}

export interface ProjectStore {
  list(): Promise<ProjectRecord[]>;
  get(id: string): Promise<ProjectRecord | null>;
  save(record: ProjectRecord): Promise<void>;
  delete(id: string): Promise<void>;
}
