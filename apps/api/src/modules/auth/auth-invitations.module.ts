// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { AdminModule } from '../admin/admin.module.js';
import { AcceptUserInvitationUseCase } from './application/accept-user-invitation.use-case.js';
import { InvitationAcceptRateLimitGuard } from './infrastructure/invitation-accept-rate-limit.guard.js';
import { InvitationAcceptRateLimitService } from './infrastructure/invitation-accept-rate-limit.service.js';
import { InvitationsController } from './presentation/invitations.controller.js';

@Module({
  imports: [AdminModule],
  controllers: [InvitationsController],
  providers: [
    AcceptUserInvitationUseCase,
    InvitationAcceptRateLimitService,
    InvitationAcceptRateLimitGuard,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- NestJS module host
export class AuthInvitationsModule {}
