// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';

import { ConnectorRegistry } from '../../src/modules/connectors/application/connector.registry.js';
import { ConnectorRuntimeResolver } from '../../src/modules/connectors/application/connector-runtime.resolver.js';
import { PaperlessDmsConnector } from '../../src/modules/connectors/infrastructure/adapters/paperless/paperless-dms.connector.js';
import { PaperlessImportExecutor } from '../../src/modules/connectors/infrastructure/adapters/paperless/paperless-import.executor.js';
import { PaperlessImportQueueService } from '../../src/modules/connectors/infrastructure/adapters/paperless/paperless-import.queue.js';
import { PaperlessImportRepository } from '../../src/modules/connectors/infrastructure/adapters/paperless/paperless-import.repository.js';
import { PgConnectorInstallationRepository } from '../../src/modules/connectors/infrastructure/pg-connector-installation.repository.js';
import { PgDocumentRepository } from '../../src/modules/documents/infrastructure/pg-document.repository.js';
import { PgFolderRepository } from '../../src/modules/folders/infrastructure/pg-folder.repository.js';
import { PgTaxonomyRepository } from '../../src/modules/taxonomy/infrastructure/pg-taxonomy.repository.js';
import { UuidIdGenerator } from '../../src/shared/infrastructure/ids/uuid-id-generator.js';
import { MinioObjectStorage } from '../../src/shared/infrastructure/storage/minio-object.storage.js';
import { SystemClock } from '../../src/shared/infrastructure/time/system-clock.js';

const noopUseCase = {
  execute() {
    return Promise.resolve(undefined);
  },
};

export function createPaperlessImportExecutor(pool: pg.Pool): PaperlessImportExecutor {
  return new PaperlessImportExecutor(
    new PaperlessImportRepository(pool),
    new PgDocumentRepository(pool),
    new PgTaxonomyRepository(pool),
    new PgFolderRepository(pool),
    new MinioObjectStorage(),
    new UuidIdGenerator(),
    new SystemClock(),
    noopUseCase,
    noopUseCase,
    noopUseCase,
    noopUseCase
  );
}

export function createPaperlessConnectorRuntimeResolver(pool: pg.Pool): ConnectorRuntimeResolver {
  const registry = new ConnectorRegistry();
  registry.registerPlugin(new PaperlessDmsConnector());
  return new ConnectorRuntimeResolver(registry, new PgConnectorInstallationRepository(pool));
}

export function createPaperlessImportQueueService(pool: pg.Pool): PaperlessImportQueueService {
  const imports = new PaperlessImportRepository(pool);
  const runtime = createPaperlessConnectorRuntimeResolver(pool);
  return new PaperlessImportQueueService(imports, createPaperlessImportExecutor(pool), runtime);
}
