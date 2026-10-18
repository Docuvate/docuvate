// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  decryptOidcClientSecret,
  encryptOidcClientSecret,
} from './oidc-client-secret.codec.js';

describe('oidc-client-secret.codec', () => {
  it('round-trips client secrets', () => {
    const secret = 'super-secret-client-value';
    const blob = encryptOidcClientSecret(secret);
    expect(blob.length).toBeGreaterThan(16);
    expect(decryptOidcClientSecret(blob)).toBe(secret);
  });
});
