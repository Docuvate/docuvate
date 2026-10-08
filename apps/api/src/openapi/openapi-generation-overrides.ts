import type { TestingModuleBuilder } from '@nestjs/testing';
import { DocumentChatGenerationCancelRegistry } from '../modules/documents/infrastructure/document-chat-generation-cancel.registry.js';
import { DocumentChatGenerationQueueService } from '../modules/documents/infrastructure/document-chat-generation-queue.service.js';
import { ExtractionQueueService } from '../modules/extraction/infrastructure/extraction-queue.service.js';
import { MlRetrainQueueService } from '../modules/model-registry/infrastructure/ml-retrain-queue.service.js';
import { PG_POOL } from '../shared/infrastructure/database/tokens.js';

const noopQueue = {
  onModuleInit: (): void => undefined,
  onModuleDestroy: (): void => undefined,
  enqueue: async (): Promise<void> => undefined,
  enqueueJob: async (): Promise<void> => undefined,
};

const noopCancelRegistry = {
  onModuleDestroy: (): void => undefined,
  requestCancel: async (): Promise<void> => undefined,
  isCancelled: async (): Promise<boolean> => false,
  clear: async (): Promise<void> => undefined,
};

const mockPool: Record<string, unknown> = {
  query: async () => ({ rows: [], rowCount: 0 }),
  connect: async () => ({
    query: async () => ({ rows: [], rowCount: 0 }),
    release: (): void => undefined,
  }),
  end: async (): Promise<void> => undefined,
  on: (): Record<string, unknown> => mockPool,
};

/** Headless OpenAPI export: no Postgres, Valkey, or BullMQ connections. */
export function applyOpenApiGenerationOverrides(builder: TestingModuleBuilder): TestingModuleBuilder {
  return builder
    .overrideProvider(PG_POOL)
    .useValue(mockPool)
    .overrideProvider(ExtractionQueueService)
    .useValue(noopQueue)
    .overrideProvider(MlRetrainQueueService)
    .useValue(noopQueue)
    .overrideProvider(DocumentChatGenerationQueueService)
    .useValue(noopQueue)
    .overrideProvider(DocumentChatGenerationCancelRegistry)
    .useValue(noopCancelRegistry);
}
