// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DashboardWidgetDocumentPreviewsResponseDto,
  DashboardWidgetPreviewType,
} from '@docuvate/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsUUID, Max, Min, IsNumber } from 'class-validator';

import { CURSOR_LIST_MAX_LIMIT } from '../../infrastructure/pagination/clamp-cursor-list-limit.js';

const WIDGET_TYPES: DashboardWidgetPreviewType[] = ['recent_documents', 'attention', 'saved_view'];

export class DashboardWidgetDocumentPreviewsQueryDto {
  @ApiProperty({ enum: WIDGET_TYPES })
  @IsIn(WIDGET_TYPES)
  type!: DashboardWidgetPreviewType;

  @ApiPropertyOptional({ maximum: CURSOR_LIST_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(CURSOR_LIST_MAX_LIMIT)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  savedViewId?: string;
}

export class DashboardWidgetDocumentPreviewsResponseDtoClass
  implements DashboardWidgetDocumentPreviewsResponseDto
{
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  items!: DashboardWidgetDocumentPreviewsResponseDto['items'];

  @ApiPropertyOptional()
  attentionCount?: number;
}

export class GlobalChatSuggestionBootstrapDtoClass {
  @ApiProperty({ nullable: true })
  topTagId!: string | null;

  @ApiProperty({ nullable: true })
  topTagName!: string | null;

  @ApiProperty()
  topTagDocumentCount!: number;

  @ApiProperty()
  amountTaggedDocumentCount!: number;

  @ApiPropertyOptional()
  contractEndSample?: { label: string; value: string };

  @ApiProperty({ type: [String] })
  recentQuestions!: string[];
}
