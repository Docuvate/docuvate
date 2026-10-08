import type { DataSourceOptions } from 'typeorm';
import { TYPEORM_ENTITIES } from './entities/index.js';
import { InitialSchema20261008120000 } from './migrations/20261008120000-initial-schema.js';

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
    migrations: [InitialSchema20261008120000],
    migrationsTableName: 'migrations',
    synchronize: false,
    migrationsRun: false,
    logging: process.env['TYPEORM_LOGGING'] === 'true',
  };
}
