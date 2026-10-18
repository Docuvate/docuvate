// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** CE upload allowlist: MIME, extensions, and UI badge keys. */
export interface UploadFormatDefinition {
  mime: string;
  extensions: readonly string[];
  /** Short label for badges (uppercase file extension style). */
  badge: string;
  /** When true, worker renders a PDF preview via LibreOffice (original kept for download). */
  needsPdfPreview: boolean;
}

export const UPLOAD_FORMAT_DEFINITIONS: readonly UploadFormatDefinition[] = [
  { mime: 'application/pdf', extensions: ['.pdf'], badge: 'PDF', needsPdfPreview: false },
  { mime: 'image/jpeg', extensions: ['.jpg', '.jpeg'], badge: 'JPG', needsPdfPreview: false },
  { mime: 'image/png', extensions: ['.png'], badge: 'PNG', needsPdfPreview: false },
  { mime: 'image/webp', extensions: ['.webp'], badge: 'WEBP', needsPdfPreview: false },
  { mime: 'image/gif', extensions: ['.gif'], badge: 'GIF', needsPdfPreview: false },
  { mime: 'image/tiff', extensions: ['.tif', '.tiff'], badge: 'TIFF', needsPdfPreview: false },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['.docx'],
    badge: 'DOCX',
    needsPdfPreview: true,
  },
  { mime: 'application/msword', extensions: ['.doc'], badge: 'DOC', needsPdfPreview: true },
  {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['.xlsx'],
    badge: 'XLSX',
    needsPdfPreview: true,
  },
  { mime: 'application/vnd.ms-excel', extensions: ['.xls'], badge: 'XLS', needsPdfPreview: true },
  {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['.pptx'],
    badge: 'PPTX',
    needsPdfPreview: true,
  },
  { mime: 'application/vnd.ms-powerpoint', extensions: ['.ppt'], badge: 'PPT', needsPdfPreview: true },
  {
    mime: 'application/vnd.oasis.opendocument.text',
    extensions: ['.odt'],
    badge: 'ODT',
    needsPdfPreview: true,
  },
  {
    mime: 'application/vnd.oasis.opendocument.spreadsheet',
    extensions: ['.ods'],
    badge: 'ODS',
    needsPdfPreview: true,
  },
  {
    mime: 'application/vnd.oasis.opendocument.presentation',
    extensions: ['.odp'],
    badge: 'ODP',
    needsPdfPreview: true,
  },
  { mime: 'application/rtf', extensions: ['.rtf'], badge: 'RTF', needsPdfPreview: true },
  { mime: 'text/rtf', extensions: ['.rtf'], badge: 'RTF', needsPdfPreview: true },
  { mime: 'text/csv', extensions: ['.csv'], badge: 'CSV', needsPdfPreview: true },
  { mime: 'text/plain', extensions: ['.txt'], badge: 'TXT', needsPdfPreview: false },
  { mime: 'text/markdown', extensions: ['.md', '.markdown'], badge: 'MD', needsPdfPreview: true },
  { mime: 'text/html', extensions: ['.html', '.htm'], badge: 'HTML', needsPdfPreview: true },
  { mime: 'message/rfc822', extensions: ['.eml'], badge: 'EML', needsPdfPreview: true },
  {
    mime: 'application/vnd.ms-outlook',
    extensions: ['.msg'],
    badge: 'MSG',
    needsPdfPreview: true,
  },
] as const;

const MIME_TO_DEF = new Map<string, UploadFormatDefinition>();
const EXT_TO_MIME = new Map<string, string>();

for (const def of UPLOAD_FORMAT_DEFINITIONS) {
  MIME_TO_DEF.set(def.mime.toLowerCase(), def);
  for (const ext of def.extensions) {
    EXT_TO_MIME.set(ext.toLowerCase(), def.mime);
  }
}

export function normalizeMimeType(mimeType: string): string {
  return mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
}

export function isAllowedUploadMime(mimeType: string): boolean {
  return MIME_TO_DEF.has(normalizeMimeType(mimeType));
}

export function uploadFormatForMime(mimeType: string): UploadFormatDefinition | undefined {
  return MIME_TO_DEF.get(normalizeMimeType(mimeType));
}

export function mimeFromFilename(filename: string): string | undefined {
  const lower = filename.trim().toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot < 0) return undefined;
  return EXT_TO_MIME.get(lower.slice(dot));
}

export function uploadAcceptAttribute(): string {
  const mimes = [...new Set(UPLOAD_FORMAT_DEFINITIONS.map((d) => d.mime))];
  const exts = [
    ...new Set(UPLOAD_FORMAT_DEFINITIONS.flatMap((d) => d.extensions.map((e) => e.slice(1)))),
  ];
  return [...mimes, ...exts.map((e) => `.${e}`)].join(',');
}

export function documentUsesPdfPreview(
  mimeType: string,
  hasStoredPreview: boolean
): boolean {
  const base = normalizeMimeType(mimeType);
  if (base === 'application/pdf' || base.startsWith('image/')) {
    return false;
  }
  if (hasStoredPreview) {
    return true;
  }
  return uploadFormatForMime(base)?.needsPdfPreview === true;
}

export function documentFormatBadge(mimeType: string, filename?: string): string {
  const fromMime = uploadFormatForMime(mimeType)?.badge;
  if (fromMime) return fromMime;
  const guessed = filename ? mimeFromFilename(filename) : undefined;
  if (guessed) {
    return uploadFormatForMime(guessed)?.badge ?? 'FILE';
  }
  if (mimeType.startsWith('image/')) return 'IMG';
  return 'FILE';
}

/** Resolve declared MIME (may be empty/wrong) using filename + optional magic sniff. */
export function resolveUploadMime(
  filename: string,
  declaredMime: string | null | undefined,
  buffer?: Uint8Array,
  sniff?: (payload: Uint8Array, name: string) => string | null
): string | null {
  const normalized = declaredMime ? normalizeMimeType(declaredMime) : '';
  if (normalized && isAllowedUploadMime(normalized)) {
    return normalized;
  }
  const fromName = mimeFromFilename(filename);
  if (fromName) {
    return fromName;
  }
  if (buffer && sniff) {
    const fromMagic = sniff(buffer, filename);
    if (fromMagic && isAllowedUploadMime(fromMagic)) {
      return fromMagic;
    }
  }
  return null;
}
