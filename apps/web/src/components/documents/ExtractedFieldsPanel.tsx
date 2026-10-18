// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FieldSuggestionRow } from '@docuvate/contracts';
import {
  dedupeExtractedFields,
  type ExtractedField,
  omitInvalidDateExtractedFields,
  semanticFieldKey,
  type TagCustomFieldDefinitionDto,
  type TagDto,
} from '@docuvate/contracts';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { extractionFieldLabel } from '../../lib/extractionFieldLabels';
import { formatExtractedFieldDisplayValue } from '../../lib/formatExtractedFieldDisplayValue';
import { labelFieldDisplayName } from '../../lib/labelFieldDisplay';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { DocumentFieldValueCards } from './DocumentFieldValueCards';

interface ExtractedFieldsPanelProps {
  fields: ExtractedField[];
  heuristicSuggestions?: FieldSuggestionRow[];
  onAcceptSuggestion?: (key: string, value: string) => void;
  tags?: TagDto[];
  customFieldDefs?: Map<string, TagCustomFieldDefinitionDto[]>;
  globalFieldLabels?: Map<string, string>;
  saving: boolean;
  fieldsDirty: boolean;
  baselineFields?: ExtractedField[];
  feedbackRecordedCount?: number;
  onFieldsChange: (fields: ExtractedField[]) => void;
  onDiscardField?: (key: string) => void;
  onConfirmField?: (field: ExtractedField) => void;
  onSave: () => void;
}

export function ExtractedFieldsPanel({
  fields,
  tags = [],
  customFieldDefs = new Map(),
  globalFieldLabels = new Map(),
  heuristicSuggestions = [],
  onAcceptSuggestion,
  saving,
  fieldsDirty,
  baselineFields = [],
  feedbackRecordedCount = 0,
  onFieldsChange,
  onDiscardField,
  onConfirmField,
  onSave,
}: ExtractedFieldsPanelProps) {
  const { t, i18n } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);

  function displayLabel(field: ExtractedField): string {
    const labelScoped = labelFieldDisplayName(field, tags, customFieldDefs, globalFieldLabels);
    if (labelScoped !== field.key) {
      return labelScoped;
    }
    return extractionFieldLabel(field.key);
  }

  const visibleFields = omitInvalidDateExtractedFields(dedupeExtractedFields(fields));

  const pendingSuggestions = heuristicSuggestions.filter(
    (s) => !visibleFields.some((f) => f.key === s.key)
  );
  if (visibleFields.length === 0 && pendingSuggestions.length === 0) return null;

  function rowKey(field: ExtractedField): string {
    return field.tagId ? `${field.tagId}:${semanticFieldKey(field)}` : semanticFieldKey(field);
  }

  function baselineValueFor(field: ExtractedField): string {
    return baselineFields.find((row) => row.key === field.key)?.value ?? field.value;
  }

  function fieldRowDirty(field: ExtractedField): boolean {
    return field.value !== baselineValueFor(field);
  }

  return (
    <section
      className="detail-tab-section extracted-fields-section"
      aria-labelledby="extracted-fields-heading"
    >
      <h2 id="extracted-fields-heading" className="detail-section-title">
        {t('recognizedFields.documentSectionTitle')}
      </h2>
      {visibleFields.length > 0 ? (
        <DocumentFieldValueCards
          fields={visibleFields}
          baselineFields={baselineFields}
          fieldLabel={displayLabel}
          onConfirmField={(field) => {
            onConfirmField?.(field);
          }}
          onCorrectField={() => {
            setEditOpen(true);
          }}
        />
      ) : null}
      {pendingSuggestions.length > 0 ? (
        <section className="extracted-field-suggestions" aria-label={t('documents.layoutFieldSuggestions')}>
          <h3 className="detail-section-title">{t('documents.layoutFieldSuggestions')}</h3>
          <ul className="layout-field-suggestion-list">
            {pendingSuggestions.map((s) => (
              <li key={s.key} className="layout-field-suggestion">
                <div className="layout-field-suggestion-head">
                  <span className="layout-field-suggestion-tag">{t('documents.layoutSuggestionTag')}</span>
                  <span className="layout-field-label">{extractionFieldLabel(s.key)}</span>
                </div>
                <p className="layout-field-value">
                  {formatExtractedFieldDisplayValue(s.key, s.value, i18n.language)}
                </p>
                {onAcceptSuggestion ? (
                  <div className="layout-field-suggestion-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => { onAcceptSuggestion(s.key, s.value); }}
                    >
                      {t('documents.layoutSuggestionAccept')}
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {visibleFields.length > 0 ? (
      <details
        className="extracted-fields-edit-details"
        open={editOpen}
        onToggle={(e) => { setEditOpen(e.currentTarget.open); }}
      >
        <summary className="extracted-fields-edit-summary">
          {t('recognizedFields.correctFieldsSummary')}
        </summary>
        <p className="muted extracted-fields-edit-hint">
          {t('recognizedFields.correctFieldsHint')}
        </p>
        <div className="extraction-fields-grid extraction-fields-grid-compact">
          {visibleFields.map((field) => (
            <div key={rowKey(field)} className="extraction-field-cell extraction-field-cell-row">
              <label className="extraction-field-cell">
                <span className="extraction-field-label">{displayLabel(field)}</span>
                <Input
                  value={field.value}
                  onChange={(e) => {
                    onFieldsChange(
                      fields.map((row) =>
                        row.key === field.key ? { ...row, value: e.target.value } : row
                      )
                    );
                  }}
                />
              </label>
              {fieldRowDirty(field) && onDiscardField ? (
                <IconButton
                  icon={X}
                  size="sm"
                  className="extraction-field-discard-btn"
                  label={t('save.discard')}
                  onClick={() => { onDiscardField(field.key); }}
                />
              ) : null}
            </div>
          ))}
        </div>
        {fieldsDirty ? (
          <Button type="button" variant="secondary" disabled={saving} onClick={onSave}>
            {saving ? t('documents.saving') : t('recognizedFields.saveCorrections')}
          </Button>
        ) : (
          <p className="muted extracted-fields-save-hint">{t('recognizedFields.noCorrections')}</p>
        )}
        {feedbackRecordedCount > 0 ? (
          <p className="info-banner extracted-fields-feedback-banner" role="status">
            {t('recognizedFields.feedbackSaved', { count: feedbackRecordedCount })}
          </p>
        ) : null}
      </details>
      ) : null}
    </section>
  );
}
