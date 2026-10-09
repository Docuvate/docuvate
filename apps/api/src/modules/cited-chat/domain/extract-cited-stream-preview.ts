// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Human-readable preview from partial Ollama cited-answer JSON (never show raw JSON in UI). */

function unescapeJsonStringFragment(fragment: string): string {
  return fragment
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Extracts completed `claims[].text` string values from a partial JSON response.
 * Incomplete trailing strings are ignored.
 */
export function extractReadableCitedAnswerPreview(partialJson: string): string {
  const texts: string[] = [];
  const marker = '"text"';
  let cursor = 0;

  while (cursor < partialJson.length) {
    const idx = partialJson.indexOf(marker, cursor);
    if (idx < 0) {
      break;
    }
    let i = idx + marker.length;
    while (i < partialJson.length && /[\s:]/.test(partialJson[i])) {
      i += 1;
    }
    if (partialJson[i] !== '"') {
      cursor = idx + 1;
      continue;
    }
    i += 1;
    const start = i;
    let escaped = false;
    let closed = false;
    for (; i < partialJson.length; i += 1) {
      const ch = partialJson[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        closed = true;
        break;
      }
    }
    if (!closed) {
      break;
    }
    const fragment = partialJson.slice(start, i);
    texts.push(unescapeJsonStringFragment(fragment));
    cursor = i + 1;
  }

  return texts.join(' ').trim();
}

/** True when content looks like cited-answer JSON rather than user-facing text. */
export function looksLikeCitedAnswerJson(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('{') && trimmed.includes('"claims"');
}
