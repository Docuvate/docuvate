// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../i18n';
import { authErrorI18nKeyForCode, formatAuthClientError } from './authErrors';

describe('authErrorI18nKeyForCode', () => {
  it('maps known better-auth codes', () => {
    expect(authErrorI18nKeyForCode('INVALID_EMAIL_OR_PASSWORD')).toBe(
      'auth.errors.invalidEmailOrPassword'
    );
    expect(authErrorI18nKeyForCode('USER_ALREADY_EXISTS')).toBe('auth.errors.userAlreadyExists');
  });

  it('returns undefined for unknown codes', () => {
    expect(authErrorI18nKeyForCode('SOME_NEW_CODE')).toBeUndefined();
  });
});

describe('formatAuthClientError', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('localizes invalid credentials by code', () => {
    const warn = vi.mocked(console.warn);
    const text = formatAuthClientError(
      { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' },
      'signIn'
    );
    expect(text).toBe('E-Mail oder Passwort ist falsch.');
    expect(warn).not.toHaveBeenCalled();
  });

  it('maps HTTP 429 without code', () => {
    const text = formatAuthClientError({ status: 429, message: 'Too Many Requests' }, 'signIn');
    expect(text).toBe('Zu viele Versuche. Bitte kurz warten und erneut versuchen.');
  });

  it('maps server errors by status', () => {
    const text = formatAuthClientError({ status: 503, message: 'Service Unavailable' }, 'signUp');
    expect(text).toBe('Der Server ist gerade nicht erreichbar. Bitte später erneut versuchen.');
  });

  it('uses context fallback for unknown codes', () => {
    const text = formatAuthClientError(
      { code: 'MYSTERY_CODE', message: 'Something broke' },
      'signOut'
    );
    expect(text).toBe('Abmeldung fehlgeschlagen. Bitte erneut versuchen.');
  });

  it('treats TypeError as network error', () => {
    const text = formatAuthClientError(new TypeError('Failed to fetch'), 'signIn');
    expect(text).toBe('Verbindung fehlgeschlagen. Bitte Internet prüfen und erneut versuchen.');
  });
});
