// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Get, HttpCode, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import {
  AuthGuard,
  type AuthSession,
  AuthSubject,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { OkResponseDto } from '../../../shared/presentation/dtos/common.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { ApplyFieldCorrectionUseCase } from '../application/apply-field-correction.use-case.js';
import { ConfirmDocumentFieldUseCase } from '../application/confirm-document-field.use-case.js';
import { ListDocumentRegionsUseCase } from '../application/list-document-regions.use-case.js';
import { ListLayoutTokensUseCase } from '../application/list-layout-tokens.use-case.js';
import { WithdrawFieldCorrectionUseCase } from '../application/withdraw-field-correction.use-case.js';
import {
  ApplyFieldCorrectionRequestDto,
  ApplyFieldCorrectionResponseDto,
  ConfirmDocumentFieldRequestDto,
  ConfirmDocumentFieldResponseDto,
  DocumentLayoutTokensResponseDto,
  DocumentRegionListResponseDto,
  DocumentRegionsQueryDto,
  LayoutTokensQueryDto,
} from './document-regions.dto.js';

@ApiDocuvateController('documents')
@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentRegionsController {
  constructor(
    private readonly listTokens: ListLayoutTokensUseCase,
    private readonly listRegions: ListDocumentRegionsUseCase,
    private readonly applyFieldCorrection: ApplyFieldCorrectionUseCase,
    private readonly withdrawFieldCorrection: WithdrawFieldCorrectionUseCase,
    private readonly confirmField: ConfirmDocumentFieldUseCase
  ) {}

  @Get(':id/layout/tokens')
  @ApiDocuvateRoute({
    operationId: 'listDocumentLayoutTokens',
    summary: 'Layout IR tokens for a document page',
  })
  @ApiOkResponse({ type: DocumentLayoutTokensResponseDto })
  async tokens(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Query() query: LayoutTokensQueryDto
  ): Promise<DocumentLayoutTokensResponseDto> {
    return this.listTokens.execute(id, session.user.id, subject, query.page);
  }

  @Get(':id/regions')
  @ApiDocuvateRoute({
    operationId: 'listDocumentRegions',
    summary: 'Active document regions',
  })
  @ApiOkResponse({ type: DocumentRegionListResponseDto })
  async regions(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Query() query: DocumentRegionsQueryDto
  ): Promise<DocumentRegionListResponseDto> {
    return this.listRegions.execute(id, session.user.id, subject, query.role);
  }

  @Post(':id/corrections')
  @ApiDocuvateRoute({
    operationId: 'applyDocumentFieldCorrection',
    summary: 'Create or update a field region correction',
  })
  @ApiOkResponse({ type: ApplyFieldCorrectionResponseDto })
  async applyCorrection(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Body() body: ApplyFieldCorrectionRequestDto,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<ApplyFieldCorrectionResponseDto | undefined> {
    const result = await this.applyFieldCorrection.execute(id, session.user.id, subject, body);
    if (result.noChange) {
      reply.code(204);
      return undefined;
    }
    return result;
  }

  @Post(':id/corrections/:correctionId/withdraw')
  @HttpCode(200)
  @ApiDocuvateRoute({
    operationId: 'withdrawDocumentFieldCorrection',
    summary: 'Withdraw a field correction',
  })
  async withdraw(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Param('correctionId') correctionId: string
  ): Promise<OkResponseDto> {
    await this.withdrawFieldCorrection.execute(id, session.user.id, subject, correctionId);
    return { ok: true };
  }

  @Post(':id/field-confirmations')
  @ApiDocuvateRoute({
    operationId: 'confirmDocumentField',
    summary: 'Confirm a field value without recording a correction',
  })
  @ApiOkResponse({ type: ConfirmDocumentFieldResponseDto })
  async confirm(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Body() body: ConfirmDocumentFieldRequestDto
  ): Promise<ConfirmDocumentFieldResponseDto> {
    return this.confirmField.execute(id, session.user.id, subject, body.fieldKey, body.value);
  }
}
