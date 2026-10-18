// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { ConnectorPlugin, ConnectorRegistryPort } from '../domain/connector.ports.js';
import type {
  ConnectorCategoryDescriptor,
  ConnectorCategoryId,
  ConnectorPluginId,
} from '../domain/connector.types.js';

@Injectable()
export class ConnectorRegistry implements ConnectorRegistryPort {
  private readonly categories = new Map<string, ConnectorCategoryDescriptor>();
  private readonly plugins = new Map<string, ConnectorPlugin>();

  registerCategory(descriptor: ConnectorCategoryDescriptor): void {
    this.categories.set(descriptor.id, descriptor);
  }

  registerPlugin(plugin: ConnectorPlugin): void {
    this.plugins.set(plugin.descriptor.id, plugin);
  }

  listCategories(): ConnectorCategoryDescriptor[] {
    return [...this.categories.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  listPlugins(categoryId?: ConnectorCategoryId): ConnectorPlugin[] {
    const all = [...this.plugins.values()];
    if (!categoryId) {
      return all.sort((a, b) => a.descriptor.id.localeCompare(b.descriptor.id));
    }
    return all
      .filter((p) => p.descriptor.categoryId === categoryId)
      .sort((a, b) => a.descriptor.id.localeCompare(b.descriptor.id));
  }

  getPlugin(pluginId: ConnectorPluginId): ConnectorPlugin | undefined {
    return this.plugins.get(pluginId);
  }
}
