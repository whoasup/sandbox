import type { ProjectRecord } from './ProjectStore';
import { tryHydrateStoredRecord } from './migrations';

/** Hydrate one stored row and persist if the schema was upgraded. */
export async function upgradeOnRead(
  raw: unknown | null | undefined,
  persist: (record: ProjectRecord) => Promise<void>,
): Promise<ProjectRecord | null> {
  if (raw == null) return null;
  const result = tryHydrateStoredRecord(raw);
  if (!result) return null;
  if (result.upgraded) await persist(result.record);
  return result.record;
}

export async function upgradeOnList(
  raws: unknown[],
  persist: (record: ProjectRecord) => Promise<void>,
): Promise<ProjectRecord[]> {
  const records: ProjectRecord[] = [];
  for (const raw of raws) {
    const record = await upgradeOnRead(raw, persist);
    if (record) records.push(record);
  }
  return records.sort((a, b) => b.updatedAt - a.updatedAt);
}
