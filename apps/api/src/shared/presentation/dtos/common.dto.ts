// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MatchingAlgorithm } from '@docuvate/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const MATCHING_ALGORITHMS: MatchingAlgorithm[] = ['none', 'any', 'all', 'exact', 'regex'];

export class ProblemDetailsDto {
  @ApiProperty({ example: 'about:blank' })
  type!: string;

  @ApiProperty({ example: 'Forbidden' })
  title!: string;

  @ApiProperty({ example: 403 })
  status!: number;

  @ApiProperty({ example: 'DOC_ACCESS_FORBIDDEN' })
  code!: string;

  @ApiProperty({ example: 'errors.codes.DOC_ACCESS_FORBIDDEN' })
  detail!: string;

  @ApiProperty({ example: '7f3a91c2' })
  requestId!: string;
}

export class OkResponseDto {
  @IsBoolean()
  ok!: true;
}

export class ExtractedFieldDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

export class ExtractionBlockDto {
  @IsInt()
  @Min(1)
  page!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  x!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  y!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  width!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  height!: number;

  @IsString()
  text!: string;

  @IsOptional()
  @IsInt()
  blockIndex?: number;
}

const DOCUMENT_EXTRACTION_IMAGE_KINDS = ['embedded', 'figure'] as const;

export class DocumentExtractionImageDto {
  @ApiProperty()
  @IsUUID('4')
  id!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  x!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  y!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  width!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  height!: number;

  @ApiProperty({ enum: DOCUMENT_EXTRACTION_IMAGE_KINDS })
  @IsIn(DOCUMENT_EXTRACTION_IMAGE_KINDS)
  kind!: (typeof DOCUMENT_EXTRACTION_IMAGE_KINDS)[number];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  caption?: string | null;
}

export class MatchingAlgorithmFieldsDto {
  @IsOptional()
  @IsIn(MATCHING_ALGORITHMS)
  matchingAlgorithm?: MatchingAlgorithm;

  @IsOptional()
  @IsString()
  match?: string;
}

class DocumentBulkActionDto {
  @IsIn(['addTag', 'removeTag', 'setAbsender', 'setFolder', 'delete'])
  action!: 'addTag' | 'removeTag' | 'setAbsender' | 'setFolder' | 'delete';

  @ValidateIf((o: DocumentBulkActionDto) => o.action === 'addTag' || o.action === 'removeTag')
  @IsUUID('4')
  tagId?: string;

  @ValidateIf((o: DocumentBulkActionDto) => o.action === 'setAbsender')
  @IsOptional()
  @IsString()
  value?: string | null;

  @ValidateIf((o: DocumentBulkActionDto) => o.action === 'setFolder')
  @IsOptional()
  @IsUUID('4')
  folderId?: string | null;
}

export class DocumentBulkRequestDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];

  @ValidateNested()
  @Type(() => DocumentBulkActionDto)
  bulk!: DocumentBulkActionDto;
}

export class ExtractionCompareRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  engines?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxPages?: number;
}

export class ExtractionArenaRatingRequestDto {
  @IsString()
  winnerEngine!: string;

  @IsArray()
  @IsString({ each: true })
  comparedEngines!: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  applyAsDefault?: boolean;
}

export class DuplicateStackSetPrimaryRequestDto {
  @IsUUID('4')
  documentId!: string;

  @IsUUID('4')
  stackId!: string;
}

export class DuplicateStackKeepVersionRequestDto {
  @IsUUID('4')
  versionDocumentId!: string;
}

export class DuplicateStackNotDuplicateRequestDto {
  @IsUUID('4')
  otherDocumentId!: string;
}
