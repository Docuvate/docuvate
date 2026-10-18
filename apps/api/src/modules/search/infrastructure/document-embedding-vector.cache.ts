// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';

function parseEmbeddingVector(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }
  const nums: number[] = [];
  for (const value of raw) {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) {
      return null;
    }
    nums.push(n);
  }
  return nums;
}

const TTL_MS = 120_000;
const MAX_USERS = 32;

interface UserCacheEntry {
  loadedAt: number;
  byDocumentId: Map<string, number[]>;
}

/** In-memory decode cache for document_embeddings JSONB (invalidates on TTL). */
export class DocumentEmbeddingVectorCache {
  private readonly users = new Map<string, UserCacheEntry>();

  invalidate(userId: string): void {
    this.users.delete(userId);
  }

  async loadForDocuments(
    pool: pg.Pool,
    userId: string,
    documentIds: string[] | null,
    options: { bypassCache?: boolean } = {}
  ): Promise<Map<string, number[]>> {
    const now = Date.now();
    if (!options.bypassCache) {
      const hit = this.users.get(userId);
      if (hit && now - hit.loadedAt < TTL_MS) {
        if (!documentIds) return hit.byDocumentId;
        const subset = new Map<string, number[]>();
        for (const id of documentIds) {
          const v = hit.byDocumentId.get(id);
          if (v) subset.set(id, v);
        }
        return subset;
      }
    }

    let rows: { document_id: string; embedding: unknown }[];
    if (documentIds && documentIds.length > 0) {
      const result = await pool.query<{ document_id: string; embedding: unknown }>(
        `SELECT e.document_id, e.embedding
         FROM document_embeddings e
         JOIN documents d ON d.id = e.document_id
         WHERE d.user_id = $1 AND e.document_id = ANY($2::uuid[])`,
        [userId, documentIds]
      );
      rows = result.rows;
    } else {
      const result = await pool.query<{ document_id: string; embedding: unknown }>(
        `SELECT e.document_id, e.embedding
         FROM document_embeddings e
         JOIN documents d ON d.id = e.document_id
         WHERE d.user_id = $1
         LIMIT 10000`,
        [userId]
      );
      rows = result.rows;
    }

    const byDocumentId = new Map<string, number[]>();
    for (const row of rows) {
      const vec = parseEmbeddingVector(row.embedding);
      if (vec) {
        byDocumentId.set(row.document_id, vec);
      }
    }

    if (!documentIds) {
      if (this.users.size >= MAX_USERS) {
        const oldestKey = [...this.users.entries()].sort(
          (a, b) => a[1].loadedAt - b[1].loadedAt
        )[0][0];
        this.users.delete(oldestKey);
      }
      this.users.set(userId, { loadedAt: now, byDocumentId });
      return byDocumentId;
    }

    return byDocumentId;
  }
}
