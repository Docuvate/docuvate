import type { ConnectorInstallationDto } from '@docuvate/contracts';
import type { ConnectorInstallationEntity } from '../domain/connector.types.js';

export function toConnectorInstallationDto(entity: ConnectorInstallationEntity): ConnectorInstallationDto {
  return {
    id: entity.id,
    pluginId: entity.pluginId,
    displayName: entity.displayName,
    enabled: entity.enabled,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
