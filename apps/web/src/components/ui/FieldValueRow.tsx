// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { Confidence } from './Confidence';
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
  onDismiss?: () => void;
  onSourceClick?: () => void;
  onSelect?: () => void;
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
  onDismiss,
  onSourceClick,
  onSelect,
}: FieldValueRowProps) {
  const { t } = useTranslation();
  const showSuggestedActions = state === 'suggested';
  return (
    <article className="field-value-row">
      {onSelect ? (
        <button
          type="button"
          className="field-value-row-select"
          data-testid="field-value-row-select"
          onClick={onSelect}
        >
          <span className="field-value-row-name" title={fieldName}>
            {fieldName}
          </span>
          <span className="field-value-row-value" title={value}>
            {value}
          </span>
        </button>
      ) : (
        <div className="field-value-row-primary">
          <p className="field-value-row-name" title={fieldName}>
            {fieldName}
          </p>
          <p className="field-value-row-value" title={value}>
            {value}
          </p>
        </div>
      )}
      <div className="field-value-row-meta">
        {state === 'suggested' && confidencePercent != null ? (
          <Confidence value={confidencePercent} />
        ) : null}
        {state === 'confirmed' ? (
          <span className="field-value-row-confirmed">
            <Check size={14} aria-hidden /> {t('ui.fieldValue.confirmed')}
          </span>
        ) : null}
        {state === 'corrected' && originalValue ? (
          <span className="field-value-row-original" title={originalValue}>
            {originalValue}
          </span>
        ) : null}
        {sourceLabel ? (
          <SourceChip
            kind="page"
            label={sourceLabel}
            onClick={(event) => {
              event.stopPropagation();
              onSourceClick?.();
            }}
          />
        ) : null}
      </div>
      {showSuggestedActions || onCorrect || onDismiss ? (
        <div className="field-value-row-actions">
          {showSuggestedActions && onConfirm ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={(event) => {
                event.stopPropagation();
                onConfirm();
              }}
            >
              {t('common.confirm')}
            </Button>
          ) : null}
          {onCorrect ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                onCorrect();
              }}
            >
              {t('ui.fieldValue.correct')}
            </Button>
          ) : null}
          {showSuggestedActions && onDismiss ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onDismiss();
              }}
            >
              {t('documents.layoutSuggestionDismiss')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
