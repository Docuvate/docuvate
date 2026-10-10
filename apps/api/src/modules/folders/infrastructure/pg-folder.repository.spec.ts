// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { stubPgPool } from '../../../shared/infrastructure/database/pg-pool.spec-util.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
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
    const moduleRef = await Test.createTestingModule({
      providers: [
        PgFolderRepository,
        { provide: PG_POOL, useValue: stubPgPool({ query }) },
      ],
    }).compile();
    const repo = moduleRef.get(PgFolderRepository);

    const items = await repo.listForUser('user-1');

    expect(query).toHaveBeenCalledOnce();
    expect(query.mock.calls[0]).toBeDefined();
    const firstCall = query.mock.calls[0];
    expect(firstCall[0]).toEqual(expect.stringContaining('COUNT(d.id)'));
    expect(firstCall[0]).toEqual(expect.stringContaining('document_stack_members'));
    expect(firstCall[0]).toEqual(expect.stringContaining('f.user_id = $1'));
    expect(firstCall[1]).toEqual(['user-1']);

    expect(items).toHaveLength(2);
    expect(items.find((f) => f.id === 'folder-empty')?.documentCount).toBe(0);
    expect(items.find((f) => f.id === 'folder-haus')?.documentCount).toBe(3);
  });
});
