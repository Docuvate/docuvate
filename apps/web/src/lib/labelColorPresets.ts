// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { tokens } from '@docuvate/tokens';

export const LABEL_COLOR_PRESET_IDS = [
  'slate',
  'blue',
  'emerald',
  'amber',
  'rose',
  'violet',
  'cyan',
  'orange',
] as const;

export type LabelColorPresetId = (typeof LABEL_COLOR_PRESET_IDS)[number];

const PRESET_HEX: Record<LabelColorPresetId, string> = {
  slate: tokens.colorLight.colorLabelPresetSlate,
  blue: tokens.colorLight.colorLabelPresetBlue,
  emerald: tokens.colorLight.colorLabelPresetEmerald,
  amber: tokens.colorLight.colorLabelPresetAmber,
  rose: tokens.colorLight.colorLabelPresetRose,
  violet: tokens.colorLight.colorLabelPresetViolet,
  cyan: tokens.colorLight.colorLabelPresetCyan,
  orange: tokens.colorLight.colorLabelPresetOrange,
};

export function labelColorPresetHex(id: LabelColorPresetId): string {
  return PRESET_HEX[id];
}

export function labelColorPresetLabelKey(id: LabelColorPresetId): string {
  return `labels.colorPreset${id.charAt(0).toUpperCase()}${id.slice(1)}`;
}

export function normalizeLabelColorHex(value: string): string {
  return value.trim().toLowerCase();
}

export function isLabelPresetColor(value: string): boolean {
  const normalized = normalizeLabelColorHex(value);
  return LABEL_COLOR_PRESET_IDS.some(
    (id) => normalizeLabelColorHex(labelColorPresetHex(id)) === normalized
  );
}
