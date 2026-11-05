// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, string | number>) => {
        if (key === 'documents.selectionOverwriteDesc') {
          return `overwrite:${String(options?.name)}:${String(options?.current)}:${String(options?.next)}`;
        }
        if (key === 'documents.selectionTokenCount') {
          return `tokens:${String(options?.count ?? 0)}`;
        }
        if (key === 'documents.selectionFieldCreateOption') {
          return `create:${String(options?.name)}`;
        }
        return key;
      },
      i18n: { language: 'de' },
    }),
  };
});

import { DocumentFieldContextBar } from './DocumentFieldContextBar';
import type { DocumentSelectionDraft } from './DocumentSelectionLayer';

const DRAFT: DocumentSelectionDraft = {
  page: 1,
  rect: { x0: 0.1, y0: 0.2, x1: 0.4, y1: 0.3 },
  tokens: [],
  text: '2.922,47',
};

const OPTIONS = [
  { value: 'betrag', label: 'Betrag' },
  { value: 'absender', label: 'Absender' },
];

function renderBar(args?: {
  existing?: ReadonlyMap<string, string>;
  onConfirm?: (fieldKey: string) => void;
}) {
  const onConfirm = args?.onConfirm ?? vi.fn();
  const onCancel = vi.fn();
  render(
    <DocumentFieldContextBar
      draft={DRAFT}
      fieldOptions={OPTIONS}
      existingFieldValues={
        args?.existing ??
        new Map([
          ['betrag', '1.000,00'],
          ['absender', 'ACME GmbH'],
        ])
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
  return { onConfirm, onCancel };
}

describe('DocumentFieldContextBar assign existing field', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('starts empty and labels the primary action as create until an existing field is chosen', () => {
    renderBar();
    const accept = screen.getByTestId('field-context-bar-accept');
    expect(accept.hasAttribute('disabled')).toBe(true);
    expect(accept.textContent).toBe('documents.selectionAccept');

    const combobox = screen.getByRole('combobox', { name: 'documents.selectionFieldKeyAria' });
    fireEvent.focus(combobox);
    fireEvent.click(screen.getByRole('option', { name: /Absender/ }));

    expect(accept.hasAttribute('disabled')).toBe(false);
    expect(accept.textContent).toBe('documents.selectionAssign');
  });

  it('auto-selects the sole existing field and labels the primary action as assign', () => {
    const onConfirm = vi.fn();
    render(
      <DocumentFieldContextBar
        draft={DRAFT}
        fieldOptions={[{ value: 'e2e_field_regions_assign', label: 'E2E Zuweisen' }]}
        existingFieldValues={new Map()}
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />
    );
    const accept = screen.getByTestId('field-context-bar-accept');
    expect(accept.hasAttribute('disabled')).toBe(false);
    expect(accept.textContent).toBe('documents.selectionAssign');
    fireEvent.click(accept);
    expect(onConfirm).toHaveBeenCalledWith('e2e_field_regions_assign');
  });

  it('assigns the selection to a different existing field without overwrite when that field is empty', () => {
    const { onConfirm } = renderBar({
      existing: new Map([['betrag', '1.000,00']]),
    });

    fireEvent.focus(screen.getByRole('combobox', { name: 'documents.selectionFieldKeyAria' }));
    fireEvent.click(screen.getByRole('option', { name: /Absender/ }));
    fireEvent.click(screen.getByTestId('field-context-bar-accept'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('absender');
    expect(screen.queryByText(/overwrite:/)).toBeNull();
  });

  it('asks for confirmation before overwriting a different value on an existing field', () => {
    const { onConfirm } = renderBar();

    fireEvent.focus(screen.getByRole('combobox', { name: 'documents.selectionFieldKeyAria' }));
    fireEvent.click(screen.getByRole('option', { name: /Betrag/ }));
    fireEvent.click(screen.getByTestId('field-context-bar-accept'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('overwrite:Betrag:1.000,00:2.922,47')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'documents.selectionOverwriteConfirm' }));
    expect(onConfirm).toHaveBeenCalledWith('betrag');
  });

  it('lets the user cancel an overwrite and keep the selection draft', () => {
    const { onConfirm, onCancel } = renderBar();

    fireEvent.focus(screen.getByRole('combobox', { name: 'documents.selectionFieldKeyAria' }));
    fireEvent.click(screen.getByRole('option', { name: /Betrag/ }));
    fireEvent.click(screen.getByTestId('field-context-bar-accept'));

    const dialog = screen.getByRole('dialog', { name: 'documents.selectionOverwriteTitle' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'common.cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByTestId('field-context-bar')).toBeTruthy();
    expect(screen.getByText('2.922,47')).toBeTruthy();
  });
});
