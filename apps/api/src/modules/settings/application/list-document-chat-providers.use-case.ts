// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import {
  parseBoolean,
  parseString,
  recordFromUnknown,
} from '../../../shared/infrastructure/database/row-parse.js';
import { fetchWorkerDependency } from '../../../shared/infrastructure/worker/worker-dependency-fetch.js';
import {
  buildDocumentChatProvidersCatalog,
  resolveOllamaModelFromEnv,
} from './document-chat-provider-catalog.js';
import { GetHardwareCapabilitiesUseCase } from './hardware-capabilities.use-case.js';
import { isOllamaModelLoaded } from './ollama-model-probe.js';

function parseDocumentChatProviders(value: unknown): {
  id: string;
  label: string;
  description: string;
  available: boolean;
}[] {
  const row = recordFromUnknown(value);
  if (!row || !Array.isArray(row.providers)) {
    return [];
  }
  const providers: {
    id: string;
    label: string;
    description: string;
    available: boolean;
  }[] = [];
  for (const entry of row.providers) {
    const providerRow = recordFromUnknown(entry);
    if (!providerRow) {
      continue;
    }
    const id = parseString(providerRow.id);
    if (!id) {
      continue;
    }
    providers.push({
      id,
      label: parseString(providerRow.label),
      description: parseString(providerRow.description),
      available: parseBoolean(providerRow.available),
    });
  }
  return providers;
}

@Injectable()
export class ListDocumentChatProvidersUseCase {
  constructor(private readonly hardware: GetHardwareCapabilitiesUseCase) {}

  private workerHeaders(): Record<string, string> {
    const secret = process.env['WORKER_SECRET'] ?? 'worker-shared-secret';
    return {
      'Content-Type': 'application/json',
      'X-Worker-Secret': secret,
    };
  }

  async execute() {
    const hw = await this.hardware.execute();
    let workerProviders: {
      id: string;
      label: string;
      description: string;
      available: boolean;
    }[] | null = null;

    const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
    try {
      const response = await fetchWorkerDependency(workerUrl, '/document-chat/providers', {
        headers: this.workerHeaders(),
      });
      if (response?.ok) {
        workerProviders = parseDocumentChatProviders(await response.json());
      }
    } catch {
      // Worker offline — catalog uses env + hardware only.
    }

    const ollamaUrl = process.env['OLLAMA_URL'];
    const ollamaModelReady =
      ollamaUrl != null && ollamaUrl.length > 0
        ? await isOllamaModelLoaded(ollamaUrl, resolveOllamaModelFromEnv())
        : false;

    return buildDocumentChatProvidersCatalog({
      workerProviders,
      hardware: hw,
      ollamaModelReady,
    });
  }
}
