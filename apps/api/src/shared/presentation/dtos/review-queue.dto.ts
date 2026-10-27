// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  AcceptDocumentReviewBatchResponseDto,
  AcceptDocumentReviewResponseDto,
  DocumentReviewQueueResponseDto,
  DocumentReviewQueueSummaryDto,
  TagSuggestionDto,
} from '@docuvate/contracts';
import { CURSOR_LIST_DEFAULT_LIMIT, CURSOR_LIST_MAX_LIMIT } from '@docuvate/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

import { CursorListQueryDto } from './cursor-list-query.dto.js';

export class DocumentReviewFieldSuggestionDtoClass {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  displayLabel!: string;

  @ApiProperty()
  value!: string;

  @ApiPropertyOptional()
  confidence?: number;
}

export class DocumentDuplicateStackSummaryDtoClass {
  @ApiProperty()
  stackId!: string;

  @ApiProperty()
  versionCount!: number;

  @ApiProperty()
  pendingReview!: boolean;
}

export class DocumentReviewQueueItemDtoClass {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  filename!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  documentDate!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  suggestedDocumentDate!: string | null;

  @ApiProperty()
  uploadDate!: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  labelSuggestions!: TagSuggestionDto[];

  @ApiProperty({ type: [DocumentReviewFieldSuggestionDtoClass] })
  fieldSuggestions!: DocumentReviewFieldSuggestionDtoClass[];

  @ApiPropertyOptional({ type: DocumentDuplicateStackSummaryDtoClass, nullable: true })
  duplicateStack!: DocumentDuplicateStackSummaryDtoClass | null;
}

export class DocumentReviewQueueResponseDtoClass implements DocumentReviewQueueResponseDto {
  @ApiProperty({ type: [DocumentReviewQueueItemDtoClass] })
  items!: DocumentReviewQueueItemDtoClass[];

  @ApiProperty({ nullable: true })
  nextCursor!: string | null;

  @ApiProperty()
  hasMore!: boolean;

  @ApiProperty({ nullable: true })
  total!: number | null;
}

export class DocumentReviewQueueSummaryDtoClass implements DocumentReviewQueueSummaryDto {
  @ApiProperty()
  pendingCount!: number;
}

export class AcceptDocumentReviewResponseDtoClass implements AcceptDocumentReviewResponseDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  acceptedLabels!: number;

  @ApiProperty()
  acceptedFields!: number;
}

export class AcceptDocumentReviewBatchResponseDtoClass implements AcceptDocumentReviewBatchResponseDto {
  @ApiProperty()
  documentsProcessed!: number;

  @ApiProperty()
  acceptedLabels!: number;

  @ApiProperty()
  acceptedFields!: number;
}

export class AcceptDocumentReviewBatchRequestDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 1, default: 0.9 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minConfidence?: number;
}

export class ReviewQueueQueryDto extends CursorListQueryDto {
  @ApiPropertyOptional({ default: CURSOR_LIST_DEFAULT_LIMIT, maximum: CURSOR_LIST_MAX_LIMIT })
  declare limit?: number;
}
