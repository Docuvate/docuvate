// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import {
  EXTRACTION_PORT,
  type ExtractionPort,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import {
  parseBoolean,
  parseString,
  recordFromUnknown,
} from '../../../shared/infrastructure/database/row-parse.js';
import { fetchWorkerDependency } from '../../../shared/infrastructure/worker/worker-dependency-fetch.js';
import type { UpdateUserSettingsRequestDto } from '../../../shared/presentation/dtos/settings.dto.js';
import {
  buildDocumentChatProvidersCatalog,
  resolveOllamaModelFromEnv,
} from './document-chat-provider-catalog.js';
import { fallbackExtractionEngines } from './extraction-engine-fallback.js';
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
export class GetUserSettingsUseCase {
  constructor(
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository
  ) {}

  async execute(userId: string) {
    const row = await this.prefs.getForUser(userId);
    const effectiveEngine =
      row.useArenaWinnerAsDefault && row.arenaWinnerEngine
        ? row.arenaWinnerEngine
        : row.preferredExtractorEngine;
    return { row, effectiveEngine };
  }
}

@Injectable()
export class UpdateUserSettingsUseCase {
  constructor(
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository
  ) {}

  async execute(userId: string, patch: UpdateUserSettingsRequestDto) {
    return this.prefs.upsert(userId, patch);
  }
}

@Injectable()
export class ListDocumentChatProvidersUseCase {
  constructor(private readonly hardware: GetHardwareCapabilitiesUseCase) {}

  private workerHeaders(): Record<string, string> {
    const secret = process.env.WORKER_SECRET ?? 'worker-shared-secret';
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

    const workerUrl = process.env.WORKER_URL ?? 'http://localhost:8000';
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

    const ollamaUrl = process.env.OLLAMA_URL;
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

@Injectable()
export class ListExtractionEnginesUseCase {
  constructor(@Inject(EXTRACTION_PORT) private readonly extraction: ExtractionPort) {}

  async execute() {
    try {
      return await this.extraction.listEngines();
    } catch {
      return fallbackExtractionEngines();
    }
  }
}

@Injectable()
export class RecordExtractionArenaRatingUseCase {
  constructor(
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository
  ) {}

  async execute(
    userId: string,
    input: {
      documentId: string | null;
      winnerEngine: string;
      comparedEngines: string[];
      rating?: number;
      applyAsDefault?: boolean;
    }
  ) {
    await this.prefs.recordArenaRating({
      userId,
      documentId: input.documentId,
      winnerEngine: input.winnerEngine,
      comparedEngines: input.comparedEngines,
      rating: input.rating ?? null,
      source: 'manual',
    });

    if (input.applyAsDefault) {
      await this.prefs.upsert(userId, {
        preferredExtractorEngine: input.winnerEngine,
        useArenaWinnerAsDefault: false,
        arenaWinnerEngine: input.winnerEngine,
      });
    } else {
      await this.prefs.upsert(userId, {
        arenaWinnerEngine: input.winnerEngine,
      });
    }
  }
}

@Injectable()
export class ResolveUserExtractorEngineUseCase {
  constructor(
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository
  ) {}

  async execute(userId: string): Promise<string> {
    const row = await this.prefs.getForUser(userId);
    if (row.useArenaWinnerAsDefault && row.arenaWinnerEngine) {
      return row.arenaWinnerEngine;
    }
    return row.preferredExtractorEngine;
  }
}
