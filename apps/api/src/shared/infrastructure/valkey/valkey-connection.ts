// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import IORedis, { type RedisOptions } from 'ioredis';

const DEFAULT_CONNECT_TIMEOUT_MS = 3_000;
const DEFAULT_READY_DEADLINE_MS = 30_000;

export function valkeyConnectTimeoutMs(): number {
  const raw = process.env.VALKEY_CONNECT_TIMEOUT_MS;
  if (!raw) {
    return DEFAULT_CONNECT_TIMEOUT_MS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CONNECT_TIMEOUT_MS;
  }
  return parsed;
}

export function createValkeyConnectionOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    connectTimeout: valkeyConnectTimeoutMs(),
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 30) {
        return null;
      }
      return Math.min(times * 100, 2_000);
    },
  };
}

export function createValkeyConnection(url?: string): IORedis {
  const valkeyUrl = url ?? process.env.VALKEY_URL ?? 'redis://localhost:6379';
  return new IORedis(valkeyUrl, createValkeyConnectionOptions());
}

export async function waitForValkeyReady(
  redis: IORedis,
  deadlineMs = DEFAULT_READY_DEADLINE_MS
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < deadlineMs) {
    try {
      await redis.ping();
      return;
    } catch {
      // Valkey still starting or reconnecting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Valkey not ready before deadline');
}
