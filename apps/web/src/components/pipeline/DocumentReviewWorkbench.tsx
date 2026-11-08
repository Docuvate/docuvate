// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractedField, FieldSuggestionRow } from '@docuvate/contracts';
import { ArrowLeftRight, ArrowRight, Check, CheckCheck, CircleSlash, Pencil } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { confidenceLevelFromRatio } from '../../lib/confidenceLevel';
import {
  openWorkbenchRowCount,
  safeConfirmKeys,
  type SuggestionRejectRef,
  type WorkbenchRow,
  workbenchRows,
} from '../../lib/reviewWorkbench';
import { ribbonActionClass } from '../../lib/ribbonAction';
import { routes } from '../../lib/routes';
import { type StructuringAspect, structuringAspects } from '../../lib/structuringAspects';
import { DocumentLabelSuggestionChips } from '../documents';
import { AppRibbon, RibbonGroup } from '../layout/AppRibbon';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { StructuringAspectStrip } from './StructuringAspectStrip';

interface FieldTarget {
  key: string;
  label: string;
}

interface DocumentReviewWorkbenchProps {
  doc: DocumentDto;
  fields: readonly ExtractedField[];
  suggestions: readonly FieldSuggestionRow[];
  fieldLabelForKey: (key: string) => string;
  /** Fields a value can be moved to ("value right, field wrong"). */
  fieldTargets: readonly FieldTarget[];
  saving: boolean;
  nextDocumentId: string | null;
  onConfirm: (key: string) => void;
  onConfirmMany: (keys: string[]) => void;
  onSaveValue: (key: string, value: string) => void;
  onAcceptSuggestion: (key: string, value: string) => void;
  /** Durable reject of this field+value for the document (status Verworfen). */
  onRejectSuggestion: (key: string, value: string) => void;
  rejects?: readonly SuggestionRejectRef[];
  onUndoReject?: (correctionId: string) => void;
  onReassign: (fromKey: string, toKey: string) => void;
  /** Show where a value sits in the document (highlight + page jump). */
  onLocate: (value: string) => void;
  /** Start bounding-box correction for the active field. */
  onCorrectPosition?: (fieldKey: string) => void;
  onLabelsUpdated: () => void | Promise<void>;
  /** Jump to the correction mode of OCR, labels or layout. */
  onOpenAspect: (aspect: Exclude<StructuringAspect, 'fields'>) => void;
  /** Focus the first open value when the document opens (arriving from "next document"). */
  autoFocusFirst?: boolean;
}

type RowMode =
  | { key: string; kind: 'edit' | 'reassign' }
  | { key: string; kind: 'overwrite'; toKey: string; current: string }
  | null;

/** Link to a document that opens straight into keyboard review. */
function reviewDocumentHref(documentId: string): string {
  return `${routes.documents}/${documentId}?review=1`;
}

/**
 * Viewer review workbench: every extracted value in one keyboard-driven list, worst first.
 * Accept, correct in place, or move a value to the right field without leaving the document.
 */
