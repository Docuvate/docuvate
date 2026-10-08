import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, Session, type AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { ListExtractionFieldCorrectionsUseCase } from '../application/list-extraction-field-corrections.use-case.js';
import { toExtractionFieldCorrectionDto } from './extraction-feedback.mapper.js';

import { ApiDocuvateController, ApiDocuvateRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';

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
