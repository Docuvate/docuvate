// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from './FormField';
import { Input } from './Input';

describe('FormField', () => {
  it('keeps a fixed hint slot when help is hidden', () => {
    render(
      <FormField label="Server-URL" showHelp={false}>
        <Input id="server-url" defaultValue="" />
      </FormField>
    );
    const hint = document.querySelector('.form-field-hint');
    expect(hint?.textContent).toBe('\u00a0');
  });

  it('shows error text in the hint slot', () => {
    render(
      <FormField label="Passwort" error="E-Mail oder Passwort ist falsch.">
        <Input id="password" type="password" />
      </FormField>
    );
    expect(screen.getByRole('alert').textContent).toContain('E-Mail oder Passwort ist falsch.');
  });
});
