// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { aspectNeedsWork, openAspectItems, structuringAspects } from './structuringAspects';

type AspectDoc = Parameters<typeof structuringAspects>[0];

const inbox: TagDto = { id: 'inbox', name: 'Posteingang', isInbox: true };
const invoice: TagDto = { id: 'invoice', name: 'Rechnung', isInbox: false };

function doc(patch: Partial<AspectDoc> = {}): AspectDoc {
  return {
    status: 'ready',
    tags: [invoice],
    tagSuggestions: [],
    layoutIrAvailable: true,
    extraction: { text: 'Beispiel', fields: [], blocks: [], layoutIrAvailable: true },
    ...patch,
  };
}

function states(d: AspectDoc, evidence?: Parameters<typeof structuringAspects>[1]) {
  return Object.fromEntries(structuringAspects(d, evidence).map((s) => [s.aspect, s.state]));
}

describe('structuringAspects', () => {
  it('reports technical processing per aspect; labels stay workable', () => {
    expect(states(doc({ status: 'queued' }))).toEqual({
      ocr: 'pending',
      labels: 'no_open_items',
      layout: 'pending',
      fields: 'pending',
    });
    expect(states(doc({ status: 'failed', tags: [inbox] }))).toMatchObject({
      ocr: 'failed',
      labels: 'open',
    });
  });

  it('counts open label suggestions and treats inbox or missing labels as open', () => {
    const suggested = structuringAspects(
      doc({ tagSuggestions: [{ tag: { ...invoice, id: 'x' }, confidence: 0.9 }] })
    );
    expect(suggested[1]).toEqual({ aspect: 'labels', state: 'open', open: 1 });
    expect(states(doc({ tags: [inbox] })).labels).toBe('open');
    expect(states(doc({ tags: [] })).labels).toBe('open');
  });

  it('never claims OCR is confirmed and flags empty text', () => {
    expect(states(doc()).ocr).toBe('no_open_items');
    expect(
      states(doc({ extraction: { text: ' ', fields: [], blocks: [], layoutIrAvailable: true } }))
        .ocr
    ).toBe('open');
    expect(states(doc({ extraction: undefined })).ocr).toBe('unknown');
  });

  it('distinguishes missing layout from unknown', () => {
    expect(states(doc({ layoutIrAvailable: false, extraction: undefined })).layout).toBe(
      'unavailable'
    );
    expect(states(doc({ layoutIrAvailable: undefined, extraction: undefined })).layout).toBe(
      'unknown'
    );
  });

  it('fields: open until a person confirmed every value; unknown without evidence', () => {
    expect(states(doc()).fields).toBe('unknown');
    const open = structuringAspects(doc(), {
      fields: [{ value: 'a', userConfirmed: true }, { value: 'b' }],
      suggestions: [{ key: 'iban', value: 'DE00' }],
    });
    expect(open[3]).toEqual({ aspect: 'fields', state: 'open', open: 2 });
    expect(openAspectItems(open)).toBe(2);
    expect(
      states(doc(), { fields: [{ value: 'a', userConfirmed: true }], suggestions: [] }).fields
    ).toBe('confirmed');
    expect(states(doc(), { fields: [], suggestions: [] }).fields).toBe('no_open_items');
  });

  it('excludes a rejected review row from the open count and keeps a different field', () => {
    const open = structuringAspects(doc(), {
      fields: [
        { key: 'vendor', value: 'ACME', userConfirmed: false },
        { key: 'absender', value: 'ACME', userConfirmed: false },
      ],
      suggestions: [],
      rejects: [{ fieldKey: 'global:vendor', valueNormalized: 'acme' }],
    });
    expect(open[3]).toEqual({ aspect: 'fields', state: 'open', open: 1 });
  });

  it('marks failed and open aspects as needing work', () => {
    const statuses = structuringAspects(doc({ status: 'failed', tags: [inbox] }));
    expect(statuses.filter(aspectNeedsWork).map((s) => s.aspect)).toEqual(['ocr', 'labels']);
  });
});
