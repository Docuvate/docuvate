// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Split OCR text into lines for template-subtracted duplicate scoring. */
export function extractionTextToLines(text: string | null | undefined): string[] {
  const raw = (text ?? '').replace(/\r\n/g, '\n').trim();
  if (!raw) return [];
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length > 0) return lines;
  return [raw];
}
