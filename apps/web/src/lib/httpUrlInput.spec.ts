// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { validateHttpUrlInput } from './httpUrlInput';

describe('validateHttpUrlInput', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(validateHttpUrlInput('https://paperless.example.com')).toEqual({
      ok: true,
      href: 'https://paperless.example.com/',
    });
    expect(validateHttpUrlInput('http://homeassistant.local:8123').ok).toBe(true);
  });

  it('rejects empty, relative, and non-http schemes', () => {
    expect(validateHttpUrlInput('')).toEqual({ ok: false, reason: 'empty' });
    expect(validateHttpUrlInput('   ')).toEqual({ ok: false, reason: 'empty' });
    expect(validateHttpUrlInput('paperless.example.com')).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(validateHttpUrlInput('ftp://files.example.com')).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(validateHttpUrlInput('not a url')).toEqual({ ok: false, reason: 'invalid' });
  });
});
