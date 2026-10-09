// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';
import { AuthModule } from '../../shared/infrastructure/auth/auth.module.js';
import { USER_ADMINISTRATION_PORT } from './domain/user-administration.port.js';
import { PgUserInvitationRepository } from './infrastructure/pg-user-invitation.repository.js';
import { USER_INVITATION_REPOSITORY } from './domain/user-invitation.types.js';
import { PgUserAdministrationAdapter } from './infrastructure/pg-user-administration.adapter.js';
import {
  BanAdminUserUseCase,
  GetAdminAccessUseCase,
  InviteAdminUserUseCase,
  ListAdminUsersUseCase,
  RevokeAdminUserSessionsUseCase,
  ResendAdminUserInvitationUseCase,
  RevokeAdminUserInvitationUseCase,
  SetAdminUserRoleUseCase,
  UnbanAdminUserUseCase,
} from './application/admin.use-cases.js';
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
export class AdminModule {}
