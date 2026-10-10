// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Controller, Get, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { Public } from '../../../shared/infrastructure/auth/public.decorator.js';
import { ApiDocuvatePublicRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';
import { VerifyPasswordResetTokenUseCase } from '../application/verify-password-reset-token.use-case.js';
import {
  VerifyPasswordResetTokenQueryDto,
  VerifyPasswordResetTokenResponseDto,
} from './dtos/verify-password-reset-token.dto.js';

/** Browser-only; excluded from public OpenAPI (see `public-openapi-paths.ts`). */
@ApiExcludeController()
@Controller('auth/password-reset')
export class AuthPublicController {
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
