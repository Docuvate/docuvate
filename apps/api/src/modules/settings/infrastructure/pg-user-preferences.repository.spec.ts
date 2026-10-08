import { describe, expect, it, vi } from 'vitest';
import type pg from 'pg';
import { PgUserPreferencesRepository } from './pg-user-preferences.repository.js';

describe('PgUserPreferencesRepository.upsert', () => {
  it('persists themePreference and locale on insert', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
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
            field_extraction_required_label_ids: [],
            advanced_features_enabled: false,
            theme_preference: 'dark',
            locale: 'en',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
    const pool = { query } as unknown as pg.Pool;
    const repo = new PgUserPreferencesRepository(pool);

    const row = await repo.upsert('user-1', {
      themePreference: 'dark',
      locale: 'en',
    });

    const insertCall = query.mock.calls.find((call) =>
      String(call[0]).includes('INSERT INTO user_preferences')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall?.[1]).toEqual(
      expect.arrayContaining(['user-1', 'dark', 'en'])
    );
    expect(row.themePreference).toBe('dark');
    expect(row.locale).toBe('en');
  });
});
