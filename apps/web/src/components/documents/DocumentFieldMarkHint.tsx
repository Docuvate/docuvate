// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type Dispatch, type RefObject, type SetStateAction, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';
import type { DocumentSelectionDraft } from './DocumentSelectionLayer';
import type { DocumentSelectionTool } from './DocumentSelectionTools';

interface FieldMarkingSetters {
  setReanchorFieldKey: Dispatch<SetStateAction<string | null>>;
  setSelectionDraft: Dispatch<SetStateAction<DocumentSelectionDraft | null>>;
  setSelectionTool: Dispatch<SetStateAction<DocumentSelectionTool>>;
  highlightRegion: (key: string) => void;
  /** Field currently open in the small-screen correction sheet. */
  sheetFieldKey: string | null;
  closeSheet: () => void;
  onSaveFieldValue?: (key: string, value: string) => void;
}

interface FieldMarking {
  viewerStageRef: RefObject<HTMLDivElement>;
  startMarkingField: (key: string) => void;
  cancelMarkingField: () => void;
  /** Sheet actions for `sheetFieldKey`; undefined while no field is open. */
  sheetMarkInDocument?: () => void;
  sheetSaveValue?: (value: string) => void;
}

/** "Mark in document": arms the rectangle tool for one field and brings the viewer into view. */
export function useDocumentFieldMarking({
  setReanchorFieldKey,
  setSelectionDraft,
  setSelectionTool,
  highlightRegion,
  sheetFieldKey,
  closeSheet,
  onSaveFieldValue,
}: FieldMarkingSetters): FieldMarking {
  const viewerStageRef = useRef<HTMLDivElement>(null);
  const startMarkingField = useCallback(
    (key: string) => {
      setReanchorFieldKey(key);
      setSelectionDraft(null);
      setSelectionTool('rect');
      highlightRegion(key);
      viewerStageRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    [highlightRegion, setReanchorFieldKey, setSelectionDraft, setSelectionTool]
  );
  const cancelMarkingField = useCallback(() => {
    setReanchorFieldKey(null);
    setSelectionDraft(null);
    setSelectionTool('none');
  }, [setReanchorFieldKey, setSelectionDraft, setSelectionTool]);
  if (sheetFieldKey === null) {
    return { viewerStageRef, startMarkingField, cancelMarkingField };
  }
  return {
    viewerStageRef,
    startMarkingField,
    cancelMarkingField,
    sheetMarkInDocument: () => {
      startMarkingField(sheetFieldKey);
      closeSheet();
    },
    sheetSaveValue: onSaveFieldValue
      ? (value) => {
          onSaveFieldValue(sheetFieldKey, value);
          closeSheet();
        }
      : undefined,
  };
}

interface DocumentFieldMarkHintProps {
  fieldKey: string | null;
  fieldLabelForKey: (key: string) => string;
  selectionTool: DocumentSelectionTool;
  hasDraft: boolean;
  onCancel: () => void;
}

/** Visible instruction while the user is drawing the region for a field. */
export function DocumentFieldMarkHint({
  fieldKey,
  fieldLabelForKey,
  selectionTool,
  hasDraft,
  onCancel,
}: DocumentFieldMarkHintProps) {
  const { t } = useTranslation();
  if (fieldKey === null || selectionTool !== 'rect' || hasDraft) {
    return null;
  }
  return (
    <div className="layout-field-mark-hint" role="status" data-testid="field-mark-hint">
      <span>{t('documents.fieldMarkHint', { name: fieldLabelForKey(fieldKey) })}</span>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
        {t('documents.fieldMarkHintCancel')}
      </Button>
    </div>
  );
}
