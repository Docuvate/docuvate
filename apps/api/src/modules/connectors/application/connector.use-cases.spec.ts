// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagsDto } from '@docuvate/contracts';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import { CONNECTOR_REGISTRY, type ConnectorPlugin, type ConnectorRegistryPort } from '../domain/connector.ports.js';
import type { ConnectorPluginId } from '../domain/connector.types.js';
import { GetConnectorCatalogUseCase } from './connector.use-cases.js';

const CE_SOURCE_CONNECTOR_IDS: ConnectorPluginId[] = ['paperless', 'sftp_fetch'];

function makePlugin(id: ConnectorPluginId): ConnectorPlugin {
  return {
    descriptor: {
      id,
      categoryId: id === 'gmail' ? 'mail' : 'dms',
      labelKey: `connectors.plugins.${id}.label`,
      descriptionKey: `connectors.plugins.${id}.description`,
      capabilities: ['source'],
      tier: 'oss',
    },
    authDescriptor: () => ({
      strategy: 'custom',
      fields: [],
    }),
    validateConfiguration: () => Promise.resolve({ ok: true }),
    openRuntime: () => {
      throw new Error('not used in catalog test');
    },
  };
}

function flags(overrides: Partial<FeatureFlagsDto>): FeatureFlagsDto {
  return {
    layoutReconstructionCompare: false,
    sourceConnectors: true,
    experimentalResearchModels: false,
    exactAnswers: false,
    smartDuplicates: false,
    answerAbstention: false,
    learnedValueTypes: true,
    layoutKeyValueRoles: false,
    localChatModel: false,
    ...overrides,
  };
}

describe('GetConnectorCatalogUseCase', () => {
  const registry: ConnectorRegistryPort = {
    listCategories: () => [],
    listPlugins: () => [
      makePlugin('gmail'),
      makePlugin('paperless'),
      makePlugin('sftp_fetch'),
    ],
    getPlugin: () => undefined,
  };

  async function catalogWithSourceConnectors(enabled: boolean) {
    const resolveFeatureFlags = {
      execute: vi.fn().mockResolvedValue(flags({ sourceConnectors: enabled })),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetConnectorCatalogUseCase,
        { provide: CONNECTOR_REGISTRY, useValue: registry },
        { provide: ResolveFeatureFlagsUseCase, useValue: resolveFeatureFlags },
      ],
    }).compile();
    const useCase = moduleRef.get(GetConnectorCatalogUseCase);
    return useCase.execute({
      viewerIsServerAdmin: false,
      tenantId: 'tenant-1',
    });
  }

  it('includes CE source connectors when sourceConnectors is enabled', async () => {
    const result = await catalogWithSourceConnectors(true);
    const ids = result.plugins.map((plugin) => plugin.id);
    for (const id of CE_SOURCE_CONNECTOR_IDS) {
      expect(ids).toContain(id);
    }
    expect(ids).toContain('gmail');
  });

  it('omits source connectors when sourceConnectors is disabled', async () => {
    const result = await catalogWithSourceConnectors(false);
    const ids = result.plugins.map((plugin) => plugin.id);
    for (const id of CE_SOURCE_CONNECTOR_IDS) {
      expect(ids).not.toContain(id);
    }
    expect(ids).toContain('gmail');
  });
});
