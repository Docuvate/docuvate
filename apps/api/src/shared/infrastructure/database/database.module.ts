// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import pg from 'pg';

import { PgDocumentRepository } from '../../../modules/documents/infrastructure/pg-document.repository.js';
import { PostgresSearchAdapter } from '../../../modules/documents/infrastructure/postgres-search.adapter.js';
import { PgDuplicateRepository } from '../../../modules/duplicates/infrastructure/pg-duplicate.repository.js';
import { PgDuplicateStackRepository } from '../../../modules/duplicates/infrastructure/pg-duplicate-stack.repository.js';
import { HttpExtractionAdapter } from '../../../modules/extraction/infrastructure/http-extraction.adapter.js';
import { PgFolderRepository } from '../../../modules/folders/infrastructure/pg-folder.repository.js';
import { HttpLabelFieldExtractionAdapter } from '../../../modules/labels/infrastructure/http-label-field-extraction.adapter.js';
import { PgTagCustomFieldRepository } from '../../../modules/labels/infrastructure/pg-tag-custom-field.repository.js';
import { PgMappeRepository } from '../../../modules/mappen/infrastructure/pg-mappe.repository.js';
import { PgRecognizedFieldRepository } from '../../../modules/recognized-fields/infrastructure/pg-recognized-field.repository.js';
import { PgTaxonomyRepository } from '../../../modules/taxonomy/infrastructure/pg-taxonomy.repository.js';
import {
  CLOCK,
  DOCUMENT_REPOSITORY,
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
  EXTRACTION_PORT,
  FOLDER_REPOSITORY,
  ID_GENERATOR,
  LABEL_FIELD_EXTRACTION_PORT,
  MAPPE_REPOSITORY,
  OBJECT_STORAGE,
  RECOGNIZED_FIELD_REPOSITORY,
  SEARCH_PORT,
  TAG_CUSTOM_FIELD_REPOSITORY,
  TAXONOMY_REPOSITORY,
} from '../../domain/ports.js';
import { DocumentChatModule } from '../chat/document-chat.module.js';
import { UuidIdGenerator } from '../ids/uuid-id-generator.js';
import { MinioObjectStorage } from '../storage/minio-object.storage.js';
import { SystemClock } from '../time/system-clock.js';
import { PG_POOL } from './tokens.js';
import {
  buildTypeOrmOptions,
  isOpenApiContractTestMode,
  isOpenApiHeadlessMode,
} from './typeorm-options.js';

const typeOrmRootImports =
  isOpenApiHeadlessMode() || isOpenApiContractTestMode()
    ? []
    : [
        TypeOrmModule.forRoot({
          ...buildTypeOrmOptions(),
          autoLoadEntities: false,
        }),
      ];

@Global()
@Module({
  imports: [...typeOrmRootImports, DocumentChatModule],
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        const url = process.env.DATABASE_URL;
        if (!url) throw new Error('DATABASE_URL is required');
        return new pg.Pool({ connectionString: url });
      },
    },
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    { provide: DOCUMENT_REPOSITORY, useClass: PgDocumentRepository },
    { provide: TAXONOMY_REPOSITORY, useClass: PgTaxonomyRepository },
    { provide: OBJECT_STORAGE, useClass: MinioObjectStorage },
    { provide: EXTRACTION_PORT, useClass: HttpExtractionAdapter },
    { provide: SEARCH_PORT, useClass: PostgresSearchAdapter },
    { provide: FOLDER_REPOSITORY, useClass: PgFolderRepository },
    { provide: MAPPE_REPOSITORY, useClass: PgMappeRepository },
    { provide: DUPLICATE_REPOSITORY, useClass: PgDuplicateRepository },
    { provide: DUPLICATE_STACK_REPOSITORY, useClass: PgDuplicateStackRepository },
    { provide: TAG_CUSTOM_FIELD_REPOSITORY, useClass: PgTagCustomFieldRepository },
    { provide: LABEL_FIELD_EXTRACTION_PORT, useClass: HttpLabelFieldExtractionAdapter },
    { provide: RECOGNIZED_FIELD_REPOSITORY, useClass: PgRecognizedFieldRepository },
  ],
  exports: [
    PG_POOL,
    CLOCK,
    ID_GENERATOR,
    DOCUMENT_REPOSITORY,
    TAXONOMY_REPOSITORY,
    OBJECT_STORAGE,
    EXTRACTION_PORT,
    SEARCH_PORT,
    FOLDER_REPOSITORY,
    MAPPE_REPOSITORY,
    DUPLICATE_REPOSITORY,
    DUPLICATE_STACK_REPOSITORY,
    TAG_CUSTOM_FIELD_REPOSITORY,
    LABEL_FIELD_EXTRACTION_PORT,
    RECOGNIZED_FIELD_REPOSITORY,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class DatabaseModule {}
