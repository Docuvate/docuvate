// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomBytes } from 'node:crypto';

import { afterEach, describe, expect, it } from 'vitest';

import {
  assertBetterAuthSecretForRuntime,
  isForbiddenBetterAuthSecret,
} from './better-auth-secret.js';

describe('better-auth secret policy', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.BETTER_AUTH_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSecret === undefined) {
      delete process.env.BETTER_AUTH_SECRET;
    } else {
      process.env.BETTER_AUTH_SECRET = originalSecret;
    }
  });

  it('fails in production when secret is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BETTER_AUTH_SECRET;
    expect(() => { assertBetterAuthSecretForRuntime(); }).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('fails in production when secret is too short', () => {
    process.env.NODE_ENV = 'production';
    process.env.BETTER_AUTH_SECRET = 'short';
    expect(() => { assertBetterAuthSecretForRuntime(); }).toThrow(/32/);
  });

  it('allows development without secret', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.BETTER_AUTH_SECRET;
    expect(() => { assertBetterAuthSecretForRuntime(); }).not.toThrow();
  });

  const documentedPlaceholders = [
    'local-dev-better-auth-secret-min-32-chars!!',
    'local-dev-secret-change-me-32chars!!',
    'your-secret-key-at-least-32-chars-long',
    'change-me-local-compose-secret-32chars',
    'REPLACE_WITH_32_CHAR_MINIMUM_SECRET',
    'dev-secret-change-me-32chars-minimum!!',
  ];

  it.each(documentedPlaceholders)('rejects documented placeholder %s in production', (secret) => {
    process.env.NODE_ENV = 'production';
    process.env.BETTER_AUTH_SECRET = secret;
    expect(() => { assertBetterAuthSecretForRuntime(); }).toThrow(/placeholder/i);
    expect(isForbiddenBetterAuthSecret(secret)).toBe(true);
  });

  it('accepts a random production secret', () => {
    const secret = randomBytes(32).toString('hex');
    process.env.NODE_ENV = 'production';
    process.env.BETTER_AUTH_SECRET = secret;
    expect(isForbiddenBetterAuthSecret(secret)).toBe(false);
    expect(() => { assertBetterAuthSecretForRuntime(); }).not.toThrow();
  });
});
