// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TestingModuleBuilder } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';

import { PaperlessImportQueueService } from '../modules/connectors/infrastructure/adapters/paperless/paperless-import.queue.js';
import { DocumentChatGenerationCancelRegistry } from '../modules/documents/infrastructure/document-chat-generation-cancel.registry.js';
import { DocumentChatGenerationQueueService } from '../modules/documents/infrastructure/document-chat-generation-queue.service.js';
import { HeuristicFieldSuggestionsBackfillService } from '../modules/documents/infrastructure/heuristic-field-suggestions-backfill.service.js';
import { DocumentFactIndexQueueService } from '../modules/exact-facts/infrastructure/document-fact-index-queue.service.js';
import { ExtractionQueueService } from '../modules/extraction/infrastructure/extraction-queue.service.js';
import { EmbeddingDensityCalibrationQueueService } from '../modules/labels/infrastructure/embedding-density-calibration-queue.service.js';
import { PurgeExclusiveTagSuggestionsService } from '../modules/labels/infrastructure/purge-exclusive-tag-suggestions.service.js';
import { MlRetrainQueueService } from '../modules/model-registry/infrastructure/ml-retrain-queue.service.js';
import { RecognizedFieldReextractBackfillService } from '../modules/recognized-fields/infrastructure/recognized-field-reextract-backfill.service.js';
import { RecognizedFieldReextractQueueService } from '../modules/recognized-fields/infrastructure/recognized-field-reextract-queue.service.js';
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
    .overrideProvider(EmbeddingDensityCalibrationQueueService)
    .useValue(noopQueue)
    .overrideProvider(DocumentFactIndexQueueService)
    .useValue(noopQueue)
    .overrideProvider(RecognizedFieldReextractQueueService)
    .useValue(noopQueue)
    .overrideProvider(RecognizedFieldReextractBackfillService)
    .useValue({ onApplicationBootstrap: (): Promise<void> => Promise.resolve() })
    .overrideProvider(HeuristicFieldSuggestionsBackfillService)
    .useValue({ onApplicationBootstrap: (): Promise<void> => Promise.resolve() })
    .overrideProvider(PurgeExclusiveTagSuggestionsService)
    .useValue({ onApplicationBootstrap: (): Promise<void> => Promise.resolve() })
    .overrideProvider(DocumentChatGenerationCancelRegistry)
    .useValue(noopCancelRegistry);
}
