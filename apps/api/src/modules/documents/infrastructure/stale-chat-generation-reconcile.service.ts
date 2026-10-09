import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';

const DEFAULT_STALE_MS = 120_000;
const RECONCILE_INTERVAL_MS = 60_000;

function staleGenerationMaxAgeMs(): number {
  const raw = process.env['DOCUMENT_CHAT_GENERATION_STALE_MS'];
  if (!raw) {
    return DEFAULT_STALE_MS;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_STALE_MS;
}

@Injectable()
export class StaleChatGenerationReconcileService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StaleChatGenerationReconcileService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reconcileOnce();
    this.intervalId = setInterval(() => {
      void this.reconcileOnce();
    }, RECONCILE_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async reconcileOnce(): Promise<void> {
    try {
      const count = await this.threads.failStaleAssistantGenerations(staleGenerationMaxAgeMs());
      if (count > 0) {
        this.logger.warn(`Marked ${count} stale chat assistant message(s) as generation_timeout`);
      }
    } catch (err) {
      this.logger.warn(`Stale chat generation reconcile failed: ${String(err)}`);
    }
  }
}
