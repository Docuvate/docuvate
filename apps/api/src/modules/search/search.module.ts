import { Module } from '@nestjs/common';
import { DOCUMENT_FIELD_VALUE_SYNC, EMBEDDING_PORT } from '../../shared/domain/ports.js';
import { HttpEmbeddingAdapter } from '../labels/infrastructure/http-embedding.adapter.js';
import { GlobalSearchUseCase } from './application/global-search.use-case.js';
import { SyncDocumentFieldValuesUseCase } from './application/sync-document-field-values.use-case.js';
import { SyncDocumentSearchIndexUseCase } from './application/sync-document-search-index.use-case.js';
import { PgDocumentFieldValueSyncAdapter } from './infrastructure/pg-document-field-value-sync.adapter.js';
import { PgGlobalSearchRepository } from './infrastructure/pg-global-search.repository.js';
import { SearchController } from './presentation/search.controller.js';

@Module({
  imports: [],
  controllers: [SearchController],
  providers: [
    GlobalSearchUseCase,
    SyncDocumentFieldValuesUseCase,
    SyncDocumentSearchIndexUseCase,
    PgGlobalSearchRepository,
    { provide: DOCUMENT_FIELD_VALUE_SYNC, useClass: PgDocumentFieldValueSyncAdapter },
    { provide: EMBEDDING_PORT, useClass: HttpEmbeddingAdapter },
  ],
  exports: [
    GlobalSearchUseCase,
    SyncDocumentFieldValuesUseCase,
    SyncDocumentSearchIndexUseCase,
    PgGlobalSearchRepository,
  ],
})
export class SearchModule {}
