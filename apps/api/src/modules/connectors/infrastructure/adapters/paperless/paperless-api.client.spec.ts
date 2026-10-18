// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { paperlessAuthHeaders } from './paperless-api.client.js';

describe('paperlessAuthHeaders', () => {
  it('uses token auth when api_token is set', () => {
    expect(
      paperlessAuthHeaders({
        base_url: 'https://paperless.example.com',
        api_token: 'secret',
      }).Authorization
    ).toBe('Token secret');
  });

  it('uses basic auth when username and password are set', () => {
    const headers = paperlessAuthHeaders({
      base_url: 'https://paperless.example.com',
      username: 'user',
      password: 'pass',
    });
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from('user:pass', 'utf8').toString('base64')}`
    );
  });
});
