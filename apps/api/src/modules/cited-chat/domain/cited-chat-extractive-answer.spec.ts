// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { tryExtractiveCitedAnswer } from './cited-chat-extractive-answer.js';

describe('tryExtractiveCitedAnswer', () => {
  it('returns a sentence from the top chunk when score is high enough', () => {
    const chunk = {
      chunkId: '00000000-0000-4000-8000-000000000001',
      documentId: '00000000-0000-4000-8000-000000000002',
      documentTitle: 'Policy',
      body: 'Jahresbeitrag 486,20 EUR. Zahlbar bis 31.12.',
      page: 1,
      charStart: 0,
      charEnd: 40,
      fusionScore: 1,
    };
    const result = tryExtractiveCitedAnswer(
      'Wie hoch ist der Beitrag?',
      [{ chunk, score: 0.5 }],
      0.2
    );
    expect(result?.text).toContain('486,20');
  });
});
