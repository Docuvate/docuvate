// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { semanticFieldKey } from '@docuvate/contracts';

import { isoDateFromExtractedValue } from '../documentAutoDocumentDate';

export interface FieldNormalizationPreview {
  ok: boolean;
  normalized: string | null;
  typeLabel: string;
  hintKey: string | null;
}

function isDateFieldKey(key: string): boolean {
  const sem = semanticFieldKey({ key, value: '' });
  return sem === 'date' || key.toLowerCase().includes('datum');
}

export function previewFieldNormalization(key: string, raw: string): FieldNormalizationPreview {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, normalized: null, typeLabel: '', hintKey: 'reviewWizard.fieldEmpty' };
  }
  if (isDateFieldKey(key)) {
    const iso = isoDateFromExtractedValue(trimmed);
    if (!iso) {
      return {
        ok: false,
        normalized: null,
        typeLabel: 'Datum',
        hintKey: 'reviewWizard.fieldDateInvalid',
      };
    }
    const [y, m, d] = iso.split('-');
    const display = `${d}.${m}.${y}`;
    return {
      ok: true,
      normalized: display,
      typeLabel: 'Datum',
      hintKey: null,
    };
  }
  return { ok: true, normalized: trimmed, typeLabel: '', hintKey: null };
}
