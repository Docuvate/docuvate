// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CURSOR_LIST_DEFAULT_LIMIT, CURSOR_LIST_MAX_LIMIT } from '@docuvate/contracts';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { clampCursorListLimit } from '../../infrastructure/pagination/clamp-cursor-list-limit.js';
import { parseOptionalCursor } from '../../infrastructure/pagination/id-tiebreaker-cursor.js';

export class CursorListQueryDto {
  @ApiPropertyOptional({ default: CURSOR_LIST_DEFAULT_LIMIT, maximum: CURSOR_LIST_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(CURSOR_LIST_MAX_LIMIT)
  limit?: number;

  @ApiPropertyOptional({ description: 'Opaque keyset cursor from a previous response' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export function parseCursorListQuery(dto: CursorListQueryDto): {
  limit: number;
  cursor?: string;
} {
  return {
    limit: clampCursorListLimit(dto.limit),
    cursor: parseOptionalCursor(dto.cursor),
  };
}
