// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Static catalog when the worker `/extract/engines` endpoint is unreachable. */
export const EXTRACTION_ENGINE_FALLBACK = [
  {
    id: 'pipeline',
    label: 'Pipeline (Standard)',
    description: 'Born-digital PDF zuerst, sonst PaddleOCR. Empfohlen für CPU-Compose.',
    arenaEligible: true,
  },
  {
    id: 'paddle',
    label: 'PaddleOCR',
    description: 'Immer OCR (Raster). Gut für Scans, langsamer bei langen PDFs.',
    arenaEligible: true,
  },
  {
    id: 'docling',
    label: 'Docling',
    description:
      'Layout-PDF mit Tabellen/Struktur. Optional: Worker-Extra [docling] (PyTorch + Modell-Download).',
    arenaEligible: true,
  },
  {
    id: 'pdf_native',
    label: 'PDF-Textlayer',
    description: 'Nur eingebetteter Text, kein OCR. Scans liefern wenig.',
    arenaEligible: true,
  },
  {
    id: 'tesseract',
    label: 'Tesseract',
    description: 'Klassisches OCR (deu+eng). Optional, nicht im Standard-Docker-Image.',
    arenaEligible: false,
  },
] as const;

export function fallbackExtractionEngines(): Array<{
  id: string;
  label: string;
  description: string;
  available?: boolean;
  arenaEligible?: boolean;
}> {
  return EXTRACTION_ENGINE_FALLBACK.map((engine) => ({
    ...engine,
    available: false,
  }));
}
