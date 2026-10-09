// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { IdentityProviderPort } from '../../domain/ports.js';

export class IdentityProviderStub implements IdentityProviderPort {
  async getAuthorizationUrl(): Promise<string> {
    throw new Error('OIDC not configured in MVP');
  }

  async handleCallback(): Promise<never> {
    throw new Error('OIDC not configured in MVP');
  }

  async linkExternalIdentity(): Promise<never> {
    throw new Error('OIDC not configured in MVP');
  }
}
