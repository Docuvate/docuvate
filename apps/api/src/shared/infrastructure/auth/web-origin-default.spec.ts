import { describe, expect, it, afterEach } from 'vitest';

/** Mirrors production default in better-auth.config.ts and main.ts CORS. */
function defaultWebOrigin(): string {
  return process.env['WEB_ORIGIN'] ?? 'http://localhost:5173';
}

describe('WEB_ORIGIN default', () => {
  afterEach(() => {
    delete process.env['WEB_ORIGIN'];
  });

  it('uses a single origin when WEB_ORIGIN is unset', () => {
    delete process.env['WEB_ORIGIN'];
    const origin = defaultWebOrigin();
    expect(origin).toBe('http://localhost:5173');
    expect(origin.includes(',')).toBe(false);
  });
});
