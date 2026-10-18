// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorInstallationDto, ConnectorSourceScopeDto } from '@docuvate/contracts';

import type { ConnectorInstallationEntity } from '../domain/connector.types.js';

export function toConnectorInstallationDto(
  entity: ConnectorInstallationEntity,
  sourceScope: ConnectorSourceScopeDto
): ConnectorInstallationDto {
  return {
    id: entity.id,
    pluginId: entity.pluginId,
    displayName: entity.displayName,
    enabled: entity.enabled,
    sourceScope,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
