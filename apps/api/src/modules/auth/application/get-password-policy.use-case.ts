// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { PasswordPolicyService } from './password-policy.service.js';

@Injectable()
export class GetPasswordPolicyUseCase {
  constructor(private readonly passwordPolicy: PasswordPolicyService) {}

  execute(): Promise<PasswordPolicyDto> {
    return this.passwordPolicy.getPolicy();
  }
}
