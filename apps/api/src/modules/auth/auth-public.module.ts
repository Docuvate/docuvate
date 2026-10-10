// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { VerifyPasswordResetTokenUseCase } from './application/verify-password-reset-token.use-case.js';
import { AuthPublicController } from './presentation/auth-public.controller.js';

@Module({
  controllers: [AuthPublicController],
  providers: [VerifyPasswordResetTokenUseCase],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- NestJS module host
export class AuthPublicModule {}
