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
  return (ENGINE_IDS as readonly string[]).includes(id);
}
