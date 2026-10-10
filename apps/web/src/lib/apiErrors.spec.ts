// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../i18n';
import {
  ApiRequestError,
  formatUserFacingError,
  looksLikeI18nKey,
  toUserFacingChatGenerationError,
  toUserFacingError,
} from './apiErrors';

describe('looksLikeI18nKey', () => {
  it('accepts dotted keys', () => {
    expect(looksLikeI18nKey('connectors.errors.oauthNotConfigured')).toBe(true);
    expect(looksLikeI18nKey('errors.loadFailed')).toBe(true);
  });

  it('rejects plain sentences', () => {
    expect(looksLikeI18nKey('Document not found')).toBe(false);
    expect(looksLikeI18nKey('')).toBe(false);
  });
});

describe('toUserFacingError', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('translates API message i18n keys directly', () => {
    const facing = toUserFacingError(
      new ApiRequestError(422, 'VALIDATION_ERROR', 'connectors.errors.displayNameRequired'),
      'errors.saveFailed'
    );
    expect(facing.i18nKey).toBe('connectors.errors.displayNameRequired');
    expect(facing.retryable).toBe(false);
  });

  it('maps NOT_FOUND by code', () => {
    const facing = toUserFacingError(
      new ApiRequestError(404, 'NOT_FOUND', 'Document not found'),
      'errors.loadFailed'
    );
    expect(facing.i18nKey).toBe('errors.notFound');
  });

  it('maps HTTP 429 as retryable', () => {
    const facing = toUserFacingError(
      new ApiRequestError(429, undefined, 'Too Many Requests'),
      'errors.actionFailed'
    );
    expect(facing.i18nKey).toBe('errors.tooManyRequests');
    expect(facing.retryable).toBe(true);
  });

  it('maps network failures', () => {
    const facing = toUserFacingError(new TypeError('Failed to fetch'), 'errors.loadFailed');
    expect(facing.i18nKey).toBe('errors.networkError');
    expect(facing.retryable).toBe(true);
  });

  it('uses fallback for unknown English messages', () => {
    const facing = toUserFacingError(
      new ApiRequestError(400, 'VALIDATION_ERROR', 'No file uploaded'),
      'errors.saveFailed'
    );
    expect(facing.i18nKey).toBe('errors.validation');
  });

  it('uses context fallback when nothing matches', () => {
    const facing = toUserFacingError(new Error('mystery'), 'errors.settingsLoadFailed');
    expect(facing.i18nKey).toBe('errors.settingsLoadFailed');
  });
});

describe('toUserFacingChatGenerationError', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('maps ollama_error', () => {
    const facing = toUserFacingChatGenerationError('ollama_error');
    expect(facing.i18nKey).toBe('documents.documentChat.errorOllama');
    expect(facing.retryable).toBe(true);
  });

  it('marks cancelled as not retryable', () => {
    const facing = toUserFacingChatGenerationError('cancelled');
    expect(facing.retryable).toBe(false);
  });
});

describe('formatUserFacingError', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('returns localized string', () => {
    const text = formatUserFacingError(
      new ApiRequestError(401, 'FORBIDDEN', 'Forbidden'),
      'errors.loadFailed'
    );
    expect(text).toBe('Sie haben keine Berechtigung für diese Aktion.');
  });
});
