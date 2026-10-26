// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';

export type LabelPickerRow =
  | { kind: 'header'; id: string; label: string }
  | { kind: 'option'; id: string; tag: TagDto }
  | { kind: 'hint'; id: string }
  | { kind: 'empty'; id: string }
  | { kind: 'loading'; id: string };

function groupLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '#';
  }
  const first = trimmed.charAt(0).toLocaleUpperCase('de-DE');
  if (/[A-ZÄÖÜ]/i.test(first)) {
    return first.toLocaleUpperCase('de-DE');
  }
  if (/\d/.test(first)) {
    return '0–9';
  }
  return '#';
}

export function buildLabelPickerRows(
  tags: TagDto[],
  options: {
    excludeIds?: ReadonlySet<string>;
    showTruncatedHint: boolean;
    showEmpty: boolean;
    showLoading: boolean;
  }
): LabelPickerRow[] {
  const rows: LabelPickerRow[] = [];
  if (options.showLoading && tags.length === 0) {
    rows.push({ kind: 'loading', id: 'loading' });
    return rows;
  }
  const filtered = tags.filter((tag) => !options.excludeIds?.has(tag.id));
  if (options.showEmpty && filtered.length === 0) {
    rows.push({ kind: 'empty', id: 'empty' });
    return rows;
  }
  let lastGroup: string | null = null;
  for (const tag of filtered) {
    const group = groupLabel(tag.name);
    if (group !== lastGroup) {
      rows.push({ kind: 'header', id: `header-${group}`, label: group });
      lastGroup = group;
    }
    rows.push({ kind: 'option', id: tag.id, tag });
  }
  if (options.showTruncatedHint) {
    rows.push({ kind: 'hint', id: 'hint' });
  }
  return rows;
}

export function labelPickerRowHeight(row: LabelPickerRow): number {
  if (row.kind === 'header') {
    return 28;
  }
  if (row.kind === 'hint' || row.kind === 'empty' || row.kind === 'loading') {
    return 36;
  }
  return 40;
}
