// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

export function syntheticFolderName(label = 'Ordner'): string {
  return `${label} ${randomUUID().slice(0, 8)}`;
}

export function syntheticFolderId(): string {
  return randomUUID();
}
