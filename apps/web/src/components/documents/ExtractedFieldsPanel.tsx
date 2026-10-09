// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatExtractedFieldDisplayValue } from '../../lib/formatExtractedFieldDisplayValue';
import {
  dedupeExtractedFields,
  omitInvalidDateExtractedFields,
  semanticFieldKey,
  type ExtractedField,
  type TagCustomFieldDefinitionDto,
  type TagDto,
} from '@docuvate/contracts';
import { extractionFieldLabel } from '../../lib/extractionFieldLabels';
import { labelFieldDisplayName } from '../../lib/labelFieldDisplay';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ExtractedFieldsPanelProps {
  fields: ExtractedField[];
  tags?: TagDto[];
  customFieldDefs?: Map<string, TagCustomFieldDefinitionDto[]>;
  globalFieldLabels?: Map<string, string>;
  saving: boolean;
  fieldsDirty: boolean;
  feedbackRecordedCount?: number;
  onFieldsChange: (fields: ExtractedField[]) => void;
  onSave: () => void;
}

export function ExtractedFieldsPanel({
  fields,
  tags = [],
  customFieldDefs = new Map(),
  globalFieldLabels = new Map(),
  saving,
  fieldsDirty,
  feedbackRecordedCount = 0,
  onFieldsChange,
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
  if (visibleFields.length === 0) return null;

  function rowKey(field: ExtractedField): string {
    return field.tagId ? `${field.tagId}:${semanticFieldKey(field)}` : semanticFieldKey(field);
  }

  return (
    <section
      className="detail-tab-section extracted-fields-section"
      aria-labelledby="extracted-fields-heading"
    >
      <h2 id="extracted-fields-heading" className="detail-section-title">
        {t('recognizedFields.documentSectionTitle')}
      </h2>
      <dl className="extracted-fields-dl">
        {visibleFields.map((field) => (
          <div key={rowKey(field)} className="extracted-fields-row">
            <dt>{displayLabel(field)}</dt>
            <dd>{formatExtractedFieldDisplayValue(field.key, field.value, i18n.language)}</dd>
          </div>
        ))}
      </dl>
      <details
        className="extracted-fields-edit-details"
        open={editOpen}
        onToggle={(e) => setEditOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="extracted-fields-edit-summary">
          {t('recognizedFields.correctFieldsSummary')}
        </summary>
        <p className="muted extracted-fields-edit-hint">
          {t('recognizedFields.correctFieldsHint')}
        </p>
        <div className="extraction-fields-grid extraction-fields-grid-compact">
          {visibleFields.map((field) => (
            <label key={rowKey(field)} className="extraction-field-cell">
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
    </section>
  );
}
