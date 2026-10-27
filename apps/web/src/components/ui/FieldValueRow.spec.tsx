// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cleanup, render, waitFor } from '@testing-library/react';
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

import { FieldValueRow } from './FieldValueRow';

function stubOverflow(scrollWidth: number, clientWidth: number): void {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        return undefined;
      }
      disconnect() {
        return undefined;
      }
    }
  );
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get() {
      return scrollWidth;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return clientWidth;
    },
  });
}

describe('FieldValueRow', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('omits the name tooltip when the label fits', () => {
    stubOverflow(80, 200);

    const { container } = render(
      <FieldValueRow fieldName="nachzahlung" value="120,00" state="confirmed" />
    );
    const name = container.querySelector('.field-value-row-name');
    expect(name?.textContent).toBe('nachzahlung');
    expect(name?.getAttribute('title')).toBeNull();
  });

  it('sets a name tooltip only when the label overflows', async () => {
    stubOverflow(400, 80);

    const { container } = render(
      <FieldValueRow
        fieldName="nachzahlung-mit-sehr-langem-feldnamen"
        value="120,00"
        state="confirmed"
      />
    );
    const name = container.querySelector('.field-value-row-name');
    await waitFor(() => {
      expect(name?.getAttribute('title')).toBe('nachzahlung-mit-sehr-langem-feldnamen');
    });
    expect(container.querySelector('.field-value-row-value')?.textContent).toBe('120,00');
  });
});
