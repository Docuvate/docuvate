// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ConnectorSourceScopeDto,isSourceConnectorPluginId } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import {
  CONNECTOR_INSTALLATION_REPOSITORY,
  CONNECTOR_REGISTRY,
  type ConnectorInstallationRepository,
  type ConnectorRegistryPort,
} from '../domain/connector.ports.js';
import type { ConnectorPluginId } from '../domain/connector.types.js';
import { PgConnectorSourceScopeRepository } from '../infrastructure/pg-connector-source-scope.repository.js';

@Injectable()
export class GetConnectorCatalogUseCase {
  constructor(
    @Inject(CONNECTOR_REGISTRY) private readonly registry: ConnectorRegistryPort,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase
  ) {}

  async execute(input: { viewerIsServerAdmin: boolean; tenantId: string }) {
    const flags = await this.resolveFeatureFlags.execute(input.tenantId);
    const categories = this.registry.listCategories();
    const plugins = this.registry
      .listPlugins()
      .map((plugin) => ({
        ...plugin.descriptor,
        auth: plugin.authDescriptor(),
      }))
      .filter((plugin) => {
        if (!isSourceConnectorPluginId(plugin.id)) {
          return true;
        }
        return flags.sourceConnectors;
      });
    return { categories, plugins, viewerIsServerAdmin: input.viewerIsServerAdmin };
  }
}

@Injectable()
export class GetConnectorPluginUseCase {
  constructor(
    @Inject(CONNECTOR_REGISTRY) private readonly registry: ConnectorRegistryPort,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase
  ) {}

  async execute(tenantId: string, pluginId: ConnectorPluginId) {
    if (isSourceConnectorPluginId(pluginId)) {
      await this.resolveFeatureFlags.assertEnabled(tenantId, 'sourceConnectors');
    }
    const plugin = this.registry.getPlugin(pluginId);
    if (!plugin) {
      throw new NotFoundError('Connector plugin');
    }
    return {
      ...plugin.descriptor,
      auth: plugin.authDescriptor(),
    };
  }
}

@Injectable()
export class ListConnectorInstallationsUseCase {
  constructor(
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository
  ) {}

  execute(userId: string) {
    return this.installations.listForUser(userId);
  }
}

@Injectable()
export class CreateConnectorInstallationUseCase {
  constructor(
    @Inject(CONNECTOR_REGISTRY) private readonly registry: ConnectorRegistryPort,
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase,
    private readonly sourceScopes: PgConnectorSourceScopeRepository
  ) {}

  async execute(
    userId: string,
    body: {
      pluginId: ConnectorPluginId;
      displayName: string;
      credentials: Record<string, string>;
      sourceScope?: ConnectorSourceScopeDto;
    }
  ) {
    if (isSourceConnectorPluginId(body.pluginId)) {
      await this.resolveFeatureFlags.assertEnabled(userId, 'sourceConnectors');
    }
    const plugin = this.registry.getPlugin(body.pluginId);
    if (!plugin) {
      throw new NotFoundError('Connector plugin');
    }
    const displayName = body.displayName.trim();
    if (!displayName) {
      throw new ValidationError('Display name is required');
    }
    const validation = await plugin.validateConfiguration(body.credentials);
    if (!validation.ok) {
      throw new ValidationError(validation.messageKey ?? 'Invalid connector configuration');
    }
    const row = await this.installations.create({
      userId,
      pluginId: body.pluginId,
      displayName,
      credentials: body.credentials,
    });
    await this.sourceScopes.setScope(row.id, body.sourceScope ?? { mode: 'all', paths: [] });
    return row;
  }
}

@Injectable()
export class GetConnectorInstallationUseCase {
  constructor(
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository,
    private readonly sourceScopes: PgConnectorSourceScopeRepository
  ) {}

  async execute(userId: string, installationId: string) {
    const row = await this.installations.findByIdForUser(userId, installationId);
    if (!row) {
      throw new NotFoundError('Connector installation');
    }
    const sourceScope = await this.sourceScopes.getScope(installationId);
    return { installation: row, sourceScope };
  }
}

@Injectable()
export class UpdateConnectorInstallationUseCase {
  constructor(
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository,
    private readonly sourceScopes: PgConnectorSourceScopeRepository
  ) {}

  async execute(
    userId: string,
    installationId: string,
    body: { displayName?: string; sourceScope?: ConnectorSourceScopeDto }
  ) {
    const existing = await this.installations.findByIdForUser(userId, installationId);
    if (!existing) {
      throw new NotFoundError('Connector installation');
    }
    if (body.displayName !== undefined) {
      const displayName = body.displayName.trim();
      if (!displayName) {
        throw new ValidationError('Display name is required');
      }
      await this.installations.updateDisplayName(userId, installationId, displayName);
    }
    if (body.sourceScope !== undefined) {
      await this.sourceScopes.setScope(installationId, body.sourceScope);
    }
    const updated = await this.installations.findByIdForUser(userId, installationId);
    if (!updated) {
      throw new NotFoundError('Connector installation');
    }
    const sourceScope = await this.sourceScopes.getScope(installationId);
    return { installation: updated, sourceScope };
  }
}

@Injectable()
export class DeleteConnectorInstallationUseCase {
  constructor(
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository
  ) {}

  async execute(userId: string, installationId: string) {
    const removed = await this.installations.deleteForUser(userId, installationId);
    if (!removed) {
      throw new NotFoundError('Connector installation');
    }
  }
}
