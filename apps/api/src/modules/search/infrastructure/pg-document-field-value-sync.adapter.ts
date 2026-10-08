import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type { ExtractedField } from '@docuvate/contracts';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { DocumentFieldValueSyncPort } from '../../../shared/domain/ports.js';
import {
  loadFieldDefinitionLookup,
  upsertDocumentFieldValues,
} from './document-field-value-index.js';

@Injectable()
export class PgDocumentFieldValueSyncAdapter implements DocumentFieldValueSyncPort {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async replaceForDocument(
    userId: string,
    documentId: string,
    fields: ExtractedField[]
  ): Promise<void> {
    const defs = await loadFieldDefinitionLookup(this.pool, userId);
    await upsertDocumentFieldValues(this.pool, userId, documentId, fields, defs);
  }
}
