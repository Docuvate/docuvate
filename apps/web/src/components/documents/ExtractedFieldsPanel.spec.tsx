// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('routes Correct into the Strukturieren workbench when requested', () => {
    const onRequestCorrectField = vi.fn();
    const { container } = render(
      <ExtractedFieldsPanel
        fields={[{ key: 'datum', value: '01.01.2026', userConfirmed: true }]}
        baselineFields={[{ key: 'datum', value: '01.01.2026', userConfirmed: true }]}
        saving={false}
        fieldsDirty={false}
        onFieldsChange={() => undefined}
        onSave={() => undefined}
        onRequestCorrectField={onRequestCorrectField}
      />
    );
    const cards = container.querySelector('.document-field-value-cards');
    expect(cards).toBeTruthy();
    if (!(cards instanceof HTMLElement)) {
      throw new Error('expected field value cards');
    }
    fireEvent.click(within(cards).getByRole('button', { name: 'ui.fieldValue.correct' }));
    expect(onRequestCorrectField).toHaveBeenCalledTimes(1);
    expect(onRequestCorrectField.mock.calls[0]?.[0]).toMatchObject({
      key: 'datum',
      value: '01.01.2026',
    });
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
