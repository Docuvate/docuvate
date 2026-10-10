// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

function parseOptionalQueryBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}
import type {
  DocumentDto,
  DocumentSortField,
  DocumentStatus,
  SortOrder,
  UpdateDocumentRequest,
} from '@docuvate/contracts';
import type { ExtractedField } from '@docuvate/contracts';

import { ExtractedFieldDto,ExtractionBlockDto } from './common.dto.js';

const DOCUMENT_STATUSES: DocumentStatus[] = ['uploaded', 'queued', 'extracting', 'ready', 'failed'];
const SORT_FIELDS: DocumentSortField[] = ['updatedAt', 'createdAt', 'title', 'documentDate'];
const SORT_ORDERS: SortOrder[] = ['asc', 'desc'];

/** Raw query-string shape before {@link parseDocumentListQuery} normalization. */
export class DocumentListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(DOCUMENT_STATUSES)
  status?: DocumentStatus;

  @IsOptional()
  @IsUUID('4')
  tagId?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsUUID('4')
  correspondentId?: string;

  @IsOptional()
  @IsUUID('4')
  folderId?: string;

  @IsOptional()
  @IsUUID('4')
  mappeId?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'When true, only documents without a non-inbox label are returned.',
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalQueryBoolean(value))
  @IsBoolean()
  withoutNonInboxLabel?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'When true, only documents without a folder assignment are returned.',
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalQueryBoolean(value))
  @IsBoolean()
  unfiled?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'When true, only documents in the inbox label are returned.',
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalQueryBoolean(value))
  @IsBoolean()
  inbox?: boolean;

  @IsOptional()
  @IsString()
  documentDateFrom?: string;

  @IsOptional()
  @IsString()
  documentDateTo?: string;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sort?: DocumentSortField;

  @IsOptional()
  @IsIn(SORT_ORDERS)
  order?: SortOrder;
}

export class UpdateDocumentRequestDto implements UpdateDocumentRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  documentDate?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsUUID('4')
  folderId?: string | null;

  @IsOptional()
  @IsUUID('4')
  mappeId?: string | null;

  @IsOptional()
  @IsUUID('4')
  correspondentId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedFieldDto)
  extractionFields?: ExtractedFieldDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractionBlockDto)
  extractionBlocks?: ExtractionBlockDto[];
}

export class DocumentListResponseDto {
  items!: DocumentDto[];
}

export class DocumentExtractionSummaryDto {
  @ApiProperty()
  text!: string;

  @ApiProperty({ type: [ExtractedFieldDto] })
  fields!: ExtractedField[];

  @ApiPropertyOptional()
  markdown?: string;

  @ApiPropertyOptional({
    description: 'True when persisted layout IR exists (fetch via GET /documents/:id/layout-ir).',
  })
  layoutIrAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Page dimensions from persisted layout IR (no block payload).',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        widthPt: { type: 'number' },
        heightPt: { type: 'number' },
      },
    },
  })
  layoutIrPages?: { page: number; widthPt: number; heightPt: number }[];
}

export class DocumentResponseDto implements DocumentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  filename!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: DOCUMENT_STATUSES })
  status!: DocumentStatus;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  tags!: DocumentDto['tags'];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: DocumentExtractionSummaryDto })
  extraction?: DocumentExtractionSummaryDto;
}
