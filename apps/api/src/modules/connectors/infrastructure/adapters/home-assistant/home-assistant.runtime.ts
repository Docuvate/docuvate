import type { ConnectorRuntimePorts, ConnectorSinkPort } from '../../../domain/connector-runtime.ports.js';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import type { ConnectorExportInput, ConnectorExportResult } from '../../../domain/connector-runtime.types.js';
import { homeAssistantApiFetch } from './home-assistant-api.client.js';

export function openHomeAssistantRuntime(credentials: ConnectorConfigurationInput): ConnectorRuntimePorts {
  const sink: ConnectorSinkPort = {
    async exportDocument(input: ConnectorExportInput): Promise<ConnectorExportResult> {
      const message =
        input.destinationRef?.trim() ||
        `Docuvate export: ${input.filename} (${input.documentId})`;
      const response = await homeAssistantApiFetch(credentials, '/api/services/notify/notify', {
        method: 'POST',
        body: JSON.stringify({
          message,
          title: 'Docuvate',
        }),
      });
      if (!response.ok) {
        throw new Error('HA_NOTIFY_FAILED');
      }
      const data = (await response.json()) as unknown[];
      return { ref: String(data.length) };
    },
  };

  return { sink };
}
