import { Injectable, OnModuleDestroy } from '@nestjs/common';
import IORedis from 'ioredis';

const KEY_PREFIX = 'chat:gen:cancel:';
const TTL_SECONDS = 60 * 60;

@Injectable()
export class DocumentChatGenerationCancelRegistry implements OnModuleDestroy {
  private connection: IORedis | null = null;

  private getConnection(): IORedis {
    if (!this.connection) {
      const valkeyUrl = process.env['VALKEY_URL'] ?? 'redis://localhost:6379';
      this.connection = new IORedis(valkeyUrl, { maxRetriesPerRequest: null });
    }
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
