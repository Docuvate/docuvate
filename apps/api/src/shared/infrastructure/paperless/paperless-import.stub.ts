// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PaperlessImportPort } from '../../domain/ports.js';

export class PaperlessImportStub implements PaperlessImportPort {
  startBulkImport(): Promise<{ runId: string }> {
    return Promise.reject(new Error('Paperless import not implemented in MVP'));
  }
}
