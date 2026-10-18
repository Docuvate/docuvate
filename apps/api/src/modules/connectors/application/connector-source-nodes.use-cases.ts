// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorSourceTreeNodeDto } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import {
  CONNECTOR_INSTALLATION_REPOSITORY,
  CONNECTOR_REGISTRY,
  type ConnectorInstallationRepository,
  type ConnectorRegistryPort,
} from '../domain/connector.ports.js';
import type { ConnectorConfigurationInput, ConnectorPluginId } from '../domain/connector.types.js';
import { listS3SourceChildNodes } from '../infrastructure/adapters/s3/s3-client.factory.js';
import { listSftpPullFiles } from '../infrastructure/adapters/sftp/sftp-pull.gateway.js';

function normalizeParentPath(parentPath: string): string {
  const trimmed = parentPath.trim();
  if (trimmed === '/' || trimmed === '') {
    return '';
  }
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

function sftpChildNodes(
  files: { path: string; name: string }[],
  parentPath: string
): ConnectorSourceTreeNodeDto[] {
  const prefix = normalizeParentPath(parentPath);
  const nodes = new Map<string, ConnectorSourceTreeNodeDto>();
  for (const file of files) {
    if (!file.path.startsWith(prefix)) continue;
    const rest = file.path.slice(prefix.length);
    if (!rest) continue;
    const slash = rest.indexOf('/');
    if (slash >= 0) {
      const dir = rest.slice(0, slash);
      const path = `${prefix}${dir}/`;
      if (!nodes.has(path)) {
        nodes.set(path, { path, label: dir, hasChildren: true, objectCount: null });
      }
    } else {
      nodes.set(file.path, {
        path: file.path,
        label: rest,
        hasChildren: false,
        objectCount: 1,
      });
    }
  }
  return [...nodes.values()].sort((a, b) => a.label.localeCompare(b.label));
}

@Injectable()
export class ListConnectorSourceNodesUseCase {
  constructor(
    @Inject(CONNECTOR_REGISTRY) private readonly registry: ConnectorRegistryPort,
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase
  ) {}

  async executeForInstallation(
    userId: string,
    installationId: string,
    parentPath: string
  ): Promise<{ nodes: ConnectorSourceTreeNodeDto[] }> {
    await this.resolveFeatureFlags.assertEnabled(userId, 'sourceConnectors');
    const record = await this.installations.findByIdForUser(userId, installationId);
    if (!record) {
      throw new NotFoundError('Connector installation');
    }
    const nodes = await this.listNodes(record.pluginId, record.credentials, parentPath);
    return { nodes };
  }

  async executePreview(
    userId: string,
    pluginId: ConnectorPluginId,
    credentials: ConnectorConfigurationInput,
    parentPath: string
  ): Promise<{ nodes: ConnectorSourceTreeNodeDto[] }> {
    await this.resolveFeatureFlags.assertEnabled(userId, 'sourceConnectors');
    const plugin = this.registry.getPlugin(pluginId);
    if (!plugin) {
      throw new NotFoundError('Connector plugin');
    }
    const validation = await plugin.validateConfiguration(credentials);
    if (!validation.ok) {
      throw new ValidationError(validation.messageKey ?? 'Invalid connector configuration');
    }
    const nodes = await this.listNodes(pluginId, credentials, parentPath);
    return { nodes };
  }

  private async listNodes(
    pluginId: ConnectorPluginId,
    credentials: ConnectorConfigurationInput,
    parentPath: string
  ): Promise<ConnectorSourceTreeNodeDto[]> {
    switch (pluginId) {
      case 'amazon_s3':
        return listS3SourceChildNodes(credentials, normalizeParentPath(parentPath));
      case 'sftp_fetch': {
        const files = await listSftpPullFiles(credentials, 500);
        return sftpChildNodes(files, parentPath);
      }
      case 'gmail':
      case 'home_assistant':
      case 'outlook':
      case 'paperless':
        return [];
      default: {
        const unreachable: never = pluginId;
        return unreachable;
      }
    }
  }
}
