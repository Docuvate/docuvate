// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-EE

import { Injectable } from '@nestjs/common';

/**
 * Validates Enterprise Edition license keys for production use.
 * Community Edition runs with no key: enterprise features stay disabled.
 */
@Injectable()
export class EnterpriseLicenseService {
  private readonly licenseKey = process.env.DOCUVATE_EE_LICENSE_KEY?.trim() ?? '';

  /** True when a non-empty license key is configured (production EE). */
  isEnterpriseEnabled(): boolean {
    return this.licenseKey.length > 0;
  }

  /** Gate for EE-only code paths; CE always receives false. */
  assertFeatureEnabled(featureId: string): boolean {
    if (!this.isEnterpriseEnabled()) {
      return false;
    }
    void featureId;
    return true;
  }
}
