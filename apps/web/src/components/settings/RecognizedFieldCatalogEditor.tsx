// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  emptyRecognizedFieldDraft,
  RECOGNIZED_FIELD_STARTER_PRESETS,
  type RecognizedFieldDraft,
} from '../../lib/recognizedFieldDraft';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { RecognizedFieldEditDialog } from './RecognizedFieldEditDialog';
import type { RecognizedFieldGateDraft } from './RecognizedFieldQualityGateEditor';

const FIELD_TYPE_KEYS: Record<string, string> = {
  text: 'recognizedFields.typeText',
  date: 'recognizedFields.typeDate',
  number: 'recognizedFields.typeNumber',
  currency: 'recognizedFields.typeCurrency',
};

interface RecognizedFieldCatalogEditorProps {
  fields: RecognizedFieldDraft[];
  tags: TagDto[];
  gateDefaults: RecognizedFieldGateDraft;
  catalogBusy: boolean;
  onPersistFields: (fields: RecognizedFieldDraft[]) => Promise<boolean>;
}

function formatRuleSummary(
  row: RecognizedFieldDraft,
  tagNameById: Map<string, string>,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  if (row.extractForAllDocuments) {
    return t('recognizedFields.ruleSummaryAlways');
  }
  const names = row.gateLabelIds
    .map((id) => tagNameById.get(id))
    .filter((name): name is string => Boolean(name));
  const joiner =
    row.gateLabelMatch === 'any'
      ? t('recognizedFields.ruleSummaryLabelsOr')
      : t('recognizedFields.ruleSummaryLabelsAnd');
  const labels =
    names.length > 0 ? names.join(joiner) : t('recognizedFields.ruleSummaryLabelsMissing');
  return t('recognizedFields.ruleSummaryLabelsWithSafety', {
    labels,
    percent: Math.round(row.minLabelConfidence * 100),
  });
}

