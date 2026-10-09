// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-EE

import { afterEach, describe, expect, it } from 'vitest';
import { EnterpriseLicenseService } from './enterprise-license.service.js';

describe('EnterpriseLicenseService', () => {
  const original = process.env.DOCUVATE_EE_LICENSE_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.DOCUVATE_EE_LICENSE_KEY;
    } else {
      process.env.DOCUVATE_EE_LICENSE_KEY = original;
    }
  });

  it('is disabled without a license key', () => {
    delete process.env.DOCUVATE_EE_LICENSE_KEY;
    const service = new EnterpriseLicenseService();
    expect(service.isEnterpriseEnabled()).toBe(false);
    expect(service.assertFeatureEnabled('sso')).toBe(false);
  });

  it('is enabled when DOCUVATE_EE_LICENSE_KEY is set', () => {
    process.env.DOCUVATE_EE_LICENSE_KEY = 'test-key';
    const service = new EnterpriseLicenseService();
    expect(service.isEnterpriseEnabled()).toBe(true);
    expect(service.assertFeatureEnabled('sso')).toBe(true);
  });
});
