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
        delete store[key];
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
    globalThis.document = { cookie: 'better-auth.session_token=secret' } as Document;
    expect(hadAuthenticatedSessionHint()).toBe(false);
  });

  it('tracks hint in localStorage independently of cookies', () => {
    globalThis.document = { cookie: '' } as Document;
    markAuthenticatedSessionHint();
    expect(hadAuthenticatedSessionHint()).toBe(true);
    clearAuthenticatedSessionHint();
    expect(hadAuthenticatedSessionHint()).toBe(false);
  });
});
