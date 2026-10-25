// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagsDto } from '@docuvate/contracts';
import { describe, expect, it, vi } from 'vitest';

import type { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import type { ConnectorPlugin, ConnectorRegistryPort } from '../domain/connector.ports.js';
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
    validateConfiguration: async () => ({ ok: true }),
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

  it('includes CE source connectors when sourceConnectors is enabled', async () => {
    const resolveFeatureFlags = {
      execute: vi.fn().mockResolvedValue(flags({ sourceConnectors: true })),
    } as unknown as ResolveFeatureFlagsUseCase;
    const useCase = new GetConnectorCatalogUseCase(registry, resolveFeatureFlags);
    const result = await useCase.execute({
      viewerIsServerAdmin: false,
      tenantId: 'tenant-1',
    });
    const ids = result.plugins.map((plugin) => plugin.id);
    for (const id of CE_SOURCE_CONNECTOR_IDS) {
      expect(ids).toContain(id);
    }
    expect(ids).toContain('gmail');
  });

  it('omits source connectors when sourceConnectors is disabled', async () => {
    const resolveFeatureFlags = {
      execute: vi.fn().mockResolvedValue(flags({ sourceConnectors: false })),
    } as unknown as ResolveFeatureFlagsUseCase;
    const useCase = new GetConnectorCatalogUseCase(registry, resolveFeatureFlags);
    const result = await useCase.execute({
      viewerIsServerAdmin: false,
      tenantId: 'tenant-1',
    });
    const ids = result.plugins.map((plugin) => plugin.id);
    for (const id of CE_SOURCE_CONNECTOR_IDS) {
      expect(ids).not.toContain(id);
    }
    expect(ids).toContain('gmail');
  });
});
