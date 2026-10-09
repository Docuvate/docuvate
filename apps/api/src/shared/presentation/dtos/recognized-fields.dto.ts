// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type { CustomFieldType, ReplaceRecognizedFieldsRequest } from '@docuvate/contracts';

export class ReplaceRecognizedFieldItemDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsIn(['text', 'date', 'number', 'currency'])
  fieldType?: CustomFieldType;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  extractForAllDocuments?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gateLabelIds?: string[];

  @IsOptional()
  @IsIn(['any', 'all'])
  gateLabelMatch?: 'any' | 'all';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minLabelConfidence?: number | null;

  @IsOptional()
  @IsBoolean()
  confidenceGateEnabled?: boolean | null;
}

export class ReplaceRecognizedFieldsRequestDto implements ReplaceRecognizedFieldsRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplaceRecognizedFieldItemDto)
  fields!: ReplaceRecognizedFieldItemDto[];
}
