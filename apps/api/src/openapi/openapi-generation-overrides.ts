import type { TestingModuleBuilder } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DocumentChatGenerationCancelRegistry } from '../modules/documents/infrastructure/document-chat-generation-cancel.registry.js';
import { DocumentChatGenerationQueueService } from '../modules/documents/infrastructure/document-chat-generation-queue.service.js';
import { ExtractionQueueService } from '../modules/extraction/infrastructure/extraction-queue.service.js';
import { MlRetrainQueueService } from '../modules/model-registry/infrastructure/ml-retrain-queue.service.js';
import { PaperlessImportQueueService } from '../modules/connectors/infrastructure/adapters/paperless/paperless-import.queue.js';
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

type MockDataSource = {
  isInitialized: boolean;
  initialize: () => Promise<MockDataSource>;
  destroy: () => Promise<void>;
  runMigrations: () => Promise<unknown[]>;
  manager: { query: () => Promise<unknown[]> };
};

const mockDataSource: MockDataSource = {
  isInitialized: true,
  initialize: async (): Promise<MockDataSource> => mockDataSource,
  destroy: async (): Promise<void> => undefined,
  runMigrations: async (): Promise<unknown[]> => [],
  manager: {
    query: async (): Promise<unknown[]> => [],
  },
};

/** Headless OpenAPI export: no Postgres, Valkey, or BullMQ connections. */
export function applyOpenApiGenerationOverrides(builder: TestingModuleBuilder): TestingModuleBuilder {
  return builder
    .overrideProvider(getDataSourceToken())
    .useValue(mockDataSource)
    .overrideProvider(PG_POOL)
    .useValue(mockPool)
    .overrideProvider(ExtractionQueueService)
    .useValue(noopQueue)
    .overrideProvider(MlRetrainQueueService)
    .useValue(noopQueue)
    .overrideProvider(DocumentChatGenerationQueueService)
    .useValue(noopQueue)
    .overrideProvider(PaperlessImportQueueService)
    .useValue(noopQueue)
    .overrideProvider(DocumentChatGenerationCancelRegistry)
    .useValue(noopCancelRegistry);
}
