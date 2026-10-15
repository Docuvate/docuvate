// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { NestFactory } from '@nestjs/core';
import pg from 'pg';

import { AppModule } from '../../apps/api/dist/app.module.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../apps/api/dist/shared/domain/ports.js';
import { ApplyEmbeddingSuggestionsUseCase } from '../../apps/api/dist/modules/labels/application/apply-embedding-suggestions.use-case.js';
import {
  evaluateLabelHybridLeaveOneOut,
  trainUserLabelHybridModel,
  type LabelHybridDocumentRow,
} from '../../apps/api/dist/modules/labels/domain/label-hybrid-training.js';
import { suggestAssignRecommendations } from '../../apps/api/dist/modules/labels/domain/label-recommendation-scoring.js';

const LAB_EMAIL = process.env.DOCUVATE_TEST_EMAIL ?? 'thomas@docuvate.test';
const LOO_PRECISION_MIN = 0.95;

const UNLABELED_FILENAME_MARKERS = [
  'personalfragebogen',
  'ja auswertungen',
  'json_struktur',
  'zusammenfassung_huk24',
  'dpa-2024-08-01',
  'agenda kick-off',
  'tom',
] as const;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL required');
  }
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 3 });
  const userRow = await pool.query<{ id: string }>(
    `SELECT id FROM "user" WHERE lower(email) = lower($1) LIMIT 1`,
    [LAB_EMAIL]
  );
  const userId = userRow.rows[0]?.id;
  if (!userId) {
    throw new Error('lab user not found');
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const documents = app.get<DocumentRepository>(DOCUMENT_REPOSITORY);
    const labelEmbeddings = app.get<LabelEmbeddingRepository>(LABEL_EMBEDDING_REPOSITORY);
    const taxonomy = app.get<TaxonomyRepository>(TAXONOMY_REPOSITORY);
    const applyEmbedding = app.get(ApplyEmbeddingSuggestionsUseCase);

    const [readyDocs, embeddingRows, tags] = await Promise.all([
      documents.listForUser(userId, { status: 'ready' }),
      labelEmbeddings.listDocumentEmbeddingsForUser(userId),
      taxonomy.listTags(userId),
    ]);
    const tagNameById = new Map(tags.filter((t) => !t.isInbox).map((t) => [t.id, t.name]));

    const hybridRows: LabelHybridDocumentRow[] = embeddingRows.map((row) => {
      const doc = readyDocs.find((d) => d.id === row.documentId);
      const text = doc
        ? `${doc.title}\n${doc.filename}\n${doc.extraction?.text ?? ''}`.slice(0, 12000)
        : `${row.title}\n${row.filename}`;
      return {
        documentId: row.documentId,
        embedding: row.embedding,
        nonInboxTagIds: row.nonInboxTagIds,
        text,
      };
    });

    const loo = evaluateLabelHybridLeaveOneOut(hybridRows);
    const hybridModel = trainUserLabelHybridModel(hybridRows);

    const labelSupport = new Map<string, number>();
    for (const row of hybridRows) {
      for (const tagId of row.nonInboxTagIds) {
        labelSupport.set(tagId, (labelSupport.get(tagId) ?? 0) + 1);
      }
    }

    const unlabeledProbeDocs = readyDocs.filter((doc) => {
      const hay = `${doc.filename} ${doc.title}`.toLowerCase();
      const hasNonInbox = doc.tags.some((t) => !t.isInbox);
      return (
        !hasNonInbox &&
        UNLABELED_FILENAME_MARKERS.some((marker) => hay.includes(marker))
      );
    });

    const assignRows = suggestAssignRecommendations({
      rows: hybridRows,
      centroids: [],
      tagNameById,
      labelSupportCountByTagId: labelSupport,
      threshold: 0.62,
      dismissedKeys: new Set(),
      hybridModel,
    });
    const assignByDoc = new Map(assignRows.map((row) => [row.documentId, row]));

    let wrongUnlabeledSuggestions = 0;
    for (const doc of unlabeledProbeDocs) {
      if (assignByDoc.has(doc.id)) {
        wrongUnlabeledSuggestions += 1;
      }
    }

    for (const doc of unlabeledProbeDocs) {
      const text = doc.extraction?.text ?? '';
      if (text.trim().length < 20) {
        continue;
      }
      await applyEmbedding.execute(doc.id, userId, text);
    }

    const persistedWrong = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM document_tag_suggestions s
       JOIN documents d ON d.id = s.document_id
       WHERE d.user_id = $1
         AND NOT s.dismissed
         AND s.source IN ('embedding', 'embedding_density')
         AND d.id = ANY($2::uuid[])`,
      [userId, unlabeledProbeDocs.map((d) => d.id)]
    );

    console.log(
      JSON.stringify({
        label_hybrid_loo_precision: loo.precision,
        label_hybrid_loo_coverage: loo.coverage,
        label_hybrid_loo_evaluated: loo.evaluated,
        label_hybrid_loo_precision_ok: loo.precision >= LOO_PRECISION_MIN ? 1 : 0,
        label_unlabeled_probe_count: unlabeledProbeDocs.length,
        label_unlabeled_assign_recommendations_wrong: wrongUnlabeledSuggestions,
        label_unlabeled_persisted_suggestions_wrong: Number(
          persistedWrong.rows[0]?.count ?? 0
        ),
        label_unlabeled_zero_wrong_ok:
          wrongUnlabeledSuggestions === 0 &&
          Number(persistedWrong.rows[0]?.count ?? 0) === 0
            ? 1
            : 0,
      })
    );
  } finally {
    await app.close();
    await pool.end();
  }
}

void main();
