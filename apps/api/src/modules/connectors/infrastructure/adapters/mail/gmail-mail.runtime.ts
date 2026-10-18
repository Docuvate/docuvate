// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
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

interface GmailMessageListResponse {
  messages?: { id: string }[];
}

interface GmailPayloadPart {
  mimeType?: string;
  filename?: string;
  body?: { attachmentId?: string; size?: number; data?: string };
  parts?: GmailPayloadPart[];
  headers?: { name: string; value: string }[];
}

interface GmailMessageResponse {
  id: string;
  payload?: GmailPayloadPart;
}

function headerValue(message: GmailMessageResponse, name: string): string | null {
  const headers = message.payload?.headers ?? [];
  const match = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return match?.value ?? null;
}

function decodeBase64Url(data: string): Buffer {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
}

function walkParts(
  part: GmailPayloadPart | undefined,
  visit: (part: GmailPayloadPart) => void
): void {
  if (!part) return;
  visit(part);
  for (const child of part.parts ?? []) {
    walkParts(child, visit);
  }
}

function findAttachmentPart(payload: GmailPayloadPart | undefined): GmailPayloadPart | null {
  let found: GmailPayloadPart | null = null;
  walkParts(payload, (part) => {
    if (found) return;
    if (part.filename && part.body?.attachmentId) {
      found = part;
    }
  });
  return found;
}

function parseGmailHeader(value: unknown): { name: string; value: string } | null {
  const row = recordFromUnknown(value);
  if (!row) return null;
  const name = parseString(row.name);
  const headerValue = parseString(row.value);
  if (!name) return null;
  return { name, value: headerValue };
}

function parseGmailPayloadPart(value: unknown): GmailPayloadPart | null {
  const row = recordFromUnknown(value);
  if (!row) return null;
  const bodyRow = recordFromUnknown(row.body);
  const headersRaw = row.headers;
  const headers: { name: string; value: string }[] = [];
  if (Array.isArray(headersRaw)) {
    for (const entry of headersRaw) {
      const header = parseGmailHeader(entry);
      if (header) headers.push(header);
    }
  }
  const partsRaw = row.parts;
  const parts: GmailPayloadPart[] = [];
  if (Array.isArray(partsRaw)) {
    for (const entry of partsRaw) {
      const part = parseGmailPayloadPart(entry);
      if (part) parts.push(part);
    }
  }
  return {
    mimeType: parseString(row.mimeType) || undefined,
    filename: parseString(row.filename) || undefined,
    body: bodyRow
      ? {
          attachmentId: parseString(bodyRow.attachmentId) || undefined,
          data: parseString(bodyRow.data) || undefined,
        }
      : undefined,
    parts: parts.length > 0 ? parts : undefined,
    headers: headers.length > 0 ? headers : undefined,
  };
}

function parseGmailMessageResponse(value: unknown): GmailMessageResponse {
  const row = recordFromUnknown(value);
  if (!row) {
    return { id: '' };
  }
  const payload = parseGmailPayloadPart(row.payload);
  return {
    id: parseString(row.id),
    payload: payload ?? undefined,
  };
}

function parseGmailMessageListResponse(value: unknown): GmailMessageListResponse {
  const row = recordFromUnknown(value);
  if (!row || !Array.isArray(row.messages)) {
    return { messages: [] };
  }
  const messages: { id: string }[] = [];
  for (const entry of row.messages) {
    const messageRow = recordFromUnknown(entry);
    if (!messageRow) continue;
    const id = parseString(messageRow.id);
    if (id) messages.push({ id });
  }
  return { messages };
}

function parseGmailAttachmentBody(value: unknown): { data?: string } {
  const row = recordFromUnknown(value);
  if (!row) return {};
  const data = parseString(row.data);
  return data ? { data } : {};
}

export function openGmailRuntime(credentials: ConnectorConfigurationInput): ConnectorRuntimePorts {
  const accessToken = readConnectorConfigString(credentials, 'access_token');

  const source: ConnectorSourcePort = {
    async listImportables({ limit }) {
      const maxResults = String(Math.min(limit, 50));
      const response = await connectorFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=has:attachment`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        throw new Error('GMAIL_LIST_FAILED');
      }
      const body = parseGmailMessageListResponse(await response.json());
      return (body.messages ?? []).map((message) => ({
        ref: message.id,
        title: message.id,
        mimeType: null,
        sizeBytes: null,
      }));
    },
    async fetchImportable(ref: string) {
      const response = await connectorFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        throw new Error('GMAIL_MESSAGE_FAILED');
      }
      const message = parseGmailMessageResponse(await response.json());
      const subject = headerValue(message, 'Subject') ?? ref;
      const attachmentPart = findAttachmentPart(message.payload);
      const attachmentId = attachmentPart?.body?.attachmentId;
      if (!attachmentId) {
        throw new Error('GMAIL_NO_ATTACHMENT');
      }
      const attachmentResponse = await connectorFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!attachmentResponse.ok) {
        throw new Error('GMAIL_ATTACHMENT_FAILED');
      }
      const attachmentBody = parseGmailAttachmentBody(await attachmentResponse.json());
      if (!attachmentBody.data) {
        throw new Error('GMAIL_ATTACHMENT_EMPTY');
      }
      const buffer = decodeBase64Url(attachmentBody.data);
      const attachmentFilename = attachmentPart.filename?.trim() ?? '';
      const filename =
        attachmentFilename.length > 0
          ? attachmentFilename
          : subject.trim().length > 0
            ? `${subject.trim()}.bin`
            : `${ref}.bin`;
      return {
        ref,
        filename,
        mimeType: attachmentPart.mimeType ?? 'application/octet-stream',
        buffer,
      } satisfies ConnectorImportedBlob;
    },
  };

  return { source };
}
