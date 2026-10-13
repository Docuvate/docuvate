// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { ForbiddenError } from '../../../shared/domain/errors.js';
import {
  EXTRACTION_PORT,
  type ExtractionPort,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import type { UpdateUserSettingsRequestDto } from '../../../shared/presentation/dtos/settings.dto.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import { fallbackExtractionEngines } from './extraction-engine-fallback.js';
import { filterExtractionEngines } from './filter-extraction-engines.js';

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
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase
  ) {}

  async execute(userId: string, patch: UpdateUserSettingsRequestDto) {
    if (patch.advancedFeaturesEnabled === true) {
      const flags = await this.resolveFeatureFlags.execute(userId);
      if (!flags.experimentalResearchModels) {
        throw new ForbiddenError('Feature disabled: experimentalResearchModels');
      }
    }
    return this.prefs.upsert(userId, patch);
  }
}

@Injectable()
export class ListExtractionEnginesUseCase {
  constructor(
    @Inject(EXTRACTION_PORT) private readonly extraction: ExtractionPort,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase
  ) {}

  async execute(tenantId: string) {
    const flags = await this.resolveFeatureFlags.execute(tenantId);
    try {
      const engines = await this.extraction.listEngines();
      return filterExtractionEngines(engines, flags);
    } catch {
      return filterExtractionEngines(fallbackExtractionEngines(), flags);
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
