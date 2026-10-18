// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { IdentityProviderPort } from '../../domain/ports.js';

const notConfigured = (): Promise<never> =>
  Promise.reject(new Error('OIDC not configured in MVP'));

export class IdentityProviderStub implements IdentityProviderPort {
  getAuthorizationUrl(): Promise<string> {
    return notConfigured();
  }

  handleCallback(): Promise<never> {
    return notConfigured();
  }

  linkExternalIdentity(): Promise<never> {
    return notConfigured();
  }
}
