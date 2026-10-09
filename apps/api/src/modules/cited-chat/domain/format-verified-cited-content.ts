// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export function formatVerifiedCitedContent(
  verified: Array<{ text: string; ordinal: number }>
): string {
  const seenOrdinals = new Set<number>();
  const parts: string[] = [];
  for (const row of verified) {
    if (seenOrdinals.has(row.ordinal)) {
      continue;
    }
    seenOrdinals.add(row.ordinal);
    parts.push(`${row.text} [${row.ordinal}]`);
  }
  return parts.join(' ');
}
