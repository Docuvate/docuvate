// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  decodePaperlessImportErrorMessageParams,
  encodePaperlessImportErrorMessageParams,
  PAPERLESS_IMPORT_MESSAGE_KEYS,
} from './paperless-import-message-keys.js';

describe('paperless-import-message-keys', () => {
  it('round-trips message params JSON', () => {
    const encoded = encodePaperlessImportErrorMessageParams({ maxMb: 200 });
    expect(encoded).toBe('{"maxMb":200}');
    expect(decodePaperlessImportErrorMessageParams(encoded)).toEqual({ maxMb: 200 });
  });

  it('lists every connectors.paperlessImport message key used by the API', () => {
    expect(Object.values(PAPERLESS_IMPORT_MESSAGE_KEYS)).toEqual([
      'connectors.paperlessImport.documentTooLarge',
      'connectors.paperlessImport.documentFailed',
      'connectors.paperlessImport.runFailed',
      'connectors.paperlessImport.runAlreadyActive',
      'connectors.paperlessImport.retryNoFailedDocuments',
    ]);
  });
});
