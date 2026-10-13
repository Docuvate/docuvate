// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isCeSourceConnectorPluginId } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import {
  assertCeFeatureEnabled,
  ceFeatureFlags,
} from '../../../shared/application/assert-ce-feature.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  CONNECTOR_INSTALLATION_REPOSITORY,
  CONNECTOR_REGISTRY,
  type ConnectorInstallationRepository,
  type ConnectorRegistryPort,
} from '../domain/connector.ports.js';
import type { ConnectorPluginId } from '../domain/connector.types.js';

@Injectable()
export class GetConnectorCatalogUseCase {
  constructor(@Inject(CONNECTOR_REGISTRY) private readonly registry: ConnectorRegistryPort) {}

  execute(input: { viewerIsServerAdmin: boolean }) {
    const categories = this.registry.listCategories();
    const plugins = this.registry
      .listPlugins()
      .map((plugin) => ({
        ...plugin.descriptor,
        auth: plugin.authDescriptor(),
      }))
      .filter((plugin) => {
        if (!isCeSourceConnectorPluginId(plugin.id)) {
          return true;
        }
        return ceFeatureFlags().sourceConnectors;
      });
    return { categories, plugins, viewerIsServerAdmin: input.viewerIsServerAdmin };
  }
}

@Injectable()
export class GetConnectorPluginUseCase {
  constructor(@Inject(CONNECTOR_REGISTRY) private readonly registry: ConnectorRegistryPort) {}

  execute(pluginId: ConnectorPluginId) {
    if (isCeSourceConnectorPluginId(pluginId)) {
      assertCeFeatureEnabled('sourceConnectors');
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
    private readonly installations: ConnectorInstallationRepository
  ) {}

  async execute(
    userId: string,
    body: {
      pluginId: ConnectorPluginId;
      displayName: string;
      credentials: Record<string, string>;
    }
  ) {
    if (isCeSourceConnectorPluginId(body.pluginId)) {
      assertCeFeatureEnabled('sourceConnectors');
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
    return this.installations.create({
      userId,
      pluginId: body.pluginId,
      displayName,
      credentials: body.credentials,
    });
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
