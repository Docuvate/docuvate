// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { PgInstallationPasswordPolicyRepository } from '../infrastructure/pg-installation-password-policy.repository.js';

@Injectable()
export class PasswordPolicyService {
  private cached: PasswordPolicyDto | null = null;

  constructor(private readonly repository: PgInstallationPasswordPolicyRepository) {}

  async getPolicy(): Promise<PasswordPolicyDto> {
    if (this.cached) {
      return this.cached;
    }
    const policy = await this.repository.getPolicy();
    this.cached = policy;
    return policy;
  }

  async updatePolicy(patch: PasswordPolicyDto): Promise<PasswordPolicyDto> {
    const saved = await this.repository.updatePolicy(patch);
    this.cached = saved;
    return saved;
  }

  invalidateCache(): void {
    this.cached = null;
  }
}
