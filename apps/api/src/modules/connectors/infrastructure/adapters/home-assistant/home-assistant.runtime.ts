// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import type {
  ConnectorRuntimePorts,
  ConnectorSinkPort,
} from '../../../domain/connector-runtime.ports.js';
import type {
  ConnectorExportInput,
  ConnectorExportResult,
} from '../../../domain/connector-runtime.types.js';
import { homeAssistantApiFetch } from './home-assistant-api.client.js';

export function openHomeAssistantRuntime(
  credentials: ConnectorConfigurationInput
): ConnectorRuntimePorts {
  const sink: ConnectorSinkPort = {
    async exportDocument(input: ConnectorExportInput): Promise<ConnectorExportResult> {
      const destinationRef = input.destinationRef?.trim() ?? '';
      const message =
        destinationRef.length > 0
          ? destinationRef
          : `Docuvate export: ${input.filename} (${input.documentId})`;
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
      const data: unknown = await response.json();
      const length = Array.isArray(data) ? data.length : 0;
      return { ref: String(length) };
    },
  };

  return { sink };
}
