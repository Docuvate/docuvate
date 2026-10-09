import { Module } from '@nestjs/common';
import { EMBEDDING_PORT } from '../../shared/domain/ports.js';
import { HttpEmbeddingAdapter } from '../labels/infrastructure/http-embedding.adapter.js';
import { GlobalSearchUseCase } from './application/global-search.use-case.js';
import { SyncDocumentSearchIndexUseCase } from './application/sync-document-search-index.use-case.js';
import { PgGlobalSearchRepository } from './infrastructure/pg-global-search.repository.js';
import { SearchController } from './presentation/search.controller.js';

@Module({
  imports: [],
  controllers: [SearchController],
  providers: [
    GlobalSearchUseCase,
    SyncDocumentSearchIndexUseCase,
    PgGlobalSearchRepository,
    { provide: EMBEDDING_PORT, useClass: HttpEmbeddingAdapter },
  ],
  exports: [
    GlobalSearchUseCase,
    SyncDocumentSearchIndexUseCase,
    PgGlobalSearchRepository,
    EMBEDDING_PORT,
  ],
})
export class SearchModule {}
