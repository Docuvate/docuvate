// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'de' },
    }),
  };
});

import { Combobox } from './Combobox';

describe('Combobox field options', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens on focus and lists options for selection', () => {
    const onChange = vi.fn();
    render(
      <Combobox
        value=""
        options={[
          { value: 'betrag', label: 'Betrag' },
          { value: 'absender', label: 'Absender' },
        ]}
        aria-label="Field picker"
        onChange={onChange}
      />
    );

    const combobox = screen.getByRole('combobox', { name: 'Field picker' });
    fireEvent.focus(combobox);
    expect(combobox.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('option', { name: 'Betrag' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Absender' })).toBeTruthy();

    fireEvent.click(screen.getByRole('option', { name: 'Absender' }));
    expect(onChange).toHaveBeenCalledWith('absender');
  });

  it('opens with an empty catalog and exposes no options until the user creates one', () => {
    render(
      <Combobox
        value=""
        options={[]}
        aria-label="Field picker"
        createOptionLabel={(name) => `create:${name}`}
        onCreateOption={() => undefined}
        onChange={() => undefined}
      />
    );

    const combobox = screen.getByRole('combobox', { name: 'Field picker' });
    fireEvent.focus(combobox);
    expect(combobox.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByRole('option')).toBeNull();
    expect(screen.getByText('combobox.empty')).toBeTruthy();

    fireEvent.change(combobox, { target: { value: 'Neues Feld' } });
    expect(screen.getByRole('button', { name: 'create:Neues Feld' })).toBeTruthy();
  });
});
