// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import * as Minio from 'minio';
import pg from 'pg';

import { Public } from '../../shared/infrastructure/auth/public.decorator.js';
import { PG_POOL } from '../../shared/infrastructure/database/tokens.js';
import { createMinioClientOptionsFromEnv } from '../../shared/infrastructure/storage/minio-client.config.js';
import { createValkeyConnection } from '../../shared/infrastructure/valkey/valkey-connection.js';
import { fetchWorkerDependency } from '../../shared/infrastructure/worker/worker-dependency-fetch.js';
import {
  HealthResponseDto,
  ReadinessResponseDto,
} from '../../shared/presentation/dtos/health.dto.js';
import { DatabaseMigrationReadinessService } from './database-migration-readiness.service.js';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    @Inject(DatabaseMigrationReadinessService)
    private readonly migrationReadiness: DatabaseMigrationReadinessService
  ) {}

  @Public()
  @Get()
  health(): HealthResponseDto {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async ready(): Promise<ReadinessResponseDto> {
    const checks: Record<string, string> = {};

    try {
      await this.pool.query('SELECT 1');
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'fail';
    }

    try {
      const redis = createValkeyConnection();
      await redis.ping();
      await redis.quit();
      checks.valkey = 'ok';
    } catch {
      checks.valkey = 'fail';
    }

    const workerUrl = process.env['WORKER_URL'];
    if (workerUrl) {
      try {
        const response = await fetchWorkerDependency(workerUrl, '/health');
        checks.worker = response?.ok ? 'ok' : 'fail';
      } catch {
        checks.worker = 'fail';
      }
    }

    try {
      const client = new Minio.Client(createMinioClientOptionsFromEnv());
      await client.bucketExists(process.env['MINIO_BUCKET'] ?? 'documents');
      checks.minio = 'ok';
    } catch {
      checks.minio = 'fail';
    }

    try {
      const pending = await this.migrationReadiness.listPendingMigrationNames();
      if (pending.length > 0) {
        checks.migrations = 'fail';
        this.logger.error(
          `Readiness: pending database migrations (${String(pending.length)}): ${pending.join(', ')}`
        );
      } else {
        checks.migrations = 'ok';
      }
    } catch (err: unknown) {
      checks.migrations = 'fail';
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Readiness: could not verify database migrations: ${message}`);
    }

    const healthy = Object.values(checks).every((v) => v === 'ok');
    return { status: healthy ? 'ready' : 'degraded', checks };
  }
}
