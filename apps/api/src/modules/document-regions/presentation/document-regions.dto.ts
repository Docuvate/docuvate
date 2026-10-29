// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class LayoutTokenDto {
  @ApiProperty()
  blockIndex!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  x0!: number;

  @ApiProperty()
  y0!: number;

  @ApiProperty()
  x1!: number;

  @ApiProperty()
  y1!: number;

  @ApiProperty()
  text!: string;
}

export class DocumentLayoutTokensResponseDto {
  @ApiProperty({ nullable: true, type: Number })
  page!: number | null;

  @ApiProperty()
  irSha256!: string;

  @ApiProperty({ type: [LayoutTokenDto] })
  tokens!: LayoutTokenDto[];
}

export class DocumentRegionFieldDto {
  @ApiProperty()
  fieldKey!: string;

  @ApiProperty({ nullable: true, type: String })
  valueOverride!: string | null;
}

export class DocumentRegionTableRuleDto {
  @ApiProperty({ enum: ['row', 'col'] })
  axis!: 'row' | 'col';

  @ApiProperty()
  ord!: number;

  @ApiProperty()
  pos!: number;
}

export class DocumentRegionTableMergeDto {
  @ApiProperty()
  row0!: number;

  @ApiProperty()
  col0!: number;

  @ApiProperty()
  rowSpan!: number;

  @ApiProperty()
  colSpan!: number;
}

export class DocumentRegionTableCellDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  row!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  col!: number;

  @ApiProperty()
  @IsString()
  text!: string;
}

export class DocumentRegionTableDto {
  @ApiProperty({ enum: ['line_items', 'key_value', 'other'] })
  tableType!: 'line_items' | 'key_value' | 'other';

  @ApiProperty()
  headerRows!: number;

  @ApiProperty()
  headerCols!: number;

  @ApiProperty({ type: [DocumentRegionTableRuleDto] })
  rules!: DocumentRegionTableRuleDto[];

  @ApiProperty({ type: [DocumentRegionTableMergeDto] })
  merges!: DocumentRegionTableMergeDto[];

  @ApiProperty({ type: [DocumentRegionTableCellDto] })
  cells!: DocumentRegionTableCellDto[];
}

export class DocumentRegionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  page!: number;

  @ApiProperty({ enum: ['rect', 'polygon'] })
  shape!: 'rect' | 'polygon';

  @ApiProperty({ enum: ['field', 'table', 'block', 'ignore'] })
  role!: 'field' | 'table' | 'block' | 'ignore';

  @ApiProperty()
  x0!: number;

  @ApiProperty()
  y0!: number;

  @ApiProperty()
  x1!: number;

  @ApiProperty()
  y1!: number;

  @ApiProperty()
  irSha256!: string;

  @ApiProperty()
  needsReview!: boolean;

  @ApiProperty({ type: [Number] })
  blockIndexes!: number[];

  @ApiPropertyOptional({ type: DocumentRegionFieldDto })
  field?: DocumentRegionFieldDto;

  @ApiPropertyOptional({ type: DocumentRegionTableDto })
  table?: DocumentRegionTableDto;

  @ApiProperty()
  createdAt!: string;
}

export class DocumentRegionListResponseDto {
  @ApiProperty({ nullable: true, type: String })
  irSha256!: string | null;

  @ApiProperty({ type: [DocumentRegionDto] })
  items!: DocumentRegionDto[];
}

export class ApplyFieldCorrectionRequestDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty({ enum: ['create', 'reanchor', 'edit_value', 'remove'] })
  @IsIn(['create', 'reanchor', 'edit_value', 'remove'])
  op!: 'create' | 'reanchor' | 'edit_value' | 'remove';

  @ApiProperty()
  @IsString()
  fieldKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ enum: ['rect', 'polygon'] })
  @IsOptional()
  @IsIn(['rect', 'polygon'])
  shape?: 'rect' | 'polygon';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  x0?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  y0?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  x1?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  y1?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  blockIndexes?: number[];

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  valueOverride?: string | null;

  @ApiPropertyOptional({ enum: ['document', 'label', 'always'] })
  @IsOptional()
  @IsIn(['document', 'label', 'always'])
  scope?: 'document' | 'label' | 'always';

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsUUID()
  tagId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsUUID()
  beforeRegionId?: string | null;
}

export class DocumentCorrectionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  documentId!: string;

  @ApiProperty({ enum: ['label', 'field', 'table', 'block'] })
  kind!: 'label' | 'field' | 'table' | 'block';

  @ApiProperty({ enum: ['active', 'withdrawn'] })
  status!: 'active' | 'withdrawn';

  @ApiProperty()
  op!: string;

  @ApiProperty()
  fieldKey!: string;

  @ApiProperty({ nullable: true, type: String })
  beforeRegionId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  afterRegionId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  oldValue!: string | null;

  @ApiProperty({ nullable: true, type: String })
  newValue!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class ApplyFieldCorrectionResponseDto {
  @ApiProperty()
  noChange!: boolean;

  @ApiProperty({ nullable: true, type: DocumentCorrectionDto })
  correction!: DocumentCorrectionDto | null;

  @ApiProperty({ nullable: true, type: DocumentRegionDto })
  region!: DocumentRegionDto | null;
}

export class ConfirmDocumentFieldRequestDto {
  @ApiProperty()
  @IsString()
  fieldKey!: string;

  @ApiProperty()
  @IsString()
  value!: string;
}

export class ConfirmDocumentFieldResponseDto {
  @ApiProperty()
  confirmed!: boolean;

  @ApiProperty()
  fieldKey!: string;

  @ApiProperty()
  valueSha256!: string;
}

export class LayoutTokensQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

export class DocumentRegionsQueryDto {
  @ApiPropertyOptional({ enum: ['field', 'table', 'block', 'ignore'] })
  @IsOptional()
  @IsIn(['field', 'table', 'block', 'ignore'])
  role?: 'field' | 'table' | 'block' | 'ignore';
}

export class ApplyTableCorrectionRequestDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty({ enum: ['create', 'set_headers', 'edit_cell', 'remove'] })
  @IsIn(['create', 'set_headers', 'edit_cell', 'remove'])
  op!: 'create' | 'set_headers' | 'edit_cell' | 'remove';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ enum: ['rect', 'polygon'] })
  @IsOptional()
  @IsIn(['rect', 'polygon'])
  shape?: 'rect' | 'polygon';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  x0?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  y0?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  x1?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  y1?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  blockIndexes?: number[];

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsUUID()
  beforeRegionId?: string | null;

  @ApiPropertyOptional({ enum: ['line_items', 'key_value', 'other'] })
  @IsOptional()
  @IsIn(['line_items', 'key_value', 'other'])
  tableType?: 'line_items' | 'key_value' | 'other';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  headerRows?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  headerCols?: number;

  @ApiPropertyOptional({ type: DocumentRegionTableCellDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentRegionTableCellDto)
  cell?: DocumentRegionTableCellDto;
}

export class ApplyTableCorrectionResponseDto {
  @ApiProperty()
  noChange!: boolean;

  @ApiProperty({ nullable: true, type: DocumentCorrectionDto })
  correction!: DocumentCorrectionDto | null;

  @ApiProperty({ nullable: true, type: DocumentRegionDto })
  region!: DocumentRegionDto | null;
}
