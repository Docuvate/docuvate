// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
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
  onConfirm?: () => void;
  onCorrect?: () => void;
  onValueChange?: (value: string) => void;
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
  onValueChange,
  onSourceClick,
}: DocumentFieldCorrectionSheetProps) {
  const { t } = useTranslation();
  const trimmed = value.trim();
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('documents.fieldCorrectionSheetTitle', { name: fieldName })}
      testId="field-correction-sheet"
    >
      {trimmed.length === 0 ? (
        <p className="document-field-correction-empty">{t('documents.fieldRegionEmptyHint')}</p>
      ) : null}
      {onValueChange ? (
        <label className="document-field-correction-value">
          <span className="document-field-correction-value-label">
            {t('documents.fieldValueInputLabel')}
          </span>
          <Input
            value={value}
            aria-label={t('documents.fieldValueInputAria', { name: fieldName })}
            onChange={(event) => { onValueChange(event.target.value); }}
          />
        </label>
      ) : (
        <p className="document-field-correction-value-text">{trimmed || t('documents.fieldRegionEmptyHint')}</p>
      )}
      {sourceLabel ? (
        <div className="document-field-correction-source">
          <SourceChip kind="page" label={sourceLabel} onClick={onSourceClick} />
        </div>
      ) : null}
      <div className="document-field-correction-actions">
        {onConfirm ? (
          <Button type="button" size="sm" variant="primary" onClick={onConfirm}>
            {t('common.confirm')}
          </Button>
        ) : null}
        {onCorrect ? (
          <Button type="button" size="sm" variant="secondary" onClick={onCorrect}>
            {t('ui.fieldValue.correct')}
          </Button>
        ) : null}
      </div>
    </BottomSheet>
  );
}
