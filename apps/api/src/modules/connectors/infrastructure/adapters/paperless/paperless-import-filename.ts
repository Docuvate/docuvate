// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  primaryUploadExtensionForMime,
  repairBinPlaceholderFilename,
} from '@docuvate/contracts';

export function resolvePaperlessImportFilename(input: {
  id: number;
  title: string;
  original_file_name?: string | null;
  mime_type?: string | null;
}): string {
  const mimeType = input.mime_type?.trim() ?? 'application/octet-stream';
  const original = input.original_file_name?.trim() ?? '';
  if (original.length > 0) {
    return repairBinPlaceholderFilename(original, mimeType);
  }
  const title = input.title.trim();
  if (title.length > 0) {
    const extension = primaryUploadExtensionForMime(mimeType);
    if (extension && !title.toLowerCase().endsWith(extension)) {
      return `${title}${extension}`;
    }
    return title;
  }
  const fallbackExt = primaryUploadExtensionForMime(mimeType) ?? '.bin';
  return `document-${String(input.id)}${fallbackExt}`;
}
