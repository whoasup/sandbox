import type { ProjectRecord, ProjectStore } from './ProjectStore';

/** In-memory `ProjectStore` for unit tests and non-browser environments. */
export class MemoryProjectStore implements ProjectStore {
  private readonly records = new Map<string, ProjectRecord>();

  public async list(): Promise<ProjectRecord[]> {
    return [...this.records.values()]
      .map((record) => structuredClone(record))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public async get(id: string): Promise<ProjectRecord | null> {
    const record = this.records.get(id);
    return record ? structuredClone(record) : null;
  }

  public async save(record: ProjectRecord): Promise<void> {
    this.records.set(record.id, structuredClone(record));
  }

  public async delete(id: string): Promise<void> {
    this.records.delete(id);
  }
}
