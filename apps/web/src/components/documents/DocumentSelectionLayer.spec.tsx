// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DocumentSelectionLayer } from './DocumentSelectionLayer';

function pageHost(): { host: HTMLDivElement; wrap: HTMLDivElement; word: HTMLSpanElement } {
  const host = document.createElement('div');
  host.className = 'pdf-pages';
  const wrap = document.createElement('div');
  wrap.className = 'pdf-page-wrap';
  wrap.dataset.page = '1';
  const word = document.createElement('span');
  word.textContent = 'INVOICE';
  wrap.appendChild(word);
  host.appendChild(wrap);
  document.body.appendChild(host);
  return { host, wrap, word };
}

describe('DocumentSelectionLayer rectangle', () => {
  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
  });

  it('paints the drag on the page wrap and puts it back when that wrap is replaced', async () => {
    const { host, wrap, word } = pageHost();
    render(
      <DocumentSelectionLayer tool="rect" page={1} tokens={[]} onDraftChange={() => undefined} />
    );

    fireEvent.pointerDown(word, { clientX: 10, clientY: 20, bubbles: true });
    fireEvent.pointerMove(document, { clientX: 80, clientY: 70, bubbles: true });

    const painted = document.querySelector('[data-testid="document-selection-rect"]');
    expect(painted).not.toBeNull();
    expect(wrap.contains(painted)).toBe(true);

    const next = document.createElement('div');
    next.className = 'pdf-page-wrap';
    next.dataset.page = '1';
    host.replaceChildren(next);

    await waitFor(() => {
      const mark = document.querySelector('[data-testid="document-selection-rect"]');
      expect(next.contains(mark)).toBe(true);
    });
  });
});
