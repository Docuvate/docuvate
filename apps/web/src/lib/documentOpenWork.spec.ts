// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { summarizeDocumentOpenWork } from './documentOpenWork';

describe('summarizeDocumentOpenWork', () => {
  it('counts open fields and labels together and reports done at zero', () => {
    const inbox = { id: 'inbox', name: 'Inbox', isInbox: true };
    const inv = { id: 'inv', name: 'Invoice', isInbox: false };
    const before = summarizeDocumentOpenWork(
      {
        tags: [inbox],
        tagSuggestions: [{ tag: inv, reason: 'rule', confidence: 0.9 }],
      },
      [
        { key: 'betrag', value: '12,50', confidence: 0.5 },
        { key: 'datum', value: '01.02.2024', confidence: 0.4 },
        { key: 'absender', value: 'Acme', confidence: 0.9, userConfirmed: true },
      ],
      [{ key: 'iban', value: 'DE89', confidence: 0.6 }]
    );
    expect(before).toEqual({
      openLabels: 1,
      openFields: 3,
      openTotal: 4,
      isDone: false,
    });

    const after = summarizeDocumentOpenWork(
      {
        tags: [inbox, inv],
        tagSuggestions: [{ tag: inv, reason: 'rule', confidence: 0.9 }],
      },
      [
        { key: 'betrag', value: '12,50', confidence: 0.5, userConfirmed: true },
        { key: 'datum', value: '01.02.2024', confidence: 0.4, userConfirmed: true },
        { key: 'absender', value: 'Acme', confidence: 0.9, userConfirmed: true },
        { key: 'iban', value: 'DE89', confidence: 0.6, userConfirmed: true },
      ],
      []
    );
    expect(after).toEqual({
      openLabels: 0,
      openFields: 0,
      openTotal: 0,
      isDone: true,
    });
  });
});
