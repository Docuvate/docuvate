// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ConfirmDocumentFieldRequest,
  ConfirmDocumentFieldResponse,
  TableRowRole,
  TableRuleLine,
} from '@docuvate/contracts';
import { TABLE_ROW_ROLES, TABLE_RULE_LINES } from '@docuvate/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class LayoutTokenDto {
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

class DocumentRegionFieldDto {
  @ApiProperty()
  fieldKey!: string;

  @ApiProperty({ nullable: true, type: String })
  valueOverride!: string | null;
}

class DocumentRegionTableRuleDto {
  @ApiProperty({ enum: ['row', 'col'] })
  axis!: 'row' | 'col';

  @ApiProperty()
  ord!: number;

  @ApiProperty()
  pos!: number;

  @ApiProperty({
    enum: TABLE_RULE_LINES,
    description: 'Line evidence; unknown until observed or set.',
  })
  line!: TableRuleLine;
}

class DocumentRegionTableRowRoleDto {
  @ApiProperty()
  row!: number;

  @ApiProperty({ enum: TABLE_ROW_ROLES })
  role!: TableRowRole;
}

class TableRowRoleInputDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  row!: number;

  @ApiProperty({ enum: TABLE_ROW_ROLES })
  @IsIn(TABLE_ROW_ROLES)
  role!: TableRowRole;
}

class TableRuleLineInputDto {
  @ApiProperty({ enum: ['row', 'col'] })
  @IsIn(['row', 'col'])
  axis!: 'row' | 'col';

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ord!: number;

  @ApiProperty({ enum: TABLE_RULE_LINES })
  @IsIn(TABLE_RULE_LINES)
  line!: TableRuleLine;
}

class DocumentRegionTableMergeDto {
  @ApiProperty()
  row0!: number;

  @ApiProperty()
  col0!: number;

  @ApiProperty()
  rowSpan!: number;

  @ApiProperty()
  colSpan!: number;
}

class TableMergeInputDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  row0!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  col0!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rowSpan!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  colSpan!: number;
}

class DocumentRegionTableCellDto {
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

class DocumentRegionTableDto {
  @ApiProperty({ enum: ['line_items', 'key_value', 'other'] })
  tableType!: 'line_items' | 'key_value' | 'other';

  @ApiProperty({ description: 'Header rows; more than one is a nested header.' })
  headerRows!: number;

  @ApiProperty({ description: 'Trailing summary rows (results footer).' })
  footerRows!: number;

  @ApiProperty({ description: 'Leading index columns.' })
  headerCols!: number;

  @ApiProperty({ description: 'Trailing index columns (right or, with headerCols, double index).' })
  trailingHeaderCols!: number;

  @ApiProperty({ description: 'Alternating row tint (appearance only).' })
  banded!: boolean;

  @ApiProperty({ type: [DocumentRegionTableRowRoleDto] })
  rowRoles!: DocumentRegionTableRowRoleDto[];

  @ApiProperty({ type: [DocumentRegionTableRuleDto] })
  rules!: DocumentRegionTableRuleDto[];

  @ApiProperty({ type: [DocumentRegionTableMergeDto] })
  merges!: DocumentRegionTableMergeDto[];

  @ApiProperty({ type: [DocumentRegionTableCellDto] })
  cells!: DocumentRegionTableCellDto[];
}

class DocumentRegionDto {
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

class DocumentCorrectionDto {
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

export class ConfirmDocumentFieldRequestDto implements ConfirmDocumentFieldRequest {
  @ApiProperty({
    description: 'Storage key of the field as returned in `extraction.fields[].key`.',
    example: 'global:rechnungsnummer',
  })
  @IsString()
  @IsNotEmpty()
  fieldKey!: string;

  @ApiProperty({
    description: 'Value the person confirms. An empty string keeps the stored value.',
    example: 'RE-2024-0042',
  })
  @IsString()
  value!: string;
}

export class ConfirmDocumentFieldResponseDto implements ConfirmDocumentFieldResponse {
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

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  footerRows?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  trailingHeaderCols?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  banded?: boolean;

  @ApiPropertyOptional({
    type: [TableRowRoleInputDto],
    description:
      'Section headings and subtotals; replaces all row roles on create and set_headers.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TableRowRoleInputDto)
  rowRoles?: TableRowRoleInputDto[];

  @ApiPropertyOptional({
    type: [TableRuleLineInputDto],
    description: 'Line evidence for the listed grid rules; other rules keep theirs.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => TableRuleLineInputDto)
  ruleLines?: TableRuleLineInputDto[];

  @ApiPropertyOptional({
    type: [TableMergeInputDto],
    description: 'Merged cells; replaces all merges on create and set_headers.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TableMergeInputDto)
  merges?: TableMergeInputDto[];

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
