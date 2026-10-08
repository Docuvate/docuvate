import { describe, expect, it, vi } from 'vitest';
import type pg from 'pg';
import { PgFolderRepository } from './pg-folder.repository.js';

describe('PgFolderRepository.listForUser', () => {
  it('returns direct document counts per folder for the user (0 when empty)', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: 'folder-empty',
          user_id: 'user-1',
          name: 'Direkt',
          parent_id: null,
          mappe_id: 'mappe-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          document_count: 0,
        },
        {
          id: 'folder-haus',
          user_id: 'user-1',
          name: 'Haus',
          parent_id: null,
          mappe_id: 'mappe-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          document_count: 3,
        },
      ],
    });
    const pool = { query } as unknown as pg.Pool;
    const repo = new PgFolderRepository(pool);

    const items = await repo.listForUser('user-1');

    expect(query).toHaveBeenCalledOnce();
    const [sql, params] = query.mock.calls[0]!;
    expect(String(sql)).toContain('COUNT(d.id)');
    expect(String(sql)).toContain('GROUP BY f.id');
    expect(String(sql)).toContain('f.user_id = $1');
    expect(params).toEqual(['user-1']);

    expect(items).toHaveLength(2);
    expect(items.find((f) => f.id === 'folder-empty')?.documentCount).toBe(0);
    expect(items.find((f) => f.id === 'folder-haus')?.documentCount).toBe(3);
  });
});
