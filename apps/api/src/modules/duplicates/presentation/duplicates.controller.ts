// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ApplyDuplicateSetDecisionsRequest } from '@docuvate/contracts';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { OkResponseDto } from '../../../shared/presentation/dtos/common.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import {
  ApplyDuplicateSetDecisionsUseCase,
  ArchiveDuplicateSetUseCase,
  DismissDuplicateSetUseCase,
  ListDuplicateSetsUseCase,
} from '../application/duplicate-set.use-cases.js';

@ApiDocuvateController('duplicates')
@Controller('duplicate-sets')
@UseGuards(AuthGuard)
export class DuplicatesController {
  constructor(
    private readonly listDuplicateSets: ListDuplicateSetsUseCase,
    private readonly archiveDuplicateSet: ArchiveDuplicateSetUseCase,
    private readonly dismissDuplicateSet: DismissDuplicateSetUseCase,
    private readonly applyDuplicateSetDecisions: ApplyDuplicateSetDecisionsUseCase
  ) {}

  @Get()
  @ApiDocuvateRoute({ operationId: 'listDuplicateSets', summary: 'List duplicate suggestion sets' })
  async list(
    @Session() session: AuthSession,
    @Query('documentId') documentId?: string
  ) {
    const items = await this.listDuplicateSets.execute(session.user.id, documentId);
    return { items };
  }

  @Post('apply-decisions')
  @ApiDocuvateRoute({
    operationId: 'applyDuplicateSetDecisions',
    summary: 'Apply duplicate set decisions in batch',
  })
  async applyDecisions(
    @Session() session: AuthSession,
    @Body() body: ApplyDuplicateSetDecisionsRequest
  ): Promise<OkResponseDto> {
    await this.applyDuplicateSetDecisions.execute(session.user.id, body);
    return { ok: true };
  }

  @Post(':setId/archive')
  @ApiDocuvateRoute({
    operationId: 'archiveDuplicateSet',
    summary: 'Keep newest document and archive other set members',
  })
  async archive(@Session() session: AuthSession, @Param('setId') setId: string): Promise<OkResponseDto> {
    await this.archiveDuplicateSet.execute(session.user.id, setId);
    return { ok: true };
  }

  @Post(':setId/dismiss')
  @ApiDocuvateRoute({
    operationId: 'dismissDuplicateSet',
    summary: 'Dismiss duplicate set (not duplicates)',
  })
  async dismiss(@Session() session: AuthSession, @Param('setId') setId: string): Promise<OkResponseDto> {
    await this.dismissDuplicateSet.execute(session.user.id, setId);
    return { ok: true };
  }
}
