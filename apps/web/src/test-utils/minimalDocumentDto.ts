// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

export function minimalDocumentDto(
  overrides: Partial<DocumentDto> & Pick<DocumentDto, 'id'>
): DocumentDto {
  return {
    filename: 'file.pdf',
    title: 'Document',
    status: 'ready',
    mimeType: 'application/pdf',
    tags: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}
