import { Module } from '@nestjs/common';
import { VerifyPasswordResetTokenUseCase } from './application/verify-password-reset-token.use-case.js';
import { AuthPublicController } from './presentation/auth-public.controller.js';

@Module({
  controllers: [AuthPublicController],
  providers: [VerifyPasswordResetTokenUseCase],
})
export class AuthPublicModule {}
