// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';

import { GetLabelRecommendationsUseCase } from '../../../src/modules/labels/application/get-label-recommendations.use-case.js';
import { LabelsModule } from '../../../src/modules/labels/labels.module.js';
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module.js';

export async function createLabelsRecommendationsUseCase(): Promise<GetLabelRecommendationsUseCase> {
  const moduleRef = await Test.createTestingModule({
    imports: [DatabaseModule, LabelsModule],
  }).compile();
  return moduleRef.get(GetLabelRecommendationsUseCase);
}
