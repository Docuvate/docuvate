// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  CONNECTOR_INSTALLATION_REPOSITORY,
  CONNECTOR_REGISTRY,
  type ConnectorInstallationRepository,
  type ConnectorRegistryPort,
} from '../domain/connector.ports.js';
import type { ConnectorConfigurationInput, ConnectorPluginId } from '../domain/connector.types.js';
import type { ConnectorRuntimePorts } from '../domain/connector-runtime.ports.js';

export interface ResolvedConnectorRuntime {
  pluginId: ConnectorPluginId;
  displayName: string;
  credentials: ConnectorConfigurationInput;
  ports: ConnectorRuntimePorts;
}

@Injectable()
export class ConnectorRuntimeResolver {
  constructor(
    @Inject(CONNECTOR_REGISTRY) private readonly registry: ConnectorRegistryPort,
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository
  ) {}

  async resolve(userId: string, installationId: string): Promise<ResolvedConnectorRuntime> {
    const installation = await this.installations.findByIdForUser(userId, installationId);
    if (!installation) {
      throw new NotFoundError('Connector installation');
    }
    const plugin = this.registry.getPlugin(installation.pluginId);
    if (!plugin) {
      throw new NotFoundError('Connector plugin');
    }
    if (!installation.enabled) {
      throw new ValidationError('connectors.errors.installationDisabled');
    }
    return {
      pluginId: installation.pluginId,
      displayName: installation.displayName,
      credentials: installation.credentials,
      ports: plugin.openRuntime(installation.credentials),
    };
  }
}
