import { Inject, Injectable } from '@nestjs/common';
import type { ExtractedField } from '@docuvate/contracts';
import {
  DOCUMENT_FIELD_VALUE_SYNC,
  type DocumentFieldValueSyncPort,
} from '../../../shared/domain/ports.js';

/** Single application entry for persisting searchable custom/recognized field values. */
@Injectable()
export class SyncDocumentFieldValuesUseCase {
  constructor(
    @Inject(DOCUMENT_FIELD_VALUE_SYNC) private readonly sync: DocumentFieldValueSyncPort
  ) {}

  async execute(userId: string, documentId: string, fields: ExtractedField[]): Promise<void> {
    await this.sync.replaceForDocument(userId, documentId, fields);
  }
}
