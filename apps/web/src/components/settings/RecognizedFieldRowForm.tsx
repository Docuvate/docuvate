// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CustomFieldType, TagDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import { parseCustomFieldType } from '../../lib/customFieldType';
import type { RecognizedFieldDraft } from '../../lib/recognizedFieldDraft';
import { deriveKeyFromLabel } from '../../lib/recognizedFieldKey';
import {
  applyExtractionRuleMode,
  type FieldExtractionRuleMode,
  getExtractionRuleMode,
} from '../../lib/recognizedFieldRules';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Select } from '../ui/Select';
import { ConfidenceThresholdSlider } from './ConfidenceThresholdSlider';
import type { RecognizedFieldGateDraft } from './RecognizedFieldQualityGateEditor';

const FIELD_TYPES: { value: CustomFieldType; labelKey: string }[] = [
  { value: 'text', labelKey: 'recognizedFields.typeText' },
  { value: 'date', labelKey: 'recognizedFields.typeDate' },
  { value: 'number', labelKey: 'recognizedFields.typeNumber' },
  { value: 'currency', labelKey: 'recognizedFields.typeCurrency' },
];

export interface RecognizedFieldRowFormProps {
  row: RecognizedFieldDraft;
  tags: TagDto[];
  gateDefaults: RecognizedFieldGateDraft;
  keyManual: boolean;
  onChange: (row: RecognizedFieldDraft) => void;
  onKeyManual: () => void;
}

export function RecognizedFieldRowForm({
  row,
  tags,
  gateDefaults,
  keyManual,
  onChange,
  onKeyManual,
}: RecognizedFieldRowFormProps) {
  const { t } = useTranslation();
  const nonInboxTags = tags.filter((tag) => !tag.isInbox);
  const mode = getExtractionRuleMode(row);

  function patch(partial: Partial<RecognizedFieldDraft>) {
    onChange({ ...row, ...partial });
  }

  function updateLabel(label: string) {
    const next: RecognizedFieldDraft = { ...row, label };
    if (!keyManual) {
      next.key = deriveKeyFromLabel(label);
    }
    onChange(next);
  }

  function setRuleMode(nextMode: FieldExtractionRuleMode) {
    onChange(applyExtractionRuleMode(row, nextMode, gateDefaults));
  }

  function toggleGateLabel(tagId: string, checked: boolean) {
    const gateLabelIds = checked
      ? [...row.gateLabelIds, tagId]
      : row.gateLabelIds.filter((id) => id !== tagId);
    onChange({
      ...row,
      gateLabelIds,
      extractForAllDocuments: false,
      confidenceGateEnabled: true,
    });
  }

  return (
    <div className="recognized-field-inline-editor stack">
      <div className="recognized-field-inline-editor__grid">
        <label className="recognized-field-form-label">
          {t('recognizedFields.fieldLabel')}
          <Input
            value={row.label}
            placeholder={t('recognizedFields.fieldLabelPlaceholder')}
            onChange={(e) => { updateLabel(e.target.value); }}
          />
        </label>
        <label className="recognized-field-form-label">
          {t('recognizedFields.fieldType')}
          <Select
            value={row.fieldType}
            onChange={(value) => { patch({ fieldType: parseCustomFieldType(value) }); }}
            options={FIELD_TYPES.map((type) => ({
              value: type.value,
              label: t(type.labelKey),
            }))}
            aria-label={t('recognizedFields.fieldType')}
          />
        </label>
      </div>

      <div className="recognized-field-rule-block">
        <span className="settings-field-label">{t('recognizedFields.ruleModeLegend')}</span>
        <SegmentedControl<FieldExtractionRuleMode>
          ariaLabel={t('recognizedFields.ruleModeLegend')}
          value={mode}
          options={[
            { value: 'always', label: t('recognizedFields.ruleModeAlways') },
            { value: 'labels', label: t('recognizedFields.ruleModeLabels') },
          ]}
          onChange={(next) => { setRuleMode(next); }}
        />

        {mode === 'labels' ? (
          <div className="recognized-field-rule-details stack">
            <div className="settings-field">
              <span className="settings-field-label">{t('recognizedFields.gateLabelsTitle')}</span>
              {nonInboxTags.length === 0 ? (
                <p className="muted">{t('recognizedFields.gateNoLabels')}</p>
              ) : (
                <ul className="recognized-field-label-checklist">
                  {nonInboxTags.map((tag) => (
                    <li key={tag.id}>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={row.gateLabelIds.includes(tag.id)}
                          onChange={(e) => { toggleGateLabel(tag.id, e.target.checked); }}
                        />
                        <span>{tag.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              {row.gateLabelIds.length > 1 ? (
                <div
                  className="recognized-field-match-mode"
                  role="radiogroup"
                  aria-label={t('recognizedFields.gateMatchLegend')}
                >
                  <label className="checkbox-row">
                    <input
                      type="radio"
                      name={`gate-match-${row.localId}`}
                      checked={row.gateLabelMatch === 'any'}
                      onChange={() => { patch({ gateLabelMatch: 'any' }); }}
                    />
                    {t('recognizedFields.gateMatchAny')}
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="radio"
                      name={`gate-match-${row.localId}`}
                      checked={row.gateLabelMatch === 'all'}
                      onChange={() => { patch({ gateLabelMatch: 'all' }); }}
                    />
                    {t('recognizedFields.gateMatchAll')}
                  </label>
                </div>
              ) : null}
            </div>
            <div className="settings-field">
              <span id={`recognized-field-safety-${row.localId}`} className="settings-field-label">
                {t('recognizedFields.fieldSafetyLabel')}
              </span>
              <p className="muted settings-hint">{t('recognizedFields.fieldSafetyHint')}</p>
              <ConfidenceThresholdSlider
                value={row.minLabelConfidence}
                labelId={`recognized-field-safety-${row.localId}`}
                ariaLabel={t('recognizedFields.gateSafetyAria')}
                onChange={(minLabelConfidence) => { patch({ minLabelConfidence }); }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <details className="recognized-field-advanced">
        <summary>{t('recognizedFields.advancedToggle')}</summary>
        <label className="recognized-field-form-label">
          {t('recognizedFields.fieldKey')}
          <Input
            value={row.key}
            placeholder={deriveKeyFromLabel(row.label) || 'absender'}
            onChange={(e) => {
              onKeyManual();
              patch({ key: e.target.value });
            }}
          />
          <span className="muted settings-hint">{t('recognizedFields.fieldKeyHint')}</span>
        </label>
      </details>
    </div>
  );
}
