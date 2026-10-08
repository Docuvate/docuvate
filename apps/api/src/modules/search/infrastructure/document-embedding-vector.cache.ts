import type pg from 'pg';

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

    let rows: Array<{ document_id: string; embedding: unknown }>;
    if (documentIds && documentIds.length > 0) {
      const result = await pool.query<{ document_id: string; embedding: unknown }>(
        `SELECT document_id, embedding FROM document_embeddings
         WHERE user_id = $1 AND document_id = ANY($2::uuid[])`,
        [userId, documentIds]
      );
      rows = result.rows;
    } else {
      const result = await pool.query<{ document_id: string; embedding: unknown }>(
        `SELECT document_id, embedding FROM document_embeddings WHERE user_id = $1 LIMIT 10000`,
        [userId]
      );
      rows = result.rows;
    }

    const byDocumentId = new Map<string, number[]>();
    for (const row of rows) {
      const raw = row.embedding;
      if (Array.isArray(raw) && raw.length > 0) {
        byDocumentId.set(row.document_id, raw as number[]);
      }
    }

    if (!documentIds) {
      if (this.users.size >= MAX_USERS) {
        const oldest = [...this.users.entries()].sort((a, b) => a[1].loadedAt - b[1].loadedAt)[0];
        if (oldest) this.users.delete(oldest[0]);
      }
      this.users.set(userId, { loadedAt: now, byDocumentId });
      return byDocumentId;
    }

    return byDocumentId;
  }
}
