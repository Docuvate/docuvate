import type { ConnectorRuntimePorts, ConnectorSinkPort, ConnectorSourcePort } from '../../../domain/connector-runtime.ports.js';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import type {
  ConnectorExportInput,
  ConnectorExportResult,
  ConnectorImportableItem,
  ConnectorImportedBlob,
} from '../../../domain/connector-runtime.types.js';
import { createS3ClientConfig } from './s3-client.factory.js';

function guessMimeType(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

function filenameFromKey(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

export function openS3Runtime(credentials: ConnectorConfigurationInput): ConnectorRuntimePorts {
  const { bucket, client } = createS3ClientConfig(credentials);

  const source: ConnectorSourcePort = {
    async listImportables({ limit }) {
      const items: ConnectorImportableItem[] = [];
      await new Promise<void>((resolve, reject) => {
        const stream = client.listObjects(bucket, '', true);
        stream.on('data', (obj) => {
          if (items.length >= limit) {
            stream.destroy();
            resolve();
            return;
          }
          if (!obj.name || obj.name.endsWith('/')) return;
          items.push({
            ref: obj.name,
            title: filenameFromKey(obj.name),
            mimeType: guessMimeType(obj.name),
            sizeBytes: obj.size ?? null,
          });
        });
        stream.on('error', reject);
        stream.on('end', () => resolve());
      });
      return items;
    },
    async fetchImportable(ref: string) {
      const stream = await client.getObject(bucket, ref);
      const chunks: Buffer[] = [];
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
      return {
        ref,
        filename: filenameFromKey(ref),
        mimeType: guessMimeType(ref),
        buffer,
      } satisfies ConnectorImportedBlob;
    },
  };

  const sink: ConnectorSinkPort = {
    async exportDocument(input: ConnectorExportInput): Promise<ConnectorExportResult> {
      const key =
        input.destinationRef?.trim() ||
        `docuvate-export/${input.documentId}/${input.filename}`;
      await client.putObject(bucket, key, input.buffer, input.buffer.length, {
        'Content-Type': input.mimeType,
      });
      return { ref: key };
    },
  };

  return { source, sink };
}
