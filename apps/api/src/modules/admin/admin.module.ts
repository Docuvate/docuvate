// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { AuthModule } from '../../shared/infrastructure/auth/auth.module.js';
import {
  BanAdminUserUseCase,
  GetAdminAccessUseCase,
  InviteAdminUserUseCase,
  ListAdminUsersUseCase,
  ResendAdminUserInvitationUseCase,
  RevokeAdminUserInvitationUseCase,
  RevokeAdminUserSessionsUseCase,
  SetAdminUserRoleUseCase,
  UnbanAdminUserUseCase,
} from './application/admin.use-cases.js';
import { USER_ADMINISTRATION_PORT } from './domain/user-administration.port.js';
import { USER_INVITATION_REPOSITORY } from './domain/user-invitation.types.js';
import { PgUserAdministrationAdapter } from './infrastructure/pg-user-administration.adapter.js';
import { PgUserInvitationRepository } from './infrastructure/pg-user-invitation.repository.js';
import { AdminController } from './presentation/admin.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [
    { provide: USER_INVITATION_REPOSITORY, useClass: PgUserInvitationRepository },
    { provide: USER_ADMINISTRATION_PORT, useClass: PgUserAdministrationAdapter },
    GetAdminAccessUseCase,
    ListAdminUsersUseCase,
    InviteAdminUserUseCase,
    SetAdminUserRoleUseCase,
    BanAdminUserUseCase,
    UnbanAdminUserUseCase,
    RevokeAdminUserSessionsUseCase,
    ResendAdminUserInvitationUseCase,
    RevokeAdminUserInvitationUseCase,
  ],
  exports: [USER_INVITATION_REPOSITORY],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class AdminModule {}
