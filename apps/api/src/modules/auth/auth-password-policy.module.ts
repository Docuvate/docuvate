// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { GetPasswordPolicyUseCase } from './application/get-password-policy.use-case.js';
import { PasswordPolicyService } from './application/password-policy.service.js';
import { UpdatePasswordPolicyUseCase } from './application/update-password-policy.use-case.js';
import { PgInstallationPasswordPolicyRepository } from './infrastructure/pg-installation-password-policy.repository.js';

@Module({
  providers: [
    PgInstallationPasswordPolicyRepository,
    PasswordPolicyService,
    GetPasswordPolicyUseCase,
    UpdatePasswordPolicyUseCase,
  ],
  exports: [
    PasswordPolicyService,
    GetPasswordPolicyUseCase,
    UpdatePasswordPolicyUseCase,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class AuthPasswordPolicyModule {}
