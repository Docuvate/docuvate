// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import type {
  UserPreferencesEntity,
  UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { parseOptionalString, requireRecord } from '../../../shared/domain/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

function parseRequiredLabelIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }
  return [];
}

function mapRow(row: Record<string, unknown>): UserPreferencesEntity {
  return {
    userId: String(row.user_id),
    preferredExtractorEngine: String(row.preferred_extractor_engine),
    useArenaWinnerAsDefault: Boolean(row.use_arena_winner_as_default),
    arenaWinnerEngine: parseOptionalString(row.arena_winner_engine),
    labelNearSimilarityThreshold:
      row.label_near_similarity_threshold != null
        ? Number(row.label_near_similarity_threshold)
        : 0.62,
    fieldExtractionConfidenceGateEnabled:
      row.field_extraction_confidence_gate_enabled != null
        ? Boolean(row.field_extraction_confidence_gate_enabled)
        : true,
    fieldExtractionRequiredLabelIds: parseRequiredLabelIds(row.required_label_ids),
    advancedFeaturesEnabled:
      row.advanced_features_enabled != null ? Boolean(row.advanced_features_enabled) : false,
    themePreference:
      row.theme_preference === 'light' ||
      row.theme_preference === 'dark' ||
      row.theme_preference === 'system'
        ? row.theme_preference
        : 'system',
    locale: row.locale === 'de' || row.locale === 'en' ? row.locale : null,
    updatedAt: new Date(String(row.updated_at)),
  };
}

const DEFAULTS: Omit<UserPreferencesEntity, 'userId'> = {
  preferredExtractorEngine: 'pipeline',
  useArenaWinnerAsDefault: false,
  arenaWinnerEngine: null,
  labelNearSimilarityThreshold: 0.62,
  fieldExtractionConfidenceGateEnabled: true,
  fieldExtractionRequiredLabelIds: [],
  advancedFeaturesEnabled: false,
  themePreference: 'system',
  locale: null,
  updatedAt: new Date(0),
};

const SELECT_PREFERENCES_SQL = `
  SELECT up.*,
    COALESCE(
      (
        SELECT array_agg(upl.tag_id::text ORDER BY upl.tag_id)
        FROM user_preference_required_labels upl
        WHERE upl.user_id = up.user_id
      ),
      ARRAY[]::text[]
    ) AS required_label_ids
  FROM user_preferences up
  WHERE up.user_id = $1
`;

async function syncRequiredLabels(
  client: pg.PoolClient,
  userId: string,
  tagIds: string[]
): Promise<void> {
  await client.query(`DELETE FROM user_preference_required_labels WHERE user_id = $1`, [userId]);
  if (tagIds.length === 0) return;
  await client.query(
    `INSERT INTO user_preference_required_labels (user_id, tag_id)
     SELECT $1, t.id FROM tags t
     WHERE t.user_id = $1 AND t.id::text = ANY($2::text[])
     ON CONFLICT DO NOTHING`,
    [userId, tagIds]
  );
}

@Injectable()
export class PgUserPreferencesRepository implements UserPreferencesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async getForUser(userId: string): Promise<UserPreferencesEntity> {
    const result = await this.pool.query(SELECT_PREFERENCES_SQL, [userId]);
    if (result.rows.length === 0) {
      return { userId, ...DEFAULTS };
    }
    return mapRow(requireRecord(result.rows[0]));
  }

  async upsert(
    userId: string,
    patch: {
      preferredExtractorEngine?: string;
      useArenaWinnerAsDefault?: boolean;
      arenaWinnerEngine?: string | null;
      labelNearSimilarityThreshold?: number;
      fieldExtractionConfidenceGateEnabled?: boolean;
      fieldExtractionRequiredLabelIds?: string[];
      advancedFeaturesEnabled?: boolean;
      themePreference?: 'light' | 'dark' | 'system';
      locale?: 'de' | 'en' | null;
    }
  ): Promise<UserPreferencesEntity> {
    const existing = await this.getForUser(userId);
    const next = {
      preferredExtractorEngine: patch.preferredExtractorEngine ?? existing.preferredExtractorEngine,
      useArenaWinnerAsDefault: patch.useArenaWinnerAsDefault ?? existing.useArenaWinnerAsDefault,
      arenaWinnerEngine:
        patch.arenaWinnerEngine !== undefined
          ? patch.arenaWinnerEngine
          : existing.arenaWinnerEngine,
      labelNearSimilarityThreshold:
        patch.labelNearSimilarityThreshold ?? existing.labelNearSimilarityThreshold,
      fieldExtractionConfidenceGateEnabled:
        patch.fieldExtractionConfidenceGateEnabled ?? existing.fieldExtractionConfidenceGateEnabled,
      fieldExtractionRequiredLabelIds:
        patch.fieldExtractionRequiredLabelIds ?? existing.fieldExtractionRequiredLabelIds,
      advancedFeaturesEnabled: patch.advancedFeaturesEnabled ?? existing.advancedFeaturesEnabled,
      themePreference: patch.themePreference ?? existing.themePreference,
      locale: patch.locale !== undefined ? patch.locale : existing.locale,
    };

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO user_preferences (
           user_id, preferred_extractor_engine,
           use_arena_winner_as_default, arena_winner_engine,
           label_near_similarity_threshold,
           field_extraction_confidence_gate_enabled,
           advanced_features_enabled,
           theme_preference,
           locale,
           updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
         ON CONFLICT (user_id) DO UPDATE SET
           preferred_extractor_engine = EXCLUDED.preferred_extractor_engine,
           use_arena_winner_as_default = EXCLUDED.use_arena_winner_as_default,
           arena_winner_engine = EXCLUDED.arena_winner_engine,
           label_near_similarity_threshold = EXCLUDED.label_near_similarity_threshold,
           field_extraction_confidence_gate_enabled = EXCLUDED.field_extraction_confidence_gate_enabled,
           advanced_features_enabled = EXCLUDED.advanced_features_enabled,
           theme_preference = EXCLUDED.theme_preference,
           locale = EXCLUDED.locale,
           updated_at = now()`,
        [
          userId,
          next.preferredExtractorEngine,
          next.useArenaWinnerAsDefault,
          next.arenaWinnerEngine,
          next.labelNearSimilarityThreshold,
          next.fieldExtractionConfidenceGateEnabled,
          next.advancedFeaturesEnabled,
          next.themePreference,
          next.locale,
        ]
      );
      await syncRequiredLabels(client, userId, next.fieldExtractionRequiredLabelIds);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return this.getForUser(userId);
  }

  async recordArenaRating(input: {
    userId: string;
    documentId: string | null;
    winnerEngine: string;
    comparedEngines: string[];
    rating?: number | null;
    source?: 'manual' | 'sample';
    compareSnapshot?: Record<string, unknown> | null;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO extraction_arena_ratings (
           user_id, document_id, winner_engine, rating, source, compare_snapshot
         ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         RETURNING id`,
        [
          input.userId,
          input.documentId,
          input.winnerEngine,
          input.rating ?? null,
          input.source ?? 'manual',
          input.compareSnapshot != null ? JSON.stringify(input.compareSnapshot) : null,
        ]
      );
      const ratingId = inserted.rows[0]?.id;
      if (!ratingId) {
        throw new Error('extraction_arena_ratings insert missing id');
      }
      let sortOrder = 0;
      for (const engine of input.comparedEngines) {
        const name = engine.trim();
        if (!name) {
          continue;
        }
        await client.query(
          `INSERT INTO extraction_arena_rating_compared_engines (rating_id, engine_name, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [ratingId, name, sortOrder]
        );
        sortOrder += 1;
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
