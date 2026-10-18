// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorPluginId } from '@docuvate/contracts';

import type { BreadcrumbItem } from '../components/ui/Breadcrumb';
import { routes } from './routes';

export function buildConnectorBreadcrumbItems(input: {
  settingsLabel: string;
  connectorsLabel: string;
  pluginLabel: string;
  pluginId: ConnectorPluginId;
  connectionId: string;
  connectionName: string;
  tailLabel?: string;
}): BreadcrumbItem[] {
  if (input.tailLabel) {
    return [
      { label: input.settingsLabel, to: routes.settings },
      { label: input.connectorsLabel, to: routes.settingsConnectors },
      {
        label: input.connectionName,
        to: routes.settingsConnectorConnection(input.pluginId, input.connectionId),
      },
      { label: input.tailLabel },
    ];
  }
  return [
    { label: input.settingsLabel, to: routes.settings },
    { label: input.connectorsLabel, to: routes.settingsConnectors },
    { label: input.pluginLabel, to: routes.settingsConnectors },
    { label: input.connectionName },
  ];
}
