// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useElementOverflowTitle } from '../../lib/useElementOverflowTitle';
import { Button } from './Button';
import { Confidence } from './Confidence';
import { Input } from './Input';
import { SourceChip } from './SourceChip';

/** `missing`: the field is expected for this document but no value was recognized. */
export type FieldValueRowState = 'confirmed' | 'suggested' | 'corrected' | 'missing';

interface FieldValueRowProps {
  fieldName: string;
  value: string;
  state: FieldValueRowState;
  confidencePercent?: number;
  originalValue?: string;
  sourceLabel?: string;
  onConfirm?: () => void;
  /** Starts marking the value on the document (region selection). */
  onCorrect?: () => void;
  /** Saves a typed value. When set, "Korrigieren" opens an inline editor first. */
  onSaveValue?: (value: string) => void;
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
  onSaveValue,
  onDismiss,
  onSourceClick,
  onSelect,
}: FieldValueRowProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const missing = state === 'missing';
  const showSuggestedActions = state === 'suggested';
  const displayValue = missing ? t('ui.fieldValue.missing') : value;
  if (editing && onSaveValue) {
    return (
      <article className="field-value-row field-value-row--editing">
        <FieldValueEditor
          fieldName={fieldName}
          initialValue={missing ? '' : value}
          onSave={(next) => {
            setEditing(false);
            onSaveValue(next);
          }}
          onMarkInDocument={
            onCorrect
              ? () => {
                  setEditing(false);
                  onCorrect();
                }
              : undefined
          }
          onCancel={() => { setEditing(false); }}
        />
      </article>
    );
  }
  return (
    <article className={`field-value-row${missing ? ' field-value-row--missing' : ''}`}>
      {onSelect ? (
        <button
          type="button"
          className="field-value-row-select"
          data-testid="field-value-row-select"
          onClick={onSelect}
        >
          <OverflowText className="field-value-row-name" text={fieldName} />
          <span className="field-value-row-value" title={displayValue}>
            {displayValue}
          </span>
        </button>
      ) : (
        <div className="field-value-row-primary">
          <OverflowText className="field-value-row-name" text={fieldName} />
          <p className="field-value-row-value" title={displayValue}>
            {displayValue}
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
      {missing ? (
        <div className="field-value-row-actions">
          {onSaveValue ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                setEditing(true);
              }}
            >
              {t('ui.fieldValue.enterValue')}
            </Button>
          ) : null}
          {onCorrect ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onCorrect();
              }}
            >
              {t('ui.fieldValue.markInDocument')}
            </Button>
          ) : null}
        </div>
      ) : showSuggestedActions || onCorrect || onSaveValue || onDismiss ? (
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
          {onSaveValue || onCorrect ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                if (onSaveValue) {
                  setEditing(true);
                } else {
                  onCorrect?.();
                }
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

function FieldValueEditor({
  fieldName,
  initialValue,
  onSave,
  onMarkInDocument,
  onCancel,
}: {
  fieldName: string;
  initialValue: string;
  onSave: (value: string) => void;
  onMarkInDocument?: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const { t } = useTranslation();
  const inputId = useId();
  const [draft, setDraft] = useState(initialValue);
  const canSave = draft.trim().length > 0 && draft.trim() !== initialValue.trim();
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && canSave) {
      event.preventDefault();
      onSave(draft.trim());
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  };
  return (
    <div className="field-value-row-editor">
      <label className="field-value-row-name" htmlFor={inputId}>
        {fieldName}
      </label>
      <Input
        id={inputId}
        value={draft}
        ref={inputRef}
        placeholder={t('ui.fieldValue.inputPlaceholder')}
        aria-label={t('ui.fieldValue.inputAria', { name: fieldName })}
        onChange={(event) => { setDraft(event.target.value); }}
        onKeyDown={onKeyDown}
      />
      <div className="field-value-row-actions">
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={!canSave}
          onClick={() => { onSave(draft.trim()); }}
        >
          {t('ui.fieldValue.save')}
        </Button>
        {onMarkInDocument ? (
          <Button type="button" size="sm" variant="secondary" onClick={onMarkInDocument}>
            {t('ui.fieldValue.markInDocument')}
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}

function OverflowText({ className, text }: { className: string; text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const title = useElementOverflowTitle(ref, text);
  return (
    <span ref={ref} className={className} title={title}>
      {text}
    </span>
  );
}
