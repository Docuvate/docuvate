// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import i18n from '../i18n';
import { settingsChatStatusMessage, settingsChatStatusPresentation } from './settingsChatStatus';

const tEn = i18n.getFixedT('en');

describe('settingsChatStatusMessage', () => {
  it('returns ready without provider label', () => {
    expect(
      settingsChatStatusMessage(tEn, {
        customerChatProvider: 'rag-ollama',
        documentChatReadiness: 'ready',
        documentChatReadinessReason: null,
      })
    ).toBe('Document chat is ready.');
  });

  it('uses info variant when chat is not ready', () => {
    expect(
      settingsChatStatusPresentation(tEn, {
        customerChatProvider: 'rag-ollama',
        documentChatReadiness: 'unavailable',
        documentChatReadinessReason: 'model_loading',
      })
    ).toEqual({
      variant: 'info',
      message: 'Document chat is starting. The language model is still loading.',
    });
  });

  it('uses success variant when chat is ready', () => {
    expect(
      settingsChatStatusPresentation(tEn, {
        customerChatProvider: 'rag-ollama',
        documentChatReadiness: 'ready',
        documentChatReadinessReason: null,
      }).variant
    ).toBe('success');
  });

  it('maps unavailable reason codes to customer copy', () => {
    expect(
      settingsChatStatusMessage(tEn, {
        customerChatProvider: 'rag-ollama',
        documentChatReadiness: 'unavailable',
        documentChatReadinessReason: 'worker_offline',
      })
    ).toBe('Document chat is temporarily unreachable. Please try again later.');
  });
});
