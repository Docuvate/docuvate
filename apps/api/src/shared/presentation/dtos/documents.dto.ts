import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import type {
  DocumentDto,
  DocumentSortField,
  DocumentStatus,
  SortOrder,
  UpdateDocumentRequest,
} from '@docuvate/contracts';
import { ExtractionBlockDto, ExtractedFieldDto } from './common.dto.js';
import type { ExtractedField } from '@docuvate/contracts';

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

  @IsOptional()
  @IsString()
  withoutNonInboxLabel?: string;

  @IsOptional()
  @IsString()
  unfiled?: string;

  @IsOptional()
  @IsString()
  inbox?: string;

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