export function DocumentReviewWorkbench({
  doc,
  fields,
  suggestions,
  fieldLabelForKey,
  fieldTargets,
  saving,
  nextDocumentId,
  onConfirm,
  onConfirmMany,
  onSaveValue,
  onAcceptSuggestion,
  onRejectSuggestion,
  rejects = [],
  onUndoReject,
  onReassign,
  onLocate,
  onCorrectPosition,
  onLabelsUpdated,
  onOpenAspect,
  autoFocusFirst = false,
}: DocumentReviewWorkbenchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rows = useMemo(
    () => workbenchRows(fields, suggestions, rejects),
    [fields, suggestions, rejects]
  );
  const open = openWorkbenchRowCount(rows);
  const safeKeys = safeConfirmKeys(rows);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<RowMode>(null);
  const [draft, setDraft] = useState('');
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const editRef = useRef<HTMLInputElement>(null);
  const refocus = useRef(false);
  const nextRef = useRef<HTMLAnchorElement>(null);
  const assigned = useMemo(() => new Set(doc.tags.map((tag) => tag.id)), [doc.tags]);
  const labelSuggestions = doc.tagSuggestions ?? [];
  const openLabels = labelSuggestions.filter((item) => !assigned.has(item.tag.id)).length;
  const aspects = structuringAspects(doc, { fields, suggestions, rejects });
  const reviewedPercent =
    rows.length === 0 ? 100 : Math.round(((rows.length - open) / rows.length) * 100);

  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    // Everything reviewed: hand focus to "next document" so Enter keeps the loop going.
    if (open + openLabels === 0 && nextRef.current) {
      nextRef.current.focus();
      return;
    }
    const firstOpen = rows.findIndex((row) => row.state !== 'confirmed');
    const index = Math.min(activeIndex, rows.length - 1);
    const target = rows[index]?.state === 'confirmed' && firstOpen >= 0 ? firstOpen : index;
    setActiveIndex(target);
    rowRefs.current[target]?.focus();
  }, [rows, activeIndex, mode, open, openLabels]);

  useEffect(() => {
    if (!autoFocusFirst) return;
    setActiveIndex(0);
    setMode(null);
    window.requestAnimationFrame(() => {
      rowRefs.current[0]?.focus();
    });
  }, [autoFocusFirst, doc.id]);

  useEffect(() => {
    if (mode?.kind === 'edit') editRef.current?.focus();
  }, [mode]);

  function focusRow(index: number) {
    const next = Math.max(0, Math.min(rows.length - 1, index));
    setActiveIndex(next);
    rowRefs.current[next]?.focus();
  }

  function accept(row: WorkbenchRow, index: number) {
    if (row.state === 'confirmed') {
      focusRow(index + 1);
      return;
    }
    refocus.current = true;
    setActiveIndex(index);
    if (row.state === 'suggested') onAcceptSuggestion(row.key, row.value);
    else onConfirm(row.key);
  }

  function reject(row: WorkbenchRow, index: number) {
    if (row.state === 'confirmed') return;
    refocus.current = true;
    setActiveIndex(index);
    onRejectSuggestion(row.key, row.value);
  }

  function startEdit(row: WorkbenchRow, index: number) {
    setActiveIndex(index);
    setDraft(row.value);
    setMode({ key: row.key, kind: 'edit' });
  }

  function closeMode() {
    refocus.current = true;
    setMode(null);
  }

  function submitEdit(event: FormEvent, row: WorkbenchRow) {
    event.preventDefault();
    const value = draft.trim();
    if (value && value !== row.value) {
      if (row.state === 'suggested') onAcceptSuggestion(row.key, value);
      else onSaveValue(row.key, value);
    }
    closeMode();
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLButtonElement>, row: WorkbenchRow, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    switch (key) {
      case 'ArrowDown':
      case 'j':
        focusRow(index + 1);
        break;
      case 'ArrowUp':
      case 'k':
        focusRow(index - 1);
        break;
      case 'Home':
        focusRow(0);
        break;
      case 'End':
        focusRow(rows.length - 1);
        break;
      case 'Enter':
      case 'a':
        accept(row, index);
        break;
      case 'e':
      case 'F2':
        startEdit(row, index);
        break;
      case 'f':
        setActiveIndex(index);
        setMode({ key: row.key, kind: 'reassign' });
        break;
      case 'x':
        reject(row, index);
        break;
      case 'n':
        if (!nextDocumentId) return;
        navigate(reviewDocumentHref(nextDocumentId));
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  const targetOptions = (row: WorkbenchRow) =>
    fieldTargets
      .filter((target) => target.key !== row.key)
      .map((target) => ({ value: target.key, label: target.label }));

  return (
    <section
      className="review-workbench"
      aria-labelledby="review-workbench-heading"
      data-open-count={open}
    >
      <AppRibbon>
        <RibbonGroup label={t('ribbon.structure')} kind="navigate" order={1}>
          <StructuringAspectStrip
            statuses={aspects}
            className="review-workbench-aspects"
            onOpen={(aspect) => {
              if (aspect !== 'fields') {
                onOpenAspect(aspect);
                return;
              }
              const firstOpen = rows.findIndex((row) => row.state !== 'confirmed');
              focusRow(firstOpen >= 0 ? firstOpen : 0);
            }}
          />
        </RibbonGroup>
        <RibbonGroup label={t('ribbon.review')} kind="act" order={2}>
          <div className="review-workbench-actions">
            <Button
              type="button"
              size="sm"
              variant={safeKeys.length > 0 ? 'primary' : 'secondary'}
              className={`ribbon-action ribbon-action--${safeKeys.length > 0 ? 'primary' : 'secondary'}`}
              disabled={saving || safeKeys.length === 0}
              onClick={() => {
                onConfirmMany(safeKeys);
              }}
            >
              <CheckCheck size={16} strokeWidth={2} aria-hidden />
              {t('pipeline.workbench.acceptSafe', { count: safeKeys.length })}
            </Button>
            {nextDocumentId ? (
              <Link
                ref={nextRef}
                to={reviewDocumentHref(nextDocumentId)}
                className={ribbonActionClass(open + openLabels === 0 ? 'primary' : 'secondary', {
                  className: 'review-workbench-next',
                })}
                aria-keyshortcuts="N"
              >
                {t('pipeline.workbench.next')}
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            ) : (
              <Link to={routes.reviewQueue} className={ribbonActionClass('tertiary')}>
                {t('pipeline.viewer.review.queueAction')}
              </Link>
            )}
          </div>
        </RibbonGroup>
      </AppRibbon>
      <header className="review-workbench-head">
        <div className="review-workbench-title-row">
          <h2 id="review-workbench-heading" className="review-workbench-title">
            {t('pipeline.workbench.title')}
          </h2>
          <span className="review-workbench-count" aria-live="polite">
            {open + openLabels > 0
              ? t('pipeline.workbench.open', { count: open + openLabels })
              : t('pipeline.workbench.done')}
          </span>
        </div>
        <div
          className="review-workbench-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={reviewedPercent}
          aria-label={t('pipeline.workbench.progressAria')}
        >
          <span style={{ inlineSize: `${String(reviewedPercent)}%` }} />
        </div>
      </header>

      {openLabels > 0 ? (
        <div className="review-workbench-labels">
          <h3 className="review-workbench-subtitle">{t('pipeline.workbench.labels')}</h3>
          <DocumentLabelSuggestionChips
            documentId={doc.id}
            suggestions={labelSuggestions}
            assignedTagIds={assigned}
            disabled={saving}
            onUpdated={onLabelsUpdated}
          />
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="review-workbench-empty">{t('pipeline.workbench.empty')}</p>
      ) : (
        <ol className="review-workbench-list" aria-label={t('pipeline.workbench.listAria')}>
          {rows.map((row, index) => {
            const label = fieldLabelForKey(row.key);
            const rowMode = mode?.key === row.key && mode.kind !== 'overwrite' ? mode.kind : null;
            const level = row.confidence == null ? null : confidenceLevelFromRatio(row.confidence);
            const stateText =
              row.state === 'confirmed'
                ? t('pipeline.workbench.state.confirmed')
                : row.state === 'suggested'
                  ? t('pipeline.workbench.state.suggested')
                  : row.confidence == null
                    ? t('pipeline.workbench.state.review')
                    : t('pipeline.workbench.confidence', {
                        percent: Math.round(row.confidence * 100),
                      });
            return (
              <li
                key={row.key}
                className={`review-workbench-row review-workbench-row--${row.state}${index === activeIndex ? ' review-workbench-row--active' : ''}`}
                data-field-key={row.key}
                data-row-state={row.state}
              >
                <button
                  type="button"
                  ref={(el) => {
                    rowRefs.current[index] = el;
                  }}
                  className="review-workbench-row-main"
                  tabIndex={index === activeIndex ? 0 : -1}
                  aria-keyshortcuts="Enter E F X ArrowUp ArrowDown"
                  onFocus={() => {
                    setActiveIndex(index);
                  }}
                  onClick={() => {
                    setActiveIndex(index);
                    onLocate(row.value);
                  }}
                  onKeyDown={(event) => {
                    onRowKeyDown(event, row, index);
                  }}
                >
                  <span className="review-workbench-row-label">{label}</span>
                  <span className="review-workbench-row-value">{row.value}</span>
                  <span
                    className={`review-workbench-row-state${level ? ` review-workbench-row-state--${level}` : ''}`}
                  >
                    {stateText}
                  </span>
                </button>
                <div className="review-workbench-row-tools">
                  {row.state !== 'confirmed' ? (
                    <IconButton
                      icon={Check}
                      size="sm"
                      className="review-workbench-accept"
                      label={t('pipeline.workbench.accept', { field: label })}
                      disabled={saving}
                      onClick={() => {
                        accept(row, index);
                      }}
                    />
                  ) : null}
                  <IconButton
                    icon={Pencil}
                    size="sm"
                    label={t('pipeline.workbench.correct', { field: label })}
                    onClick={() => {
                      startEdit(row, index);
                    }}
                  />
                  {fieldTargets.length > 1 ? (
                    <IconButton
                      icon={ArrowLeftRight}
                      size="sm"
                      label={t('pipeline.workbench.reassign', { field: label })}
                      expanded={rowMode === 'reassign'}
                      onClick={() => {
                        setActiveIndex(index);
                        setMode(rowMode === 'reassign' ? null : { key: row.key, kind: 'reassign' });
                      }}
                    />
                  ) : null}
                  {row.state !== 'confirmed' ? (
                    <IconButton
                      icon={CircleSlash}
                      size="sm"
                      className="review-workbench-reject"
                      data-testid="review-workbench-reject"
                      label={t('pipeline.workbench.reject', { field: label })}
                      title={t('pipeline.workbench.rejectTooltip')}
                      disabled={saving}
                      onClick={() => {
                        reject(row, index);
                      }}
                    />
                  ) : null}
                </div>
                {rowMode === 'edit' ? (
                  <form
                    className="review-workbench-edit"
                    onSubmit={(event) => {
                      submitEdit(event, row);
                    }}
                  >
                    <Input
                      ref={editRef}
                      value={draft}
                      aria-label={t('pipeline.workbench.editAria', { field: label })}
                      onChange={(event) => {
                        setDraft(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          closeMode();
                        }
                      }}
                    />
                    {onCorrectPosition ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        data-testid="field-position-correct"
                        onClick={() => {
                          onCorrectPosition(row.key);
                        }}
                      >
                        {t('documents.fieldPositionCorrect')}
                      </Button>
                    ) : null}
                    <Button type="submit" size="sm" disabled={saving}>
                      {t('pipeline.workbench.save')}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={closeMode}>
                      {t('common.cancel')}
                    </Button>
                  </form>
                ) : null}
                {rowMode === 'reassign' ? (
                  <div className="review-workbench-edit">
                    <Select
                      value=""
                      placeholder={t('pipeline.workbench.reassignPlaceholder')}
                      options={targetOptions(row)}
                      aria-label={t('pipeline.workbench.reassignAria', { field: label })}
                      onChange={(toKey) => {
                        if (!toKey) return;
                        const existing = fields.find((field) => field.key === toKey);
                        // Never silently replace a value a person already confirmed.
                        if (
                          existing?.userConfirmed === true &&
                          existing.value.trim() !== row.value.trim()
                        ) {
                          setMode({
                            key: row.key,
                            kind: 'overwrite',
                            toKey,
                            current: existing.value,
                          });
                          return;
                        }
                        refocus.current = true;
                        setMode(null);
                        if (row.state === 'suggested') onAcceptSuggestion(toKey, row.value);
                        else onReassign(row.key, toKey);
                      }}
                    />
                    <Button type="button" size="sm" variant="ghost" onClick={closeMode}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                ) : null}
                {mode?.key === row.key && mode.kind === 'overwrite' ? (
                  <div className="review-workbench-edit review-workbench-overwrite" role="alert">
                    <p>
                      {t('pipeline.workbench.overwrite', {
                        field: fieldLabelForKey(mode.toKey),
                        value: mode.current,
                      })}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        const toKey = mode.toKey;
                        refocus.current = true;
                        setMode(null);
                        if (row.state === 'suggested') onAcceptSuggestion(toKey, row.value);
                        else onReassign(row.key, toKey);
                      }}
                    >
                      {t('pipeline.workbench.overwriteConfirm')}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={closeMode}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
      {rejects.length > 0 ? (
        <div className="review-workbench-rejected" data-testid="review-workbench-rejected">
          <h3 className="review-workbench-subtitle">{t('pipeline.workbench.rejectedSection')}</h3>
          <ul className="review-workbench-rejected-list">
            {rejects.map((item) => (
              <li key={`${item.fieldKey}:${item.valueNormalized}:${item.correctionId ?? ''}`}>
                <span className="review-workbench-row-label">{fieldLabelForKey(item.fieldKey)}</span>
                <span className="review-workbench-row-value">{item.value ?? item.valueNormalized}</span>
                <span className="review-workbench-row-state">{t('pipeline.workbench.state.rejected')}</span>
                {onUndoReject && item.correctionId ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={saving}
                    data-testid="review-workbench-undo-reject"
                    onClick={() => {
                      const correctionId = item.correctionId;
                      if (!correctionId) return;
                      onUndoReject(correctionId);
                    }}
                  >
                    {t('pipeline.workbench.rejectUndo')}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="review-workbench-keys">{t('pipeline.workbench.keys')}</p>
    </section>
  );
}
