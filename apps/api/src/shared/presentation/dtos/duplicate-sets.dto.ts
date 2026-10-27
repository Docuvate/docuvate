// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateSetListResponse } from '@docuvate/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { CursorListQueryDto } from './cursor-list-query.dto.js';

export class ListDuplicateSetsQueryDto extends CursorListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  documentId?: string;
}

export class DuplicateSetListResponseDtoClass implements DuplicateSetListResponse {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  items!: DuplicateSetListResponse['items'];

  @ApiProperty({ nullable: true })
  nextCursor!: string | null;

  @ApiProperty()
  hasMore!: boolean;

  @ApiProperty({ nullable: true })
  total!: number | null;
}
