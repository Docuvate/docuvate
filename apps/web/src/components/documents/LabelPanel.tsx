// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, TagDto, TagSuggestionDto } from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  applyDocumentLabelCorrection,
  assignDocumentTag,
  createTag,
  getDocument,
  listTags,
  removeDocumentTag,
  withdrawDocumentLabelCorrection,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { LabelChipRow } from '../labels/LabelChipRow';
import { LabelPicker } from '../labels/LabelPicker';
import { useToast } from '../save/ToastProvider';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { DocumentLabelSuggestionChips } from './DocumentLabelSuggestionChips';

const NEST_CANDIDATE_LIMIT = 3;
const CORRECTION_UNDO_MS = 10_000;

interface LabelPanelProps {
  document: DocumentDto;
  onUpdated: (doc: DocumentDto) => void;
}

interface UndoState {
  correctionId: string;
  previousTagIds: string[];
}

function findTagByName(tags: TagDto[], name: string): TagDto | undefined {
  const normalized = name.trim().toLowerCase();
  return tags.find((tag) => tag.name.trim().toLowerCase() === normalized);
}

function nestCandidates(suggestions: TagSuggestionDto[] | undefined): TagSuggestionDto[] {
  return (suggestions ?? [])
    .filter((item) => item.source === 'embedding_density')
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    .slice(0, NEST_CANDIDATE_LIMIT);
}

