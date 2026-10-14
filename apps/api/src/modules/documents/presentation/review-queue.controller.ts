// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import {
  AuthGuard,
  type AuthSession,
  AuthSubject,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  AcceptDocumentReviewBatchRequestDto,
  AcceptDocumentReviewBatchResponseDtoClass,
  AcceptDocumentReviewResponseDtoClass,
  DocumentReviewQueueResponseDtoClass,
  DocumentReviewQueueSummaryDtoClass,
  ReviewQueueQueryDto,
} from '../../../shared/presentation/dtos/review-queue.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { AcceptDocumentReviewUseCase } from '../application/document-review/accept-document-review.use-case.js';
import { AcceptDocumentReviewBatchUseCase } from '../application/document-review/accept-document-review-batch.use-case.js';
import { ListDocumentReviewQueueUseCase } from '../application/document-review/list-document-review-queue.use-case.js';

@ApiDocuvateController('review-queue')
@Controller('review-queue')
@UseGuards(AuthGuard)
export class ReviewQueueController {
  constructor(
    private readonly listQueue: ListDocumentReviewQueueUseCase,
    private readonly acceptReview: AcceptDocumentReviewUseCase,
    private readonly acceptBatch: AcceptDocumentReviewBatchUseCase
  ) {}

  @Get('summary')
  @ApiDocuvateRoute({
    operationId: 'getDocumentReviewQueueSummary',
    summary: 'Count documents with open review suggestions',
  })
  async summary(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject
  ): Promise<DocumentReviewQueueSummaryDtoClass> {
    return this.listQueue.summary(session.user.id, subject);
  }

  @Get()
  @ApiDocuvateRoute({
    operationId: 'listDocumentReviewQueue',
    summary: 'List documents pending label, field, or duplicate review',
  })
  async list(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Query() query: ReviewQueueQueryDto
  ): Promise<DocumentReviewQueueResponseDtoClass> {
    return this.listQueue.execute(session.user.id, subject, {
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Post('documents/:documentId/accept-all')
  @ApiDocuvateRoute({
    operationId: 'acceptDocumentReviewAll',
    summary: 'Accept all open suggestions on one document',
  })
  async acceptAll(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('documentId') documentId: string
  ): Promise<AcceptDocumentReviewResponseDtoClass> {
    return this.acceptReview.execute(documentId, session.user.id, subject, { minConfidence: 0 });
  }

  @Post('accept-high-confidence')
  @ApiDocuvateRoute({
    operationId: 'acceptDocumentReviewHighConfidenceBatch',
    summary: 'Accept suggestions at or above a confidence threshold across the queue',
  })
  async acceptHighConfidence(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Body() body: AcceptDocumentReviewBatchRequestDto
  ): Promise<AcceptDocumentReviewBatchResponseDtoClass> {
    const minConfidence = body.minConfidence ?? 0.9;
    return this.acceptBatch.execute(session.user.id, subject, minConfidence);
  }
}
