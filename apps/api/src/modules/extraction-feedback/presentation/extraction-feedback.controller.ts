// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { ListExtractionFieldCorrectionsUseCase } from '../application/list-extraction-field-corrections.use-case.js';
import { toExtractionFieldCorrectionDto } from './extraction-feedback.mapper.js';

@ApiDocuvateController('settings')
@Controller('extraction-feedback')
@UseGuards(AuthGuard)
export class ExtractionFeedbackController {
  constructor(private readonly listCorrections: ListExtractionFieldCorrectionsUseCase) {}

  /**
   * Export hook for pipeline / re-finetune jobs (cursor via afterCreatedAt + afterId).
   */
  @Get('field-corrections')
  @ApiDocuvateRoute({ operationId: 'listFieldCorrections', summary: 'listFieldCorrections' })
  async listFieldCorrections(
    @Session() session: AuthSession,
    @Query('limit') limit?: string,
    @Query('afterCreatedAt') afterCreatedAt?: string,
    @Query('afterId') afterId?: string
  ) {
    const parsedLimit = limit != null ? Number.parseInt(limit, 10) : undefined;
    const items = await this.listCorrections.execute(session.user.id, {
      limit: Number.isNaN(parsedLimit ?? NaN) ? undefined : parsedLimit,
      afterCreatedAt,
      afterId,
    });
    return { items: items.map(toExtractionFieldCorrectionDto) };
  }
}
