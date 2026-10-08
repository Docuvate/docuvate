import type { ConnectorRuntimePorts, ConnectorSinkPort, ConnectorSourcePort } from '../../../domain/connector-runtime.ports.js';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import type {
  ConnectorExportInput,
  ConnectorExportResult,
  ConnectorImportableItem,
  ConnectorImportedBlob,
} from '../../../domain/connector-runtime.types.js';
import { connectorFetch, joinUrl } from '../shared/connector-http.js';
import { paperlessApiFetch, paperlessAuthHeaders, resolvePaperlessBaseUrl } from './paperless-api.client.js';

interface PaperlessDocumentRow {
  id: number;
  title: string;
  original_file_name?: string | null;
  mime_type?: string | null;
}

interface PaperlessListResponse {
  results: PaperlessDocumentRow[];
}

export function openPaperlessRuntime(credentials: ConnectorConfigurationInput): ConnectorRuntimePorts {
  const source: ConnectorSourcePort = {
    async listImportables({ limit }) {
      const response = await paperlessApiFetch(
        credentials,
        `/api/documents/?page=1&page_size=${Math.min(limit, 100)}`
      );
      if (!response.ok) {
        throw new Error('PAPERLESS_LIST_FAILED');
      }
      const body = (await response.json()) as PaperlessListResponse;
      return body.results.map((row) => ({
        ref: String(row.id),
        title: row.title,
        mimeType: row.mime_type ?? null,
        sizeBytes: null,
      }));
    },
    async fetchImportable(ref: string) {
      const docResponse = await paperlessApiFetch(credentials, `/api/documents/${ref}/`);
      if (!docResponse.ok) {
        throw new Error('PAPERLESS_DOCUMENT_NOT_FOUND');
      }
      const doc = (await docResponse.json()) as PaperlessDocumentRow;
      const baseUrl = resolvePaperlessBaseUrl(credentials);
      const downloadUrl = joinUrl(baseUrl, `/api/documents/${ref}/download/`);
      const auth = paperlessAuthHeaders(credentials);
      const fileResponse = await connectorFetch(downloadUrl, {
        headers: { Authorization: auth.Authorization },
      });
      if (!fileResponse.ok) {
        throw new Error('PAPERLESS_DOWNLOAD_FAILED');
      }
      const arrayBuffer = await fileResponse.arrayBuffer();
      const filename = doc.original_file_name?.trim() || `${doc.title || ref}.bin`;
      return {
        ref,
        filename,
        mimeType: doc.mime_type ?? 'application/octet-stream',
        buffer: Buffer.from(arrayBuffer),
      } satisfies ConnectorImportedBlob;
    },
  };

  const sink: ConnectorSinkPort = {
    async exportDocument(input: ConnectorExportInput): Promise<ConnectorExportResult> {
      const title = input.destinationRef?.trim() || input.filename;
      const form = new FormData();
      const blob = new Blob([Uint8Array.from(input.buffer)], { type: input.mimeType });
      form.append('document', blob, input.filename);
      form.append('title', title);
      const response = await paperlessApiFetch(credentials, '/api/documents/post_document/', {
        method: 'POST',
        body: form,
      });
      if (!response.ok) {
        throw new Error('PAPERLESS_UPLOAD_FAILED');
      }
      const task = (await response.json()) as { task_id?: string };
      return { ref: task.task_id ?? title };
    },
  };

  return { source, sink };
}
