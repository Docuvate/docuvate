// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BottomSheet } from '../ui/overlay/BottomSheet';
import { SourceChip } from '../ui/SourceChip';

interface DocumentFieldCorrectionSheetProps {
  open: boolean;
  fieldName: string;
  value: string;
  sourceLabel?: string;
  onClose: () => void;
  /** Confirms the recognized value unchanged. Not offered for empty values. */
  onConfirm?: () => void;
  /** Starts marking the value on the document. */
  onCorrect?: () => void;
  /** Saves a typed value (recorded as a correction). */
  onSaveValue?: (value: string) => void;
  onSourceClick?: () => void;
}

export function DocumentFieldCorrectionSheet({
  open,
  fieldName,
  value,
  sourceLabel,
  onClose,
  onConfirm,
  onCorrect,
  onSaveValue,
  onSourceClick,
}: DocumentFieldCorrectionSheetProps) {
  const { t } = useTranslation();
  const trimmed = value.trim();
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value, open]);
  const draftTrimmed = draft.trim();
  const changed = draftTrimmed.length > 0 && draftTrimmed !== trimmed;
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('documents.fieldCorrectionSheetTitle', { name: fieldName })}
      testId="field-correction-sheet"
    >
      {trimmed.length === 0 ? (
        <p className="document-field-correction-empty">{t('ui.fieldValue.missing')}</p>
      ) : null}
      {onSaveValue ? (
        <label className="document-field-correction-value">
          <span className="document-field-correction-value-label">
            {t('documents.fieldValueInputLabel')}
          </span>
          <Input
            value={draft}
            placeholder={t('ui.fieldValue.inputPlaceholder')}
            aria-label={t('documents.fieldValueInputAria', { name: fieldName })}
            onChange={(event) => { setDraft(event.target.value); }}
          />
        </label>
      ) : trimmed.length > 0 ? (
        <p className="document-field-correction-value-text">{trimmed}</p>
      ) : null}
      {sourceLabel ? (
        <div className="document-field-correction-source">
          <SourceChip kind="page" label={sourceLabel} onClick={onSourceClick} />
        </div>
      ) : null}
      <div className="document-field-correction-actions">
        {onSaveValue && changed ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => { onSaveValue(draftTrimmed); }}
          >
            {t('ui.fieldValue.save')}
          </Button>
        ) : onConfirm && trimmed.length > 0 ? (
          <Button type="button" size="sm" variant="primary" onClick={onConfirm}>
            {t('common.confirm')}
          </Button>
        ) : null}
        {onCorrect ? (
          <Button type="button" size="sm" variant="secondary" onClick={onCorrect}>
            {t('ui.fieldValue.markInDocument')}
          </Button>
        ) : null}
      </div>
    </BottomSheet>
  );
}
