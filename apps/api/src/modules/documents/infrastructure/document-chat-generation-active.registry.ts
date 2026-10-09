// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type IORedis from 'ioredis';
import { createValkeyConnection } from '../../../shared/infrastructure/valkey/valkey-connection.js';

const KEY_PREFIX = 'chat:gen:active:';
const TTL_SECONDS = 180;

@Injectable()
export class DocumentChatGenerationActiveRegistry implements OnModuleDestroy {
  private connection: IORedis | null = null;

  private getConnection(): IORedis {
    if (!this.connection) {
      this.connection = createValkeyConnection();
    }
    return this.connection;
  }

  async markActive(messageId: string): Promise<void> {
    await this.getConnection().set(`${KEY_PREFIX}${messageId}`, '1', 'EX', TTL_SECONDS);
  }

  async touchActive(messageId: string): Promise<void> {
    await this.getConnection().expire(`${KEY_PREFIX}${messageId}`, TTL_SECONDS);
    await this.getConnection().set(`${KEY_PREFIX}${messageId}`, '1', 'EX', TTL_SECONDS);
  }

  async clearActive(messageId: string): Promise<void> {
    await this.getConnection().del(`${KEY_PREFIX}${messageId}`);
  }

  async isActive(messageId: string): Promise<boolean> {
    const value = await this.getConnection().get(`${KEY_PREFIX}${messageId}`);
    return value === '1';
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.quit();
  }
}
