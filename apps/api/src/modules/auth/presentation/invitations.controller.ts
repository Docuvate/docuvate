// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AcceptUserInvitationRequestDto } from '../../../shared/presentation/dtos/invitations.dto.js';
import { AcceptUserInvitationUseCase } from '../application/accept-user-invitation.use-case.js';
import { InvitationAcceptRateLimitGuard } from '../infrastructure/invitation-accept-rate-limit.guard.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';

@ApiDocuvateController('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly acceptInvitation: AcceptUserInvitationUseCase) {}

  @Post('accept')
  @UseGuards(InvitationAcceptRateLimitGuard)
  @ApiDocuvateRoute({
    operationId: 'acceptUserInvitation',
    summary: 'Accept invitation and set password',
  })
  async accept(@Body() body: AcceptUserInvitationRequestDto): Promise<{ ok: true }> {
    await this.acceptInvitation.execute({ token: body.token, password: body.password });
    return { ok: true };
  }
}
