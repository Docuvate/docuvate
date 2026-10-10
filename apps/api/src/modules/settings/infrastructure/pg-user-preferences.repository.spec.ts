// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import type pg from 'pg';
import { describe, expect, it, vi } from 'vitest';

import {
  createStubPoolClientWithQueryMock,
  stubPgPoolWithQueryMock,
} from '../../../shared/infrastructure/database/pg-pool.spec-util.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { PgUserPreferencesRepository } from './pg-user-preferences.repository.js';

describe('PgUserPreferencesRepository.upsert', () => {
  it('persists themePreference and locale on insert', async () => {
    const emptyResult = { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    const { queryMock } = createStubPoolClientWithQueryMock(
      vi.fn((queryTextOrConfig: string | pg.QueryConfig) => {
        const sql =
          typeof queryTextOrConfig === 'string' ? queryTextOrConfig : queryTextOrConfig.text;
        if (sql.includes('INSERT INTO user_preferences')) {
          return Promise.resolve(emptyResult);
        }
        return Promise.resolve({
          ...emptyResult,
          rows: [
            {
              user_id: 'user-1',
              preferred_extractor_engine: 'pipeline',
              preferred_chat_provider: null,
              use_arena_winner_as_default: false,
              arena_winner_engine: null,
              label_field_confidence_threshold: 0.62,
              label_near_similarity_threshold: 0.62,
              field_extraction_confidence_gate_enabled: true,
              required_label_ids: [],
              advanced_features_enabled: false,
              theme_preference: 'dark',
              locale: 'en',
              updated_at: '2026-01-01T00:00:00.000Z',
            },
          ],
        });
      })
    );
    const pool = stubPgPoolWithQueryMock(queryMock);
    const moduleRef = await Test.createTestingModule({
      providers: [
        PgUserPreferencesRepository,
        { provide: PG_POOL, useValue: pool },
      ],
    }).compile();
    const repo = moduleRef.get(PgUserPreferencesRepository);

    const row = await repo.upsert('user-1', {
      themePreference: 'dark',
      locale: 'en',
    });

    const insertCall = queryMock.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('INSERT INTO user_preferences')
    );
    expect(insertCall).toBeDefined();
    if (insertCall === undefined) {
      throw new Error('expected insert call');
    }
    expect(insertCall[1]).toEqual(expect.arrayContaining(['user-1', 'dark', 'en']));
    expect(row.themePreference).toBe('dark');
    expect(row.locale).toBe('en');
  });
});
