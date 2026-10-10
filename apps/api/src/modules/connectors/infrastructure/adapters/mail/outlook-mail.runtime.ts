// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  parseBoolean,
  parseString,
  recordFromUnknown,
} from '../../../../../shared/infrastructure/database/row-parse.js';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import type {
  ConnectorRuntimePorts,
  ConnectorSourcePort,
} from '../../../domain/connector-runtime.ports.js';
import type { ConnectorImportedBlob } from '../../../domain/connector-runtime.types.js';
import { readConnectorConfigString } from '../shared/connector-config-string.js';
import { connectorFetch } from '../shared/connector-http.js';

interface GraphMessageListResponse {
  value: { id: string; subject?: string; hasAttachments?: boolean }[];
}

interface GraphAttachmentListResponse {
  value: { id: string; name?: string; contentType?: string; size?: number }[];
}

function parseGraphMessages(value: unknown): GraphMessageListResponse {
  const row = recordFromUnknown(value);
  if (!row || !Array.isArray(row.value)) {
    return { value: [] };
  }
  const valueRows: GraphMessageListResponse['value'] = [];
  for (const entry of row.value) {
    const messageRow = recordFromUnknown(entry);
    if (!messageRow) continue;
    const id = parseString(messageRow.id);
    if (!id) continue;
    valueRows.push({
      id,
      subject: parseString(messageRow.subject) || undefined,
      hasAttachments: parseBoolean(messageRow.hasAttachments),
    });
  }
  return { value: valueRows };
}

function parseGraphAttachments(value: unknown): GraphAttachmentListResponse {
  const row = recordFromUnknown(value);
  if (!row || !Array.isArray(row.value)) {
    return { value: [] };
  }
  const valueRows: GraphAttachmentListResponse['value'] = [];
  for (const entry of row.value) {
    const attachmentRow = recordFromUnknown(entry);
    if (!attachmentRow) continue;
    const id = parseString(attachmentRow.id);
    if (!id) continue;
    valueRows.push({
      id,
      name: parseString(attachmentRow.name) || undefined,
      contentType: parseString(attachmentRow.contentType) || undefined,
    });
  }
  return { value: valueRows };
}

export function openOutlookRuntime(
  credentials: ConnectorConfigurationInput
): ConnectorRuntimePorts {
  const accessToken = readConnectorConfigString(credentials, 'access_token');

  const source: ConnectorSourcePort = {
    async listImportables({ limit }) {
      const top = String(Math.min(limit, 50));
      const response = await connectorFetch(
        `https://graph.microsoft.com/v1.0/me/messages?$top=${top}&$filter=hasAttachments eq true&$select=id,subject,hasAttachments`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        throw new Error('OUTLOOK_LIST_FAILED');
      }
      const body = parseGraphMessages(await response.json());
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
      const attachments = parseGraphAttachments(await attachmentsResponse.json());
      const first = attachments.value.at(0);
      if (first === undefined) {
        throw new Error('OUTLOOK_NO_ATTACHMENT');
      }
      if (!first.id) {
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
