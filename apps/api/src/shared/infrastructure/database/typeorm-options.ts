import type { DataSourceOptions } from 'typeorm';
import { TYPEORM_ENTITIES } from './entities/index.js';
import { InitialSchema20261008120000 } from './migrations/20261008120000-initial-schema.js';
import { GlobalSearchSchema20261008130500 } from './migrations/20261008130500-global-search-schema.js';
import { DocumentFieldValuesBackfill20261008130600 } from './migrations/20261008130600-document-field-values-backfill.js';
import { SearchIndexBackfill20261008130700 } from './migrations/20261008130700-search-index-backfill.js';
import { SchemaNormalization3nf20261008131000 } from './migrations/20261008131000-schema-normalization-3nf.js';

export const TYPEORM_INITIAL_MIGRATION_TIMESTAMP = 20261008120000;
export const TYPEORM_INITIAL_MIGRATION_NAME = 'InitialSchema20261008120000';

/** Set only by `scripts/export-openapi.mts` to skip TypeORM during OpenAPI export; `main.ts` refuses to boot when this is set. */
export function isOpenApiHeadlessMode(): boolean {
  return process.env['DOCUVATE_OPENAPI_HEADLESS'] === '1';
}

/** Vitest contract suite (`vitest.contract.config.ts`); skips TypeORM like headless export without using `DOCUVATE_OPENAPI_HEADLESS`. */
export function isOpenApiContractTestMode(): boolean {
  return process.env['DOCUVATE_OPENAPI_CONTRACT'] === '1';
}

export function buildTypeOrmOptions(): DataSourceOptions {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  return {
    type: 'postgres',
    url,
    entities: [...TYPEORM_ENTITIES],
    migrations: [
      InitialSchema20261008120000,
      GlobalSearchSchema20261008130500,
      DocumentFieldValuesBackfill20261008130600,
      SearchIndexBackfill20261008130700,
      SchemaNormalization3nf20261008131000,
    ],
    migrationsTableName: 'migrations',
    synchronize: false,
    migrationsRun: false,
    migrationsTransactionMode: 'each',
    logging: process.env['TYPEORM_LOGGING'] === 'true',
  };
}
