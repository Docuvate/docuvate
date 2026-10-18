// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { invalidateRuntimePasswordPolicyCache } from '../infrastructure/password-policy-runtime.js';
import { PasswordPolicyService } from './password-policy.service.js';

@Injectable()
export class UpdatePasswordPolicyUseCase {
  constructor(private readonly passwordPolicy: PasswordPolicyService) {}

  execute(patch: PasswordPolicyDto): Promise<PasswordPolicyDto> {
    invalidateRuntimePasswordPolicyCache();
    return this.passwordPolicy.updatePolicy(patch);
  }
}
