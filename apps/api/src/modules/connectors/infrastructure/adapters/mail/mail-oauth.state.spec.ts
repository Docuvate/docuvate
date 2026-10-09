// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { decodeMailOAuthState, encodeMailOAuthState } from './mail-oauth.state.js';

describe('mail oauth state', () => {
  it('round-trips signed payload', () => {
    const encoded = encodeMailOAuthState({
      pluginId: 'gmail',
      userId: 'user-1',
      displayName: 'Gmail',
      nonce: 'abc',
      codeVerifier: 'verifier-123',
      issuedAtMs: Date.now(),
    });
    const decoded = decodeMailOAuthState(encoded);
    expect(decoded?.userId).toBe('user-1');
    expect(decoded?.pluginId).toBe('gmail');
  });

  it('rejects tampered state', () => {
    const encoded = encodeMailOAuthState({
      pluginId: 'outlook',
      userId: 'user-1',
      displayName: 'Outlook',
      nonce: 'abc',
      codeVerifier: 'verifier-456',
      issuedAtMs: Date.now(),
    });
    const tampered = `${encoded}x`;
    expect(decodeMailOAuthState(tampered)).toBeNull();
  });
});
