import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryProjectStore } from '@sandbox/editor-core';
import {
  createProject,
  formatRelativeUpdatedAt,
  listProjects,
  renameProject,
  setProjectStoreForTests,
} from './useProjects';

describe('useProjects helpers', () => {
  beforeEach(() => {
    setProjectStoreForTests(new MemoryProjectStore());
  });

  it('creates and lists projects', async () => {
    const created = await createProject('Тест');
    const listed = await listProjects();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.id);
    expect(listed[0]?.name).toBe('Тест');
  });

  it('renames a project', async () => {
    const created = await createProject('Старое');
    const renamed = await renameProject(created.id, 'Новое');
    expect(renamed?.name).toBe('Новое');
  });

  it('formats relative updated times in Russian', () => {
    const now = 1_000_000;
    expect(formatRelativeUpdatedAt(now, now)).toBe('только что');
    expect(formatRelativeUpdatedAt(now - 5 * 60_000, now)).toBe('5 мин назад');
  });
});
