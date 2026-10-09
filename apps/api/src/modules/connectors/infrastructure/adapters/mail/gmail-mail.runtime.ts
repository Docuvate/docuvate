// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ConnectorRuntimePorts,
  ConnectorSourcePort,
} from '../../../domain/connector-runtime.ports.js';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import type {
  ConnectorImportableItem,
  ConnectorImportedBlob,
} from '../../../domain/connector-runtime.types.js';
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

export function openGmailRuntime(credentials: ConnectorConfigurationInput): ConnectorRuntimePorts {
  const accessToken = credentials['access_token']?.trim() ?? '';

  const source: ConnectorSourcePort = {
    async listImportables({ limit }) {
      const response = await connectorFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${Math.min(limit, 50)}&q=has:attachment`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        throw new Error('GMAIL_LIST_FAILED');
      }
      const body = (await response.json()) as GmailMessageListResponse;
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
      const message = (await response.json()) as GmailMessageResponse;
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
      const attachmentBody = (await attachmentResponse.json()) as { data?: string };
      if (!attachmentBody.data) {
        throw new Error('GMAIL_ATTACHMENT_EMPTY');
      }
      const buffer = decodeBase64Url(attachmentBody.data);
      return {
        ref,
        filename: attachmentPart.filename || `${subject}.bin`,
        mimeType: attachmentPart.mimeType ?? 'application/octet-stream',
        buffer,
      } satisfies ConnectorImportedBlob;
    },
  };

  return { source };
}
