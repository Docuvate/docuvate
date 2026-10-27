// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

import { ExtractedFieldsPanel } from './ExtractedFieldsPanel';

describe('ExtractedFieldsPanel', () => {
  it('renders field rows when the correction sheet is closed', () => {
    const { container } = render(
      <ExtractedFieldsPanel
        fields={[{ key: 'datum', value: '01.01.2026' }]}
        saving={false}
        fieldsDirty={false}
        onFieldsChange={() => undefined}
        onSave={() => undefined}
      />
    );
    expect(container.querySelector('.extracted-fields-section')).toBeTruthy();
    expect(container.querySelectorAll('.field-value-row')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'ui.fieldValue.correct' })).toBeTruthy();
  });

  it('unmounts when the correction sheet replaces it', () => {
    const { container } = render(
      <ExtractedFieldsPanel
        fields={[{ key: 'datum', value: '01.01.2026' }]}
        saving={false}
        fieldsDirty={false}
        onFieldsChange={() => undefined}
        onSave={() => undefined}
        replacedBySheet
      />
    );
    expect(container.querySelector('.extracted-fields-section')).toBeNull();
    expect(container.querySelector('.field-value-row')).toBeNull();
  });
});
