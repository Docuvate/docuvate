// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  CorrespondentDto,
  CreateCorrespondentRequest,
  CreateTagRequest,
  TagDto,
  UpdateCorrespondentRequest,
  UpdateTagRequest,
} from '@docuvate/contracts';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { MatchingAlgorithmFieldsDto } from './common.dto.js';

export class CreateTagRequestDto extends MatchingAlgorithmFieldsDto implements CreateTagRequest {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isInbox?: boolean;
}

export class UpdateTagRequestDto extends MatchingAlgorithmFieldsDto implements UpdateTagRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsBoolean()
  isInbox?: boolean;
}

export class CreateCorrespondentRequestDto
  extends MatchingAlgorithmFieldsDto
  implements CreateCorrespondentRequest
{
  @IsString()
  name!: string;
}

export class UpdateCorrespondentRequestDto
  extends MatchingAlgorithmFieldsDto
  implements UpdateCorrespondentRequest
{
  @IsOptional()
  @IsString()
  name?: string;
}

export class TagListResponseDto {
  items!: TagDto[];
}

export class TagSearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}

export class TagSearchResponseDto {
  items!: TagDto[];
  nextCursor!: string | null;
  hasMore!: boolean;
  total!: number | null;
}

export class CorrespondentListResponseDto {
  items!: CorrespondentDto[];
}