export function LabelPanel({ document, onUpdated }: LabelPanelProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedNestTagId, setSelectedNestTagId] = useState<string | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);

  const candidates = useMemo(() => nestCandidates(document.tagSuggestions), [document.tagSuggestions]);

  useEffect(() => {
    if (candidates.length === 0) {
      setSelectedNestTagId(null);
      return;
    }
    const preferred =
      candidates.find((item) => item.decisionTier === 'confirm') ?? candidates[0];
    setSelectedNestTagId(preferred.tag.id);
  }, [document.id, candidates]);

  const dismissUndo = useCallback(() => {
    setUndo(null);
  }, []);

  useEffect(() => {
    if (!undo) {
      return;
    }
    const timer = window.setTimeout(dismissUndo, CORRECTION_UNDO_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [undo, dismissUndo]);

  const assignedIds = useMemo(
    () => new Set(document.tags.map((tag) => tag.id)),
    [document.tags]
  );

  const showNestRow =
    candidates.length > 0 && candidates.every((item) => !assignedIds.has(item.tag.id));

  async function run(action: () => Promise<DocumentDto>, key: string) {
    setBusy(key);
    setAddError(null);
    try {
      onUpdated(await action());
    } finally {
      setBusy(null);
    }
  }

  async function assignExistingTag(tagId: string) {
    if (busy !== null || assignedIds.has(tagId)) {
      return;
    }
    setAddError(null);
    setBusy(`add-${tagId}`);
    try {
      const doc = await assignDocumentTag(document.id, tagId);
      onUpdated(doc);
      const tagName = doc.tags.find((tag) => tag.id === tagId)?.name ?? '';
      toast.success(t('documents.labelAssignedToast', { name: tagName }), {
        undo: () => {
          void removeDocumentTag(document.id, tagId).then((reverted) => {
            onUpdated(reverted);
          });
        },
      });
    } catch (err) {
      setAddError(formatUserFacingError(err, 'errors.addFailed'));
    } finally {
      setBusy(null);
    }
  }

  async function createAndAssignLabel(name: string) {
    const trimmed = name.trim();
    if (!trimmed || busy !== null) {
      return;
    }
    setAddError(null);
    const tags = await listTags();
    const existing = findTagByName(tags, trimmed);
    if (existing && assignedIds.has(existing.id)) {
      setAddError(t('documents.labelAddAlreadyAssigned', { name: existing.name }));
      return;
    }
    setBusy('add-label');
    try {
      let assignedTagId: string;
      let doc: DocumentDto;
      if (existing) {
        assignedTagId = existing.id;
        doc = await assignDocumentTag(document.id, existing.id);
      } else {
        const created = await createTag({ name: trimmed });
        assignedTagId = created.id;
        doc = await assignDocumentTag(document.id, created.id);
      }
      onUpdated(doc);
      toast.success(t('documents.labelAssignedToast', { name: trimmed }), {
        undo: () => {
          void removeDocumentTag(document.id, assignedTagId).then((reverted) => {
            onUpdated(reverted);
          });
        },
      });
    } catch (err) {
      setAddError(formatUserFacingError(err, 'errors.addFailed'));
    } finally {
      setBusy(null);
    }
  }

  async function onConfirmNestCandidate() {
    if (!selectedNestTagId || busy !== null) {
      return;
    }
    const previousTagIds = document.tags.map((tag) => tag.id);
    setBusy('nest-confirm');
    try {
      const result = await applyDocumentLabelCorrection(document.id, selectedNestTagId);
      const doc = await getDocument(document.id);
      onUpdated(doc);
      if (result.correctionId) {
        setUndo({ correctionId: result.correctionId, previousTagIds });
      }
      toast.success(
        t('documents.labelLearnedToast', { count: result.similarDocumentsUpdated })
      );
    } catch (err) {
      toast.error(formatUserFacingError(err, 'errors.addFailed'));
    } finally {
      setBusy(null);
    }
  }

  async function onUndoCorrection() {
    if (!undo || busy !== null) {
      return;
    }
    setBusy('nest-undo');
    try {
      onUpdated(await withdrawDocumentLabelCorrection(document.id, undo.correctionId));
      setUndo(null);
    } catch (err) {
      toast.error(formatUserFacingError(err, 'errors.addFailed'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="label-panel" aria-labelledby="label-panel-heading">
      <header className="label-panel-header detail-section-head">
        <h2 id="label-panel-heading" className="detail-section-title">
          {t('documents.tabLabels')}
        </h2>
        <p className="muted detail-section-lead">{t('documents.labelPanelLead')}</p>
      </header>

      <DocumentLabelSuggestionChips
        documentId={document.id}
        suggestions={document.tagSuggestions ?? []}
        assignedTagIds={assignedIds}
        disabled={busy !== null}
        onUpdated={async () => {
          onUpdated(await getDocument(document.id));
        }}
      />

      {showNestRow ? (
        <div className="label-nest-correction" data-ux="label-nest-correction">
          <p className="muted label-nest-correction-lead">{t('documents.labelNestCandidatesLead')}</p>
          <div className="chip-row label-nest-chip-row" role="listbox" aria-label={t('documents.labelNestCandidatesLead')}>
            {candidates.map((item) => (
              <button
                key={item.tag.id}
                type="button"
                role="option"
                aria-selected={selectedNestTagId === item.tag.id}
                className={`label-nest-chip${selectedNestTagId === item.tag.id ? ' label-nest-chip-selected' : ''}`}
                disabled={busy !== null}
                onClick={() => { setSelectedNestTagId(item.tag.id); }}
              >
                <Chip
                  label={item.tag.name}
                  variant={selectedNestTagId === item.tag.id ? 'suggest' : 'outline'}
                  color={item.tag.color}
                />
              </button>
            ))}
          </div>
          <div className="label-nest-actions">
            <Button
              type="button"
              variant="primary"
              disabled={busy !== null || !selectedNestTagId}
              onClick={() => void onConfirmNestCandidate()}
            >
              {t('documents.labelNestConfirm')}
            </Button>
          </div>
          <div className="label-correction-undo-slot" aria-live="polite">
            {undo ? (
              <div className="label-correction-undo" role="status">
                <span>{t('documents.labelCorrectionUndo')}</span>
                <Button type="button" variant="ghost" onClick={() => void onUndoCorrection()}>
                  {t('common.undo')}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {document.tags.length === 0 ? (
        <p className="muted">{t('documents.labelPanelNoneAssigned')}</p>
      ) : (
        <LabelChipRow
          className="chip-row"
          items={document.tags.map((tag) => ({
            id: tag.id,
            label: tag.name,
            variant: tag.isInbox ? 'inbox' : 'assigned',
            color: tag.isInbox ? undefined : tag.color,
            onRemove: () =>
              void run(() => removeDocumentTag(document.id, tag.id), `remove-${tag.id}`),
          }))}
        />
      )}

      <div className="label-add">
        <div className="label-add-form">
          <LabelPicker
            value=""
            disabled={busy !== null}
            excludeTagIds={assignedIds}
            placeholder={t('documents.labelAddPlaceholder')}
            aria-label={t('documents.labelAddInputAria')}
            allowCreate
            createOptionLabel={(name) => t('documents.labelAddCreateOption', { name })}
            onCreateOption={(name) => {
              void createAndAssignLabel(name);
            }}
            onChange={(tagId) => {
              void assignExistingTag(tagId);
            }}
          />
          <p id="label-add-hint" className="muted label-add-hint">
            {t('documents.labelAddHint')}
          </p>
          {addError ? (
            <p className="error label-add-hint" role="alert">
              {addError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
