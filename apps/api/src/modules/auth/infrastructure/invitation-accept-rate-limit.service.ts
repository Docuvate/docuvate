// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { HttpException, HttpStatus, Injectable, OnModuleDestroy } from '@nestjs/common';
import IORedis from 'ioredis';

const WINDOW_SEC = 60;
const MAX_ATTEMPTS = 20;
const KEY_PREFIX = 'docuvate:invite-accept:';

@Injectable()
export class InvitationAcceptRateLimitService implements OnModuleDestroy {
  private readonly redis: IORedis;

  constructor() {
    const valkeyUrl = process.env['VALKEY_URL'] ?? 'redis://localhost:6379';
    this.redis = new IORedis(valkeyUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status === 'ready' || this.redis.status === 'connect') {
      await this.redis.quit().catch(() => this.redis.disconnect());
      return;
    }
    this.redis.disconnect();
  }

  async assertAllowed(clientIp: string): Promise<void> {
    const key = `${KEY_PREFIX}${clientIp || 'unknown'}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, WINDOW_SEC);
    }
    if (count > MAX_ATTEMPTS) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
