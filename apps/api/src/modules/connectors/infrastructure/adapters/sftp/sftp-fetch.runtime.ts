// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import type {
  ConnectorRuntimePorts,
  ConnectorSourcePort,
} from '../../../domain/connector-runtime.ports.js';
import type {
  ConnectorImportableItem,
  ConnectorImportedBlob,
} from '../../../domain/connector-runtime.types.js';
import { fetchSftpPullFile, listSftpPullFiles } from './sftp-pull.gateway.js';

function guessMimeType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.tif') || lower.endsWith('.tiff')) return 'image/tiff';
  return 'application/octet-stream';
}

export function openSftpFetchRuntime(
  credentials: ConnectorConfigurationInput
): ConnectorRuntimePorts {
  const source: ConnectorSourcePort = {
    async listImportables({ limit }) {
      const files = await listSftpPullFiles(credentials, limit);
      return files.map((file): ConnectorImportableItem => ({
        ref: file.path,
        title: file.name,
        mimeType: guessMimeType(file.name),
        sizeBytes: file.sizeBytes,
      }));
    },
    async fetchImportable(ref: string) {
      const buffer = await fetchSftpPullFile(credentials, ref);
      const name = ref.split('/').pop() ?? ref;
      return {
        ref,
        filename: name,
        mimeType: guessMimeType(name),
        buffer,
      } satisfies ConnectorImportedBlob;
    },
  };
  return { source };
}
