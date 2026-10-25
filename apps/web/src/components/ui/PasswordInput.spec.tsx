// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import i18n from '../../i18n';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('toggles visibility with the eye control', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PasswordInput aria-label="Secret" />
      </I18nextProvider>
    );
    const field = screen.getByLabelText('Secret');
    const wrap = field.closest('.password-input-wrap');
    expect(wrap).toBeTruthy();
    expect(field.getAttribute('type')).toBe('password');
    fireEvent.click(
      within(wrap as HTMLElement).getByRole('button', {
        name: /show password|passwort anzeigen/i,
      })
    );
    expect(field.getAttribute('type')).toBe('text');
  });
});
