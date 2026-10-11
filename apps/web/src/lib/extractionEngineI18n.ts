// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TFunction } from 'i18next';

const ENGINE_IDS = ['pipeline', 'paddle', 'docling', 'pdf_native', 'tesseract'] as const;

function engineKey(id: string, field: 'label' | 'description'): string {
  return `settings.extractionEngines.${id}.${field}`;
}

export function extractionEngineLabel(t: TFunction, id: string, apiFallback?: string): string {
  const key = engineKey(id, 'label');
  if (t(key) !== key) {
    return t(key);
  }
  return apiFallback ?? id;
}

export function extractionEngineDescription(t: TFunction, id: string): string | null {
  const key = engineKey(id, 'description');
  if (t(key) !== key) {
    return t(key);
  }
  return null;
}

export function isKnownExtractionEngineId(id: string): boolean {
  for (const engineId of ENGINE_IDS) {
    if (engineId === id) {
      return true;
    }
  }
  return false;
}
