// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto } from '@docuvate/contracts';
import { PASSWORD_LENGTH_MAX_BOUND, PASSWORD_LENGTH_MIN_BOUND } from '@docuvate/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class PasswordPolicyResponseDto implements PasswordPolicyDto {
  @ApiProperty({ minimum: PASSWORD_LENGTH_MIN_BOUND, maximum: PASSWORD_LENGTH_MAX_BOUND })
  minLength!: number;

  @ApiProperty()
  requireLower!: boolean;

  @ApiProperty()
  requireUpper!: boolean;

  @ApiProperty()
  requireDigit!: boolean;

  @ApiProperty()
  requireSymbol!: boolean;

  @ApiProperty()
  checkBreached!: boolean;
}

export class UpdatePasswordPolicyRequestDto implements PasswordPolicyDto {
  @Type(() => Number)
  @IsInt()
  @Min(PASSWORD_LENGTH_MIN_BOUND)
  @Max(PASSWORD_LENGTH_MAX_BOUND)
  minLength!: number;

  @IsBoolean()
  requireLower!: boolean;

  @IsBoolean()
  requireUpper!: boolean;

  @IsBoolean()
  requireDigit!: boolean;

  @IsBoolean()
  requireSymbol!: boolean;

  @IsBoolean()
  checkBreached!: boolean;
}
