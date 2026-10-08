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
export class AuthInvitationsModule {}
