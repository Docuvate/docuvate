// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';
import { Combobox, type ComboboxOption } from '../ui/Combobox';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { DocumentSelectionDraft } from './DocumentSelectionLayer';

interface DocumentFieldContextBarProps {
  draft: DocumentSelectionDraft;
  fieldOptions: ComboboxOption[];
  /** Current values already stored on the document, keyed by field key. */
  existingFieldValues: ReadonlyMap<string, string>;
  onConfirm: (fieldKey: string) => void;
  onMarkTable?: () => void;
  onCancel: () => void;
}

function optionValues(options: ComboboxOption[]): Set<string> {
  return new Set(options.map((option) => option.value));
}

function labelForFieldKey(fieldKey: string, options: ComboboxOption[]): string {
  return options.find((option) => option.value === fieldKey)?.label ?? fieldKey;
}

export function DocumentFieldContextBar({
  draft,
  fieldOptions,
  existingFieldValues,
  onConfirm,
  onMarkTable,
  onCancel,
}: DocumentFieldContextBarProps) {
  const { t } = useTranslation();
  const options = useMemo(() => fieldOptions, [fieldOptions]);
  const existingKeys = useMemo(() => optionValues(options), [options]);
  const [fieldKey, setFieldKey] = useState(() => (options.length === 1 ? options[0].value : ''));
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const [pendingFieldKey, setPendingFieldKey] = useState<string | null>(null);

  const trimmedKey = fieldKey.trim();
  const assignsExisting = trimmedKey.length > 0 && existingKeys.has(trimmedKey);
  const acceptLabel = assignsExisting
    ? t('documents.selectionAssign')
    : t('documents.selectionAccept');

  function commit(targetKey: string) {
    onConfirm(targetKey);
    setOverwriteOpen(false);
    setPendingFieldKey(null);
  }

  function requestConfirm(targetKey: string) {
    const normalized = targetKey.trim();
    if (normalized.length === 0) {
      return;
    }
    const currentValue = existingFieldValues.get(normalized)?.trim() ?? '';
    const nextValue = draft.text.trim();
    const wouldOverwrite =
      existingKeys.has(normalized) &&
      currentValue.length > 0 &&
      nextValue.length > 0 &&
      currentValue !== nextValue;
    if (wouldOverwrite) {
      setPendingFieldKey(normalized);
      setOverwriteOpen(true);
      return;
    }
    commit(normalized);
  }

  const overwriteKey = pendingFieldKey ?? trimmedKey;
  const overwriteCurrent = existingFieldValues.get(overwriteKey) ?? '';

  return (
    <div
      className="document-field-context-bar"
      data-testid="field-context-bar"
      role="region"
      aria-label={t('documents.selectionFieldKeyAria')}
    >
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
          requestConfirm(name);
        }}
        onChange={setFieldKey}
      />
      <div className="document-field-context-bar-actions">
        <Button
          type="button"
          variant="primary"
          disabled={!trimmedKey}
          data-testid="field-context-bar-accept"
          onClick={() => {
            requestConfirm(trimmedKey);
          }}
        >
          {acceptLabel}
        </Button>
        {onMarkTable ? (
          <Button type="button" variant="secondary" onClick={onMarkTable}>
            {t('documents.selectionMarkTable')}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
      <ConfirmDialog
        open={overwriteOpen}
        title={t('documents.selectionOverwriteTitle')}
        description={t('documents.selectionOverwriteDesc', {
          name: labelForFieldKey(overwriteKey, options),
          current: overwriteCurrent,
          next: draft.text,
        })}
        confirmLabel={t('documents.selectionOverwriteConfirm')}
        tone="danger"
        onCancel={() => {
          setOverwriteOpen(false);
          setPendingFieldKey(null);
        }}
        onConfirm={() => {
          if (pendingFieldKey) {
            commit(pendingFieldKey);
          }
        }}
      />
    </div>
  );
}
