// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type FieldValuesExportFormat = 'csv' | 'json';

interface FieldValueExportRow {
  documentId: string;
  title: string;
  filename: string;
  fieldKey: string;
  value: string;
  confidence: number | null;
}

interface FieldValuesExportDocumentJson {
  documentId: string;
  title: string;
  filename: string;
  fields: readonly {
    key: string;
    value: string;
    confidence: number | null;
  }[];
}

const CSV_HEADER = ['documentId', 'title', 'filename', 'fieldKey', 'value', 'confidence'] as const;

export function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function serializeFieldValuesCsv(rows: readonly FieldValueExportRow[]): string {
  const lines: string[] = [CSV_HEADER.join(',')];
  for (const row of rows) {
    lines.push(
      [
        escapeCsvCell(row.documentId),
        escapeCsvCell(row.title),
        escapeCsvCell(row.filename),
        escapeCsvCell(row.fieldKey),
        escapeCsvCell(row.value),
        row.confidence == null ? '' : String(row.confidence),
      ].join(',')
    );
  }
  return `${lines.join('\r\n')}\r\n`;
}

export function groupFieldValuesForJson(
  rows: readonly FieldValueExportRow[]
): FieldValuesExportDocumentJson[] {
  const byDocument = new Map<
    string,
    {
      documentId: string;
      title: string;
      filename: string;
      fields: { key: string; value: string; confidence: number | null }[];
    }
  >();
  for (const row of rows) {
    let doc = byDocument.get(row.documentId);
    if (!doc) {
      doc = {
        documentId: row.documentId,
        title: row.title,
        filename: row.filename,
        fields: [],
      };
      byDocument.set(row.documentId, doc);
    }
    doc.fields.push({
      key: row.fieldKey,
      value: row.value,
      confidence: row.confidence,
    });
  }
  return [...byDocument.values()];
}

export function serializeFieldValuesJson(rows: readonly FieldValueExportRow[]): string {
  return `${JSON.stringify({ documents: groupFieldValuesForJson(rows) }, null, 2)}\n`;
}

export function fieldValuesExportFilename(format: FieldValuesExportFormat, stamp: string): string {
  return `docuvate-field-values-${stamp}.${format}`;
}

export function fieldValuesExportContentType(format: FieldValuesExportFormat): string {
  return format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8';
}
