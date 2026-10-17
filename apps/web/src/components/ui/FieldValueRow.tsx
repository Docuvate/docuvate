// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check, Ellipsis } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { Confidence } from './Confidence';
import { IconButton } from './IconButton';
import { SourceChip } from './SourceChip';

export type FieldValueRowState = 'confirmed' | 'suggested' | 'corrected';

export interface FieldValueRowProps {
  fieldName: string;
  value: string;
  state: FieldValueRowState;
  confidencePercent?: number;
  originalValue?: string;
  sourceLabel?: string;
  onConfirm?: () => void;
  onCorrect?: () => void;
}

export function FieldValueRow({
  fieldName,
  value,
  state,
  confidencePercent,
  originalValue,
  sourceLabel,
  onConfirm,
  onCorrect,
}: FieldValueRowProps) {
  const { t } = useTranslation();
  return (
    <article className="field-value-row">
      <div className="field-value-row-head">
        <p className="field-value-row-name">{fieldName}</p>
        {state === 'suggested' && confidencePercent != null ? <Confidence value={confidencePercent} /> : null}
        {state === 'confirmed' ? (
          <span className="field-value-row-confirmed">
            <Check size={14} aria-hidden /> {t('ui.fieldValue.confirmed')}
          </span>
        ) : null}
        {state === 'corrected' && originalValue ? (
          <span className="field-value-row-original">{originalValue}</span>
        ) : null}
      </div>
      <div className="field-value-row-value-line">
        <p className="field-value-row-value">{value}</p>
        {state === 'suggested' ? (
          <>
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
          </>
        ) : (
          <IconButton icon={Ellipsis} label={t('ui.fieldValue.moreActions')} size="sm" />
        )}
      </div>
      {sourceLabel ? <SourceChip kind="page" label={sourceLabel} /> : null}
    </article>
  );
}
