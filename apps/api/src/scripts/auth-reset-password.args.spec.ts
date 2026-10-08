import { describe, expect, it } from 'vitest';
import { parseAuthResetPasswordArgs } from './auth-reset-password.args.js';

describe('parseAuthResetPasswordArgs', () => {
  it('parses email', () => {
    expect(parseAuthResetPasswordArgs(['user@example.com'])).toEqual({
      email: 'user@example.com',
      revokeSessions: false,
    });
  });

  it('parses revoke flag', () => {
    expect(parseAuthResetPasswordArgs(['user@example.com', '--revoke-sessions'])).toEqual({
      email: 'user@example.com',
      revokeSessions: true,
    });
  });

  it('rejects unknown flags', () => {
    expect(() => parseAuthResetPasswordArgs(['--nope'])).toThrow(/Unknown option/);
  });
});
