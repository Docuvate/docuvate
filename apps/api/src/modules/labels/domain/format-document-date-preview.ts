// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export function formatDocumentDatePreview(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const ms = value.getTime();
  if (!Number.isFinite(ms)) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}
