import type { PaperlessImportPort } from '../../domain/ports.js';

export class PaperlessImportStub implements PaperlessImportPort {
  async importFromPaperless(): Promise<never> {
    throw new Error('Paperless import not implemented in MVP');
  }
}
