// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatProviderInfo } from '@docuvate/contracts';

import type { ChatProviderAvailability } from '../../../shared/application/resolve-effective-document-chat-provider.js';
import type { GetHardwareCapabilitiesUseCase } from './hardware-capabilities.use-case.js';
import { modelFitsOllamaMemLimit, ollamaMemLimitGiBFromEnv } from './ollama-compose-memory.js';
import { ollamaAvailableForHardware } from './ollama-hardware-gate.js';

export interface DocumentChatUnavailableBackend {
  id: string;
  label: string;
  reason: string;
  setupHint: string;
  reasonCode: string;
}

export interface DocumentChatProvidersCatalog {
  selectable: DocumentChatProviderInfo[];
  unavailable: DocumentChatUnavailableBackend[];
  development: DocumentChatProviderInfo[];
  meta: {
    ollamaModel: string | null;
    ollamaConfigured: boolean;
    ollamaModelReady: boolean;
    runsOnCpu: boolean;
  };
}

export function documentChatDevProvidersEnabled(): boolean {
  if (process.env['DOCUMENT_CHAT_DEV_PROVIDERS'] === 'true') {
    return true;
  }
  return process.env['NODE_ENV'] !== 'production';
}

export function resolveOllamaModelFromEnv(): string {
  return process.env['OLLAMA_MODEL'] ?? 'qwen2.5:3b';
}

interface WorkerProviderRow {
  id: string;
  label: string;
  description: string;
  available: boolean;
}

export function buildDocumentChatProvidersCatalog(input: {
  workerProviders: WorkerProviderRow[] | null;
  hardware: Awaited<ReturnType<GetHardwareCapabilitiesUseCase['execute']>> | null;
  ollamaModelReady: boolean;
}): DocumentChatProvidersCatalog {
  const ollamaModel = resolveOllamaModelFromEnv();
  const ollamaUrl = process.env['OLLAMA_URL'];
  const ollamaConfigured = Boolean(ollamaUrl);
  const workerConfigured = Boolean(process.env['WORKER_URL']);
  const ollamaHardwareOk = ollamaAvailableForHardware(ollamaModel, input.hardware);
  const ollamaMemLimitGiB = ollamaMemLimitGiBFromEnv();
  const ollamaMemOk = modelFitsOllamaMemLimit(ollamaModel, ollamaMemLimitGiB);

  const workerById = new Map((input.workerProviders ?? []).map((p) => [p.id, p]));

  const donutWorker = workerById.get('donut-ml');
  const donutAvailable = donutWorker?.available === true;

  const ragEnvReady = workerConfigured && ollamaConfigured && ollamaHardwareOk && ollamaMemOk;
  const ragOllamaAvailable = ragEnvReady && input.ollamaModelReady;

  const runsOnCpu = !input.hardware?.gpuAvailable;

  const selectable: DocumentChatProviderInfo[] = [];
  if (ragOllamaAvailable) {
    selectable.push({
      id: 'rag-ollama',
      label: 'Dokument-Chat',
      description: '',
      available: true,
    });
  }
  if (donutAvailable) {
    selectable.push({
      id: 'donut-ml',
      label: 'Visueller Dokument-Chat',
      description: '',
      available: true,
    });
  }

  const unavailable: DocumentChatUnavailableBackend[] = [];

  if (!ragOllamaAvailable) {
    let reasonCode = 'not_configured';
    if (ragEnvReady && !input.ollamaModelReady) {
      reasonCode = 'model_loading';
    } else if (!workerConfigured) {
      reasonCode = 'worker_offline';
    } else if (!ollamaConfigured) {
      reasonCode = 'ollama_not_configured';
    } else if (!ollamaMemOk) {
      reasonCode = 'model_too_large';
    } else if (!ollamaHardwareOk) {
      reasonCode = 'model_too_large';
    }
    unavailable.push({
      id: 'rag-ollama',
      label: 'Dokument-Chat',
      reason: reasonCode,
      setupHint: '',
      reasonCode,
    });
  }

  if (!donutAvailable) {
    unavailable.push({
      id: 'donut-ml',
      label: 'Visueller Dokument-Chat',
      reason: 'unavailable',
      setupHint: '',
      reasonCode: 'donut_unavailable',
    });
  }

  const development: DocumentChatProviderInfo[] = [];
  if (documentChatDevProvidersEnabled()) {
    development.push({
      id: 'mock',
      label: 'Mock (Entwicklung)',
      description: '',
      available: true,
    });
    if (ollamaConfigured && ollamaHardwareOk && input.ollamaModelReady) {
      development.push({
        id: 'ollama',
        label: 'Ollama Volltext (Entwicklung)',
        description: '',
        available: true,
      });
    }
  }

  return {
    selectable,
    unavailable,
    development,
    meta: {
      ollamaModel: ollamaConfigured ? ollamaModel : null,
      ollamaConfigured,
      ollamaModelReady: ollamaConfigured && input.ollamaModelReady,
      runsOnCpu,
    },
  };
}

/** Provider rows used for runtime routing (includes internal context, omits UI-only unavailable hints). */
export function runtimeChatProviderAvailability(
  catalog: DocumentChatProvidersCatalog
): ChatProviderAvailability[] {
  const rows: ChatProviderAvailability[] = [
    ...catalog.selectable,
    ...catalog.development,
    ...catalog.unavailable.map((u) => ({ id: u.id, available: false as const })),
  ];
  const workerConfigured = Boolean(process.env['WORKER_URL']);
  if (workerConfigured && !rows.some((r) => r.id === 'context')) {
    rows.push({ id: 'context', available: true });
  }
  return rows;
}
