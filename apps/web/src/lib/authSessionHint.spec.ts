// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearAuthenticatedSessionHint,
  hadAuthenticatedSessionHint,
  markAuthenticatedSessionHint,
} from './authSessionHint';

describe('authSessionHint', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    const localStorageMock = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        Reflect.deleteProperty(store, key);
      },
    };
    vi.stubGlobal('window', { localStorage: localStorageMock });
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    clearAuthenticatedSessionHint();
    vi.unstubAllGlobals();
  });

  it('returns false when no hint was stored (httpOnly cookie scenario)', () => {
    vi.stubGlobal('document', { cookie: 'better-auth.session_token=secret' });
    expect(hadAuthenticatedSessionHint()).toBe(false);
  });

  it('tracks hint in localStorage independently of cookies', () => {
    vi.stubGlobal('document', { cookie: '' });
    markAuthenticatedSessionHint();
    expect(hadAuthenticatedSessionHint()).toBe(true);
    clearAuthenticatedSessionHint();
    expect(hadAuthenticatedSessionHint()).toBe(false);
  });
});
