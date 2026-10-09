import type { PaperlessImportPort } from '../../domain/ports.js';

export class PaperlessImportStub implements PaperlessImportPort {
  async startBulkImport(): Promise<{ runId: string }> {
    throw new Error('Paperless import not implemented in MVP');
  }
}
