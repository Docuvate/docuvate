// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfidenceThresholdSlider } from './ConfidenceThresholdSlider';

export interface RecognizedFieldGateDraft {
  confidenceGateEnabled: boolean;
  labelFieldConfidenceThreshold: number;
  requiredLabelIds: string[];
}

interface RecognizedFieldQualityGateEditorProps {
  tags: TagDto[];
  gate: RecognizedFieldGateDraft;
  disabled: boolean;
  onChange: (gate: RecognizedFieldGateDraft) => void;
  compact?: boolean;
}

/** Account defaults applied when adding new label-gated fields (not a global extraction policy). */
export function RecognizedFieldQualityGateEditor({
  tags,
  gate,
  disabled,
  onChange,
  compact = false,
}: RecognizedFieldQualityGateEditorProps) {
  const { t } = useTranslation();

  function toggleRequiredLabel(tagId: string, checked: boolean) {
    const next = checked
      ? [...gate.requiredLabelIds, tagId]
      : gate.requiredLabelIds.filter((id) => id !== tagId);
    onChange({ ...gate, requiredLabelIds: next });
  }

  const nonInboxTags = tags.filter((tag) => !tag.isInbox);
  const requiredLabelIdSet = useMemo(() => new Set(gate.requiredLabelIds), [gate.requiredLabelIds]);

  return (
    <div className="recognized-field-gate stack">
      <div className="settings-field">
        <span id="recognized-field-default-confidence-label" className="settings-field-label">
          {t('recognizedFields.gateSafetyLabelDefault')}
        </span>
        <ConfidenceThresholdSlider
          value={gate.labelFieldConfidenceThreshold}
          disabled={disabled}
          labelId="recognized-field-default-confidence-label"
          ariaLabel={t('recognizedFields.gateSafetyAria')}
          onChange={(labelFieldConfidenceThreshold) => { onChange({ ...gate, labelFieldConfidenceThreshold, confidenceGateEnabled: true }); }
          }
        />
      </div>

      <div className="settings-field">
        <span className="settings-field-label">{t('recognizedFields.defaultsLabelsTitle')}</span>
        {!compact ? (
          <p className="muted settings-hint">{t('recognizedFields.defaultsLabelsHint')}</p>
        ) : null}
        {nonInboxTags.length === 0 ? (
          <p className="muted">{t('recognizedFields.gateNoLabels')}</p>
        ) : (
          <ul className="recognized-field-label-checklist">
            {nonInboxTags.map((tag) => (
              <li key={tag.id}>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={requiredLabelIdSet.has(tag.id)}
                    disabled={disabled}
                    onChange={(e) => { toggleRequiredLabel(tag.id, e.target.checked); }}
                  />
                  <span>{tag.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
