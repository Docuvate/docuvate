// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { OkResponseDto } from '../../../shared/presentation/dtos/common.dto.js';
import {
  AcceptLabelRecommendationRequestDto,
  AcceptLabelRecommendationResponseDto,
  AddLabelRecommendationBlocklistRequestDto,
  ConfirmLabelRecommendationBlocklistPatternRequestDto,
  DismissLabelRecommendationRequestDto,
  LabelMapResponseDtoClass,
  LabelRecommendationBlocklistEntryResponseDto,
  LabelRecommendationBlocklistListResponseDto,
  LabelRecommendationListResponseDto,
  ProposeLabelRecommendationBlocklistPatternRequestDto,
} from '../../../shared/presentation/dtos/labels.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import {
  ConfirmBlocklistPatternUseCase,
  ProposeBlocklistPatternUseCase,
  RemoveBlocklistPatternUseCase,
} from '../application/blocklist-pattern.use-case.js';
import { GetLabelMapUseCase } from '../application/get-label-map.use-case.js';
import { GetLabelRecommendationsUseCase } from '../application/get-label-recommendations.use-case.js';
import {
  AcceptLabelRecommendationUseCase,
  DismissLabelRecommendationUseCase,
} from '../application/label-recommendation-actions.use-case.js';
import {
  AddRecommendationBlocklistUseCase,
  ListRecommendationBlocklistUseCase,
  RemoveRecommendationBlocklistUseCase,
} from '../application/recommendation-blocklist.use-case.js';

@ApiDocuvateController('taxonomy')
@Controller('labels')
@UseGuards(AuthGuard)
export class LabelsOverviewController {
  constructor(
    private readonly getRecommendations: GetLabelRecommendationsUseCase,
    private readonly getMap: GetLabelMapUseCase,
    private readonly acceptRecommendation: AcceptLabelRecommendationUseCase,
    private readonly dismissRecommendation: DismissLabelRecommendationUseCase,
    private readonly listBlocklist: ListRecommendationBlocklistUseCase,
    private readonly addBlocklist: AddRecommendationBlocklistUseCase,
    private readonly removeBlocklist: RemoveRecommendationBlocklistUseCase,
    private readonly proposeBlocklistPattern: ProposeBlocklistPatternUseCase,
    private readonly confirmBlocklistPattern: ConfirmBlocklistPatternUseCase,
    private readonly removeBlocklistPattern: RemoveBlocklistPatternUseCase
  ) {}

  @Get('recommendations')
  @ApiDocuvateRoute({ operationId: 'recommendations', summary: 'recommendations' })
  async recommendations(
    @Session() session: AuthSession
  ): Promise<LabelRecommendationListResponseDto> {
    const items = await this.getRecommendations.execute(session.user.id);
    return { items };
  }

  @Get('map')
  @ApiDocuvateRoute({ operationId: 'map', summary: 'map' })
  async map(@Session() session: AuthSession): Promise<LabelMapResponseDtoClass> {
    return this.getMap.execute(session.user.id);
  }

  @Post('recommendations/:id/accept')
  @ApiDocuvateRoute({
    operationId: 'acceptLabelRecommendation',
    summary: 'Accept label recommendation',
  })
  async accept(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: AcceptLabelRecommendationRequestDto
  ): Promise<AcceptLabelRecommendationResponseDto> {
    return this.acceptRecommendation.execute(session.user.id, {
      recommendationId: decodeURIComponent(id),
      proposedName: body.proposedName,
      tagId: body.tagId,
      keepTagId: body.keepTagId,
      removeTagId: body.removeTagId,
      color: body.color,
    });
  }

  @Post('recommendations/:id/dismiss')
  @ApiDocuvateRoute({
    operationId: 'dismissLabelRecommendation',
    summary: 'Dismiss label recommendation',
  })
  async dismiss(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: DismissLabelRecommendationRequestDto
  ): Promise<OkResponseDto> {
    await this.dismissRecommendation.execute(session.user.id, decodeURIComponent(id), body);
    return { ok: true };
  }

  @Get('recommendation-blocklist')
  @ApiDocuvateRoute({ operationId: 'blocklist', summary: 'blocklist' })
  async blocklist(
    @Session() session: AuthSession
  ): Promise<LabelRecommendationBlocklistListResponseDto> {
    return this.listBlocklist.execute(session.user.id);
  }

  @Post('recommendation-blocklist/propose-pattern')
  @ApiDocuvateRoute({ operationId: 'proposePattern', summary: 'proposePattern' })
  async proposePattern(
    @Session() session: AuthSession,
    @Body() body: ProposeLabelRecommendationBlocklistPatternRequestDto
  ) {
    return this.proposeBlocklistPattern.execute(session.user.id, body.phrases);
  }

  @Post('recommendation-blocklist/patterns')
  @ApiDocuvateRoute({ operationId: 'confirmPattern', summary: 'confirmPattern' })
  async confirmPattern(
    @Session() session: AuthSession,
    @Body() body: ConfirmLabelRecommendationBlocklistPatternRequestDto
  ) {
    const entry = await this.confirmBlocklistPattern.execute(session.user.id, body.pattern);
    return {
      id: entry.id,
      pattern: entry.pattern,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  @Delete('recommendation-blocklist/patterns/:id')
  @ApiDocuvateRoute({ operationId: 'removePattern', summary: 'removePattern' })
  async removePattern(
    @Session() session: AuthSession,
    @Param('id') id: string
  ): Promise<OkResponseDto> {
    await this.removeBlocklistPattern.execute(session.user.id, id);
    return { ok: true };
  }

  @Post('recommendation-blocklist')
  @ApiDocuvateRoute({ operationId: 'addBlocklistEntry', summary: 'addBlocklistEntry' })
  async addBlocklistEntry(
    @Session() session: AuthSession,
    @Body() body: AddLabelRecommendationBlocklistRequestDto
  ): Promise<LabelRecommendationBlocklistEntryResponseDto> {
    const entry = await this.addBlocklist.execute(session.user.id, body.phrase);
    return {
      id: entry.id,
      phrase: entry.phrase,
      source: entry.source,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  @Delete('recommendation-blocklist/:id')
  @ApiDocuvateRoute({ operationId: 'removeBlocklistEntry', summary: 'removeBlocklistEntry' })
  async removeBlocklistEntry(
    @Session() session: AuthSession,
    @Param('id') id: string
  ): Promise<OkResponseDto> {
    await this.removeBlocklist.execute(session.user.id, id);
    return { ok: true };
  }
}
