import type { ConnectorRuntimePorts, ConnectorSourcePort } from '../../../domain/connector-runtime.ports.js';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import type {
  ConnectorImportableItem,
  ConnectorImportedBlob,
} from '../../../domain/connector-runtime.types.js';
import {
  PaperlessApiClient,
  detectPaperlessApiVersion,
  resolvePaperlessCredentials,
} from './paperless-api.client.js';

export function openPaperlessRuntime(credentials: ConnectorConfigurationInput): ConnectorRuntimePorts {
  const source: ConnectorSourcePort = {
    async listImportables({ limit }) {
      const resolved = await resolvePaperlessCredentials(credentials);
      const apiVersion = await detectPaperlessApiVersion(resolved);
      const client = new PaperlessApiClient(resolved, apiVersion);
      const pageSize = Math.min(Math.max(limit, 1), 100);
      const page = await client.listDocuments({ page: 1, pageSize });
      return page.results.map((row) => ({
        ref: String(row.id),
        title: row.title,
        mimeType: row.mime_type ?? null,
        sizeBytes: null,
      }));
    },
    async fetchImportable(ref: string) {
      const resolved = await resolvePaperlessCredentials(credentials);
      const apiVersion = await detectPaperlessApiVersion(resolved);
      const client = new PaperlessApiClient(resolved, apiVersion);
      const doc = await client.getDocument(Number(ref));
      const fileBuffer = await client.downloadDocument(doc.id, true);
      const filename = doc.original_file_name?.trim() || `${doc.title || ref}.bin`;
      return {
        ref,
        filename,
        mimeType: doc.mime_type ?? 'application/octet-stream',
        buffer: fileBuffer,
      } satisfies ConnectorImportedBlob;
    },
  };

  return { source };
}
