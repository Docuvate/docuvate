// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';

import { GetLabelRecommendationsUseCase } from '../../../src/modules/labels/application/get-label-recommendations.use-case.js';
import { LabelHybridModelCacheService } from '../../../src/modules/labels/infrastructure/label-hybrid-model-cache.service.js';
import { PgLabelEmbeddingRepository } from '../../../src/modules/labels/infrastructure/pg-label-embedding.repository.js';
import { RepresentationModule } from '../../../src/modules/representation/representation.module.js';
import { PgUserPreferencesRepository } from '../../../src/modules/settings/infrastructure/pg-user-preferences.repository.js';
import {
  LABEL_EMBEDDING_REPOSITORY,
  USER_PREFERENCES_REPOSITORY,
} from '../../../src/shared/domain/ports.js';
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module.js';

const labelHybridCacheStub = {
  resolveModel: async () => null,
} satisfies Pick<LabelHybridModelCacheService, 'resolveModel'>;

export async function createLabelsRecommendationsUseCase(): Promise<GetLabelRecommendationsUseCase> {
  const moduleRef = await Test.createTestingModule({
    imports: [DatabaseModule, RepresentationModule],
    providers: [
      GetLabelRecommendationsUseCase,
      { provide: LabelHybridModelCacheService, useValue: labelHybridCacheStub },
      PgLabelEmbeddingRepository,
      { provide: LABEL_EMBEDDING_REPOSITORY, useExisting: PgLabelEmbeddingRepository },
      { provide: USER_PREFERENCES_REPOSITORY, useClass: PgUserPreferencesRepository },
    ],
  }).compile();
  return moduleRef.get(GetLabelRecommendationsUseCase);
}
