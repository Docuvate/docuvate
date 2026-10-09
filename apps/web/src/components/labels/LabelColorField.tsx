// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import {
  LABEL_COLOR_PRESET_IDS,
  isLabelPresetColor,
  labelColorPresetHex,
  labelColorPresetLabelKey,
  normalizeLabelColorHex,
} from '../../lib/labelColorPresets';

type LabelColorFieldProps = {
  value: string;
  onChange: (color: string) => void;
};

export function LabelColorField({ value, onChange }: LabelColorFieldProps) {
  const { t } = useTranslation();
  const customInputId = useId();
  const customInputRef = useRef<HTMLInputElement>(null);
  const resolved = value.trim() || labelColorPresetHex('slate');
  const customActive = !isLabelPresetColor(resolved);

  return (
    <div className="label-color-presets" role="group" aria-labelledby={`${customInputId}-legend`}>
      <span id={`${customInputId}-legend`} className="visually-hidden">
        {t('labels.color')}
      </span>
      {LABEL_COLOR_PRESET_IDS.map((id) => {
        const hex = labelColorPresetHex(id);
        const active = normalizeLabelColorHex(hex) === normalizeLabelColorHex(resolved);
        return (
          <button
            key={id}
            type="button"
            className={`label-color-preset${active ? ' is-active' : ''}`}
            style={{ backgroundColor: hex }}
            aria-label={t(labelColorPresetLabelKey(id))}
            aria-pressed={active}
            onClick={() => onChange(hex)}
          >
            {active ? <Check size={14} strokeWidth={2.5} aria-hidden /> : null}
          </button>
        );
      })}
      <button
        type="button"
        className={`label-color-preset label-color-preset-custom${customActive ? ' is-active' : ''}`}
        style={customActive ? { backgroundColor: resolved } : undefined}
        aria-label={t('labels.customColor')}
        aria-pressed={customActive}
        onClick={() => customInputRef.current?.click()}
      >
        {customActive ? <Check size={14} strokeWidth={2.5} aria-hidden /> : t('labels.customColor')}
      </button>
      <input
        ref={customInputRef}
        id={customInputId}
        type="color"
        className="label-color-input-hidden"
        value={resolved}
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
