// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

type HttpUrlInputResult =
  | { ok: true; href: string }
  | { ok: false; reason: 'empty' | 'invalid' };

/**
 * Client-side gate for connector URL fields: require an absolute http(s) URL
 * with a host, before we call the API (which would otherwise surface as
 * "unreachable").
 */
export function validateHttpUrlInput(raw: string): HttpUrlInputResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'invalid' };
  }
  if (parsed.hostname.trim().length === 0) {
    return { ok: false, reason: 'invalid' };
  }
  return { ok: true, href: parsed.href };
}
