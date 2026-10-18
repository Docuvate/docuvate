// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Controller, Get, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { Public } from '../../../shared/infrastructure/auth/public.decorator.js';
import { PasswordPolicyResponseDto } from '../../../shared/presentation/dtos/password-policy.dto.js';
import { ApiDocuvatePublicRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';
import { GetPasswordPolicyUseCase } from '../application/get-password-policy.use-case.js';
import { VerifyPasswordResetTokenUseCase } from '../application/verify-password-reset-token.use-case.js';
import {
  VerifyPasswordResetTokenQueryDto,
  VerifyPasswordResetTokenResponseDto,
} from './dtos/verify-password-reset-token.dto.js';

@Controller('auth')
export class AuthPublicController {
  constructor(private readonly getPasswordPolicy: GetPasswordPolicyUseCase) {}

  @Public()
  @Get('password-policy')
  @ApiDocuvatePublicRoute({
    operationId: 'getPasswordPolicy',
    summary: 'Active password rules for sign-up and reset flows',
  })
  async passwordPolicy(): Promise<PasswordPolicyResponseDto> {
    return this.getPasswordPolicy.execute();
  }
}

/** Browser-only; excluded from public OpenAPI (see `public-openapi-paths.ts`). */
@ApiExcludeController()
@Controller('auth/password-reset')
export class AuthPasswordResetPublicController {
  constructor(private readonly verifyToken: VerifyPasswordResetTokenUseCase) {}

  @Public()
  @Get('verify')
  @ApiDocuvatePublicRoute({
    operationId: 'verifyPasswordResetToken',
    summary: 'Check whether a password reset token is still valid (does not consume the token)',
  })
  async verify(
    @Query() query: VerifyPasswordResetTokenQueryDto
  ): Promise<VerifyPasswordResetTokenResponseDto> {
    return this.verifyToken.execute(query.token);
  }
}
