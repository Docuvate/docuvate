// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { GlobalChatSuggestionBootstrapDto } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import {
  parseNumber,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { clampCursorListLimit } from '../../../shared/infrastructure/pagination/clamp-cursor-list-limit.js';

const AMOUNT_FIELD_KEYS = [
  'global:amount',
  'global:betrag',
  'global:summe',
  'global:total',
  'global:brutto',
  'global:bruttobetrag',
];
const CONTRACT_END_FIELD_KEYS = [
  'global:contract_end',
  'global:vertragsende',
  'global:end_date',
  'global:laufzeit_ende',
];

@Injectable()
export class GetGlobalChatSuggestionBootstrapUseCase {
  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository
  ) {}

  async execute(userId: string): Promise<GlobalChatSuggestionBootstrapDto> {
    const topTag = await this.loadTopTag(userId);
    const [amountTaggedDocumentCount, contractEndSample, threadPage] = await Promise.all([
      topTag ? this.countDocumentsWithAmountForTag(userId, topTag.id) : Promise.resolve(0),
      this.loadContractEndSample(userId),
      this.threads.listThreadsForLibrary(userId, { limit: clampCursorListLimit(20) }),
    ]);

    const recentQuestions: string[] = [];
    const seen = new Set<string>();
    for (const thread of threadPage.threads) {
      const preview = thread.lastMessagePreview?.trim();
      if (!preview || preview.length < 4) continue;
      const key = preview.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      recentQuestions.push(preview);
      if (recentQuestions.length >= 3) break;
    }

    return {
      topTagId: topTag?.id ?? null,
      topTagName: topTag?.name ?? null,
      topTagDocumentCount: topTag?.documentCount ?? 0,
      amountTaggedDocumentCount,
      contractEndSample: contractEndSample ?? undefined,
      recentQuestions,
    };
  }

  private async loadTopTag(
    userId: string
  ): Promise<{ id: string; name: string; documentCount: number } | null> {
    const result = await this.pool.query(
      `SELECT t.id, t.name, COUNT(*)::int AS document_count
       FROM document_tags dt
       INNER JOIN documents d ON d.id = dt.document_id
       INNER JOIN tags t ON t.id = dt.tag_id
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND t.is_inbox = false
       GROUP BY t.id, t.name
       ORDER BY document_count DESC, t.name ASC
       LIMIT 1`,
      [userId]
    );
    const rawFirst: unknown = result.rows[0];
    if (rawFirst === undefined) {
      return null;
    }
    const parsed = requireRecord(rawFirst);
    return {
      id: parseString(parsed.id),
      name: parseString(parsed.name),
      documentCount: parseNumber(parsed.document_count, 0),
    };
  }

  private async countDocumentsWithAmountForTag(userId: string, tagId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(DISTINCT d.id)::int AS count
       FROM documents d
       INNER JOIN document_tags dt ON dt.document_id = d.id AND dt.tag_id = $2
       INNER JOIN document_field_values v ON v.document_id = d.id
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND v.field_storage_key = ANY($3::text[])
         AND length(trim(v.value_text)) > 0`,
      [userId, tagId, AMOUNT_FIELD_KEYS]
    );
    const row = requireRecord(result.rows[0] ?? {});
    return parseNumber(row.count, 0);
  }

  private async loadContractEndSample(
    userId: string
  ): Promise<{ label: string; value: string } | null> {
    const result = await this.pool.query(
      `SELECT d.title, d.filename, v.value_text
       FROM document_field_values v
       INNER JOIN documents d ON d.id = v.document_id
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND v.field_storage_key = ANY($2::text[])
         AND length(trim(v.value_text)) > 0
       ORDER BY d.updated_at DESC
       LIMIT 1`,
      [userId, CONTRACT_END_FIELD_KEYS]
    );
    const rawFirst: unknown = result.rows[0];
    if (rawFirst === undefined) {
      return null;
    }
    const parsed = requireRecord(rawFirst);
    const title = parseString(parsed.title).trim();
    const filename = parseString(parsed.filename).trim();
    const value = parseString(parsed.value_text).trim();
    const label = title.length > 0 ? title : filename;
    if (label.length === 0 || value.length === 0) return null;
    return { label, value };
  }
}
