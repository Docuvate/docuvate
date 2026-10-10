// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type IORedis from 'ioredis';

import { createValkeyConnection } from '../../../shared/infrastructure/valkey/valkey-connection.js';

const KEY_PREFIX = 'chat:gen:cancel:';
const TTL_SECONDS = 60 * 60;

@Injectable()
export class DocumentChatGenerationCancelRegistry implements OnModuleDestroy {
  private connection: IORedis | null = null;

  private getConnection(): IORedis {
    this.connection ??= createValkeyConnection();
    return this.connection;
  }

  async requestCancel(messageId: string): Promise<void> {
    await this.getConnection().set(`${KEY_PREFIX}${messageId}`, '1', 'EX', TTL_SECONDS);
  }

  async isCancelled(messageId: string): Promise<boolean> {
    const value = await this.getConnection().get(`${KEY_PREFIX}${messageId}`);
    return value === '1';
  }

  async clear(messageId: string): Promise<void> {
    await this.getConnection().del(`${KEY_PREFIX}${messageId}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.quit();
  }
}
