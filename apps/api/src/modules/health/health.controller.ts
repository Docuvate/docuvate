import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../../shared/infrastructure/auth/public.decorator.js';
import { ApiExcludeController } from '@nestjs/swagger';
import IORedis from 'ioredis';
import pg from 'pg';
import * as Minio from 'minio';
import { PG_POOL } from '../../shared/infrastructure/database/tokens.js';
import { HealthResponseDto, ReadinessResponseDto } from '../../shared/presentation/dtos/health.dto.js';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

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
      const valkeyUrl = process.env['VALKEY_URL'] ?? 'redis://localhost:6379';
      const redis = new IORedis(valkeyUrl);
      await redis.ping();
      await redis.quit();
      checks.valkey = 'ok';
    } catch {
      checks.valkey = 'fail';
    }

    try {
      const client = new Minio.Client({
        endPoint: process.env['MINIO_ENDPOINT'] ?? 'localhost',
        port: Number(process.env['MINIO_PORT'] ?? 9000),
        useSSL: false,
        accessKey: process.env['MINIO_ACCESS_KEY'] ?? 'docuvate',
        secretKey: process.env['MINIO_SECRET_KEY'] ?? 'docuvate-secret',
      });
      await client.bucketExists(process.env['MINIO_BUCKET'] ?? 'documents');
      checks.minio = 'ok';
    } catch {
      checks.minio = 'fail';
    }

    const healthy = Object.values(checks).every((v) => v === 'ok');
    return { status: healthy ? 'ready' : 'degraded', checks };
  }
}
