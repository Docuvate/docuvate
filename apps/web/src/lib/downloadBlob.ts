// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Save a blob through a temporary anchor (browser download). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** `docuvate-field-values-2026-11-05.csv` (optionally scoped to one document). */
export function fieldValuesExportFilename(
  format: 'csv' | 'json',
  now: Date = new Date(),
  scope?: string
): string {
  const stamp = now.toISOString().slice(0, 10);
  const suffix = scope ? `-${scope}` : '';
  return `docuvate-field-values${suffix}-${stamp}.${format}`;
}
