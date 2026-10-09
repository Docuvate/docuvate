// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_RESET_TOKEN_MAX_LENGTH } from '../../domain/password-reset-token.constants.js';

export class VerifyPasswordResetTokenQueryDto {
  @ApiProperty({ description: 'Password reset token from the email link' })
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_RESET_TOKEN_MAX_LENGTH)
  token!: string;
}

export class VerifyPasswordResetTokenResponseDto {
  @ApiProperty()
  valid!: boolean;
}
