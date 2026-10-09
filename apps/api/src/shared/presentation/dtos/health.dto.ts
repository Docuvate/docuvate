// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class HealthResponseDto {
  @IsIn(['ok'])
  status!: 'ok';
}

export class ReadinessResponseDto {
  @IsIn(['ready', 'degraded'])
  status!: 'ready' | 'degraded';

  @IsOptional()
  @IsObject()
  checks?: Record<string, string>;
}