export function RecognizedFieldCatalogEditor({
  fields,
  tags,
  gateDefaults,
  catalogBusy,
  onPersistFields,
}: RecognizedFieldCatalogEditorProps) {
  const { t } = useTranslation();
  const tagNameById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag.name])), [tags]);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingRow, setEditingRow] = useState<RecognizedFieldDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecognizedFieldDraft | null>(null);
  const [starterConfirmOpen, setStarterConfirmOpen] = useState(false);

  function openCreate() {
    setDialogMode('create');
    setEditingRow(null);
  }

  function openEdit(row: RecognizedFieldDraft) {
    setDialogMode('edit');
    setEditingRow(row);
  }

  function closeDialog() {
    if (catalogBusy) {
      return;
    }
    setDialogMode(null);
    setEditingRow(null);
  }

  async function saveDialogRow(row: RecognizedFieldDraft) {
    const next =
      dialogMode === 'create'
        ? [...fields, row]
        : fields.map((existing) => (existing.localId === row.localId ? row : existing));
    const ok = await onPersistFields(next);
    if (ok) {
      closeDialog();
    }
  }

  async function confirmDeleteRow() {
    if (!pendingDelete) {
      return;
    }
    const next = fields.filter((row) => row.localId !== pendingDelete.localId);
    setPendingDelete(null);
    await onPersistFields(next);
  }

  async function applyStarterPreset() {
    setStarterConfirmOpen(false);
    await onPersistFields(RECOGNIZED_FIELD_STARTER_PRESETS);
  }

  return (
    <div className="recognized-fields-catalog">
      <p className="muted recognized-fields-example">{t('recognizedFields.pageExample')}</p>

      {fields.length === 0 ? (
        <div className="recognized-fields-empty stack">
          <p className="muted">{t('recognizedFields.emptyState')}</p>
          <div className="form-actions recognized-fields-empty-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={catalogBusy}
              onClick={() => { setStarterConfirmOpen(true); }}
            >
              {t('recognizedFields.starterPreset')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={catalogBusy}
              onClick={() => { openCreate(); }}
            >
              {t('recognizedFields.addField')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="recognized-fields-table-wrap">
            <table className="recognized-fields-table">
              <colgroup>
                <col className="recognized-fields-col recognized-fields-col--label" />
                <col className="recognized-fields-col recognized-fields-col--type" />
                <col className="recognized-fields-col recognized-fields-col--rule" />
                <col className="recognized-fields-col recognized-fields-col--actions" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">{t('recognizedFields.columnLabel')}</th>
                  <th scope="col">{t('recognizedFields.columnType')}</th>
                  <th scope="col">{t('recognizedFields.columnRule')}</th>
                  <th scope="col" className="recognized-fields-table__actions-head">
                    <span className="sr-only">{t('recognizedFields.columnActions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((row) => {
                  const typeLabel = t(
                    FIELD_TYPE_KEYS[row.fieldType] ?? 'recognizedFields.typeText'
                  );
                  return (
                    <tr key={row.localId}>
                      <td
                        className="recognized-fields-table__cell recognized-fields-table__cell--label"
                        data-label={t('recognizedFields.columnLabel')}
                      >
                        <span
                          className="recognized-fields-table__primary"
                          title={row.label || undefined}
                        >
                          {row.label || t('recognizedFields.tableLabelEmpty')}
                        </span>
                      </td>
                      <td
                        className="recognized-fields-table__cell recognized-fields-table__cell--type"
                        data-label={t('recognizedFields.columnType')}
                      >
                        <span className="recognized-fields-table__truncate" title={typeLabel}>
                          {typeLabel}
                        </span>
                      </td>
                      <td
                        className="recognized-fields-table__cell recognized-fields-table__cell--rule"
                        data-label={t('recognizedFields.columnRule')}
                      >
                        <span
                          className="recognized-fields-table__rule recognized-fields-table__truncate"
                          title={formatRuleSummary(row, tagNameById, t)}
                        >
                          {formatRuleSummary(row, tagNameById, t)}
                        </span>
                      </td>
                      <td className="recognized-fields-table__actions">
                        <div className="recognized-fields-table__actions-inner">
                          <Button
                            type="button"
                            variant="ghost"
                            className="library-inline-action"
                            disabled={catalogBusy}
                            onClick={() => { openEdit(row); }}
                          >
                            {t('recognizedFields.editField')}
                          </Button>
                          <button
                            type="button"
                            className="recognized-fields-icon-btn library-inline-action library-inline-action-danger"
                            aria-label={t('recognizedFields.removeField')}
                            title={t('recognizedFields.removeField')}
                            disabled={catalogBusy}
                            onClick={() => { setPendingDelete(row); }}
                          >
                            <Trash2 size={16} strokeWidth={2} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="form-actions recognized-fields-table-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={catalogBusy}
              onClick={() => { openCreate(); }}
            >
              {t('recognizedFields.addField')}
            </Button>
          </div>
        </>
      )}

      <RecognizedFieldEditDialog
        open={dialogMode !== null}
        mode={dialogMode === 'create' ? 'create' : 'edit'}
        initialRow={
          dialogMode === 'edit' && editingRow
            ? editingRow
            : dialogMode === 'create'
              ? emptyRecognizedFieldDraft(gateDefaults)
              : null
        }
        tags={tags}
        gateDefaults={gateDefaults}
        busy={catalogBusy}
        onCancel={closeDialog}
        onSave={(row) => void saveDialogRow(row)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('recognizedFields.deleteFieldTitle')}
        description={t('recognizedFields.deleteFieldDescription', {
          label: pendingDelete?.label || t('recognizedFields.tableLabelEmpty'),
        })}
        tone="danger"
        busy={catalogBusy}
        confirmLabel={t('common.delete')}
        onCancel={() => { setPendingDelete(null); }}
        onConfirm={() => void confirmDeleteRow()}
      />

      <ConfirmDialog
        open={starterConfirmOpen}
        title={t('recognizedFields.starterPresetConfirmTitle')}
        description={t('recognizedFields.starterPresetConfirmDescription')}
        busy={catalogBusy}
        confirmLabel={t('recognizedFields.starterPreset')}
        onCancel={() => { setStarterConfirmOpen(false); }}
        onConfirm={() => void applyStarterPreset()}
      />
    </div>
  );
}

export type { RecognizedFieldDraft } from '../../lib/recognizedFieldDraft';
export {
  draftsFromRecognizedDefinitions,
  emptyRecognizedFieldDraft,
  RECOGNIZED_FIELD_STARTER_PRESETS,
} from '../../lib/recognizedFieldDraft';
