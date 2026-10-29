// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';
import { Combobox, type ComboboxOption } from '../ui/Combobox';
import type { DocumentSelectionDraft } from './DocumentSelectionLayer';

interface DocumentFieldContextBarProps {
  draft: DocumentSelectionDraft;
  fieldOptions: ComboboxOption[];
  onCreate: (fieldKey: string) => void;
  onMarkTable?: () => void;
  onMarkBlock?: () => void;
  onCancel: () => void;
}

export function DocumentFieldContextBar({
  draft,
  fieldOptions,
  onCreate,
  onMarkTable,
  onMarkBlock,
  onCancel,
}: DocumentFieldContextBarProps) {
  const { t } = useTranslation();
  const [fieldKey, setFieldKey] = useState(fieldOptions[0]?.value ?? 'global:nachzahlung');
  const options = useMemo(() => fieldOptions, [fieldOptions]);

  return (
    <div className="document-field-context-bar" data-testid="field-context-bar" role="dialog">
      <p className="document-field-context-bar-text" title={draft.text}>
        {draft.text || t('documents.selectionEmptyValue')}
      </p>
      <p className="muted document-field-context-bar-meta">
        {t('documents.selectionTokenCount', { count: draft.tokens.length })}
      </p>
      <Combobox
        value={fieldKey}
        options={options}
        aria-label={t('documents.selectionFieldKeyAria')}
        placeholder={t('documents.selectionFieldKeyPlaceholder')}
        createOptionLabel={(name) => t('documents.selectionFieldCreateOption', { name })}
        onCreateOption={(name) => {
          setFieldKey(name);
          onCreate(name);
        }}
        onChange={setFieldKey}
      />
      <div className="document-field-context-bar-actions">
        <Button
          type="button"
          variant="primary"
          disabled={!fieldKey.trim()}
          onClick={() => { onCreate(fieldKey); }}
        >
          {t('documents.selectionAccept')}
        </Button>
        {onMarkTable ? (
          <Button type="button" variant="secondary" onClick={onMarkTable}>
            {t('documents.selectionMarkTable')}
          </Button>
        ) : null}
        {onMarkBlock ? (
          <Button type="button" variant="secondary" onClick={onMarkBlock}>
            {t('documents.selectionMarkBlock')}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
