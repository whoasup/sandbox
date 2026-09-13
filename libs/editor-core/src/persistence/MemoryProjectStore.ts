import type { ProjectRecord, ProjectStore } from './ProjectStore';
import { upgradeOnList, upgradeOnRead } from './upgradeOnRead';

/** In-memory `ProjectStore` for unit tests and non-browser environments. */
export class MemoryProjectStore implements ProjectStore {
  private readonly records = new Map<string, unknown>();

  public async list(): Promise<ProjectRecord[]> {
    return upgradeOnList([...this.records.values()], (record) => this.save(record));
  }

  public async get(id: string): Promise<ProjectRecord | null> {
    return upgradeOnRead(this.records.get(id), (record) => this.save(record));
  }

  public async save(record: ProjectRecord): Promise<void> {
    this.records.set(record.id, structuredClone(record));
  }

  public async delete(id: string): Promise<void> {
    this.records.delete(id);
  }
}
