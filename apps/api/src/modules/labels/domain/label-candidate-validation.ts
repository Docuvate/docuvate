// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const MAX_AD_HOC_LABEL_LEN = 40;

const PDF_PRODUCER_DENY_FRAGMENTS = [
  'pdf-xchange',
  'pdf xchange',
  'adobe',
  'microsoft print',
  'foxit',
  'nitro pdf',
  'pdfelement',
  'creator',
  'producer',
  'ghostscript',
  'wkhtmltopdf',
  'libreoffice',
  'openoffice',
  'pdftk',
  'prince',
  'scanSnap',
  'scansnap',
] as const;

function hasRepeatedToken(name: string): boolean {
  const tokens = name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length < 2) {
    return false;
  }
  return new Set(tokens).size < tokens.length;
}

function isDenyListedProducerOrMetadata(name: string): boolean {
  const key = name.trim().toLowerCase();
  if (!key) {
    return true;
  }
  return PDF_PRODUCER_DENY_FRAGMENTS.some((frag) => key.includes(frag));
}

function isLikelyEmailOrUrl(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.includes('@') || /https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed);
}

function isPureNumeric(name: string): boolean {
  return /^[\d\s.,+\-/]+$/.test(name.trim());
}

export function isAcceptableLabelCandidate(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return false;
  }
  if (trimmed.length > MAX_AD_HOC_LABEL_LEN) {
    return false;
  }
  if (trimmed.split(/\s+/).length > 4) {
    return false;
  }
  if (isDenyListedProducerOrMetadata(trimmed)) {
    return false;
  }
  if (isLikelyEmailOrUrl(trimmed)) {
    return false;
  }
  if (isPureNumeric(trimmed)) {
    return false;
  }
  if (hasRepeatedToken(trimmed)) {
    return false;
  }
  if (/^\d{5,}/.test(trimmed)) {
    return false;
  }
  return true;
}
