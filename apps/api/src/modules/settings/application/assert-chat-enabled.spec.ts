// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { ConflictError } from '../../../shared/domain/errors.js';
import { assertChatEnabled } from './assert-chat-enabled.js';

describe('assertChatEnabled', () => {
  it('throws ConflictError when chat is off', () => {
    expect(() => { assertChatEnabled('off'); }).toThrow(ConflictError);
  });

  it('allows rag-ollama', () => {
    expect(() => { assertChatEnabled('rag-ollama'); }).not.toThrow();
  });
});
