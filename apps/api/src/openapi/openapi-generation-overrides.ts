// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TestingModuleBuilder } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';

import { PaperlessImportQueueService } from '../modules/connectors/infrastructure/adapters/paperless/paperless-import.queue.js';
import { DocumentChatGenerationCancelRegistry } from '../modules/documents/infrastructure/document-chat-generation-cancel.registry.js';
import { DocumentChatGenerationQueueService } from '../modules/documents/infrastructure/document-chat-generation-queue.service.js';
import { ExtractionQueueService } from '../modules/extraction/infrastructure/extraction-queue.service.js';
import { MlRetrainQueueService } from '../modules/model-registry/infrastructure/ml-retrain-queue.service.js';
import { PG_POOL } from '../shared/infrastructure/database/tokens.js';

const noopQueue = {
  onModuleInit: (): void => undefined,
  onModuleDestroy: (): void => undefined,
  enqueue: (): Promise<void> => Promise.resolve(),
  enqueueJob: (): Promise<void> => Promise.resolve(),
};

const noopCancelRegistry = {
  onModuleDestroy: (): void => undefined,
  requestCancel: (): Promise<void> => Promise.resolve(),
  isCancelled: (): Promise<boolean> => Promise.resolve(false),
  clear: (): Promise<void> => Promise.resolve(),
};

const mockPool: Record<string, unknown> = {
  query: () => Promise.resolve({ rows: [], rowCount: 0 }),
  connect: () =>
    Promise.resolve({
      query: () => Promise.resolve({ rows: [], rowCount: 0 }),
      release: (): void => undefined,
    }),
  end: (): Promise<void> => Promise.resolve(),
  on: (): Record<string, unknown> => mockPool,
};

interface MockDataSource {
  isInitialized: boolean;
  initialize: () => Promise<MockDataSource>;
  destroy: () => Promise<void>;
  runMigrations: () => Promise<unknown[]>;
  manager: { query: () => Promise<unknown[]> };
}

const mockDataSource: MockDataSource = {
  isInitialized: true,
  initialize: (): Promise<MockDataSource> => Promise.resolve(mockDataSource),
  destroy: (): Promise<void> => Promise.resolve(),
  runMigrations: (): Promise<unknown[]> => Promise.resolve([]),
  manager: {
    query: (): Promise<unknown[]> => Promise.resolve([]),
  },
};

/** Headless OpenAPI export: no Postgres, Valkey, or BullMQ connections. */
export function applyOpenApiGenerationOverrides(
  builder: TestingModuleBuilder
): TestingModuleBuilder {
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
