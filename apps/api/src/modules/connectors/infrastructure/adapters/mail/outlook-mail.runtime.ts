import type { ConnectorRuntimePorts, ConnectorSourcePort } from '../../../domain/connector-runtime.ports.js';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import type { ConnectorImportableItem, ConnectorImportedBlob } from '../../../domain/connector-runtime.types.js';
import { connectorFetch } from '../shared/connector-http.js';

interface GraphMessageListResponse {
  value: { id: string; subject?: string; hasAttachments?: boolean }[];
}

interface GraphAttachmentListResponse {
  value: { id: string; name?: string; contentType?: string; size?: number }[];
}

export function openOutlookRuntime(credentials: ConnectorConfigurationInput): ConnectorRuntimePorts {
  const accessToken = credentials['access_token']?.trim() ?? '';

  const source: ConnectorSourcePort = {
    async listImportables({ limit }) {
      const response = await connectorFetch(
        `https://graph.microsoft.com/v1.0/me/messages?$top=${Math.min(limit, 50)}&$filter=hasAttachments eq true&$select=id,subject,hasAttachments`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        throw new Error('OUTLOOK_LIST_FAILED');
      }
      const body = (await response.json()) as GraphMessageListResponse;
      return body.value
        .filter((row) => row.hasAttachments)
        .map((row) => ({
          ref: row.id,
          title: row.subject ?? row.id,
          mimeType: null,
          sizeBytes: null,
        }));
    },
    async fetchImportable(ref: string) {
      const attachmentsResponse = await connectorFetch(
        `https://graph.microsoft.com/v1.0/me/messages/${ref}/attachments`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!attachmentsResponse.ok) {
        throw new Error('OUTLOOK_ATTACHMENTS_FAILED');
      }
      const attachments = (await attachmentsResponse.json()) as GraphAttachmentListResponse;
      const first = attachments.value[0];
      if (!first?.id) {
        throw new Error('OUTLOOK_NO_ATTACHMENT');
      }
      const attachmentResponse = await connectorFetch(
        `https://graph.microsoft.com/v1.0/me/messages/${ref}/attachments/${first.id}/$value`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!attachmentResponse.ok) {
        throw new Error('OUTLOOK_ATTACHMENT_FAILED');
      }
      const arrayBuffer = await attachmentResponse.arrayBuffer();
      return {
        ref,
        filename: first.name ?? `${ref}.bin`,
        mimeType: first.contentType ?? 'application/octet-stream',
        buffer: Buffer.from(arrayBuffer),
      } satisfies ConnectorImportedBlob;
    },
  };

  return { source };
}
