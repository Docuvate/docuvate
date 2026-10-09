// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface StreamedCitedClaimJson {
  text: string;
  source: string;
  quote: string;
}

function unescapeJsonString(fragment: string): string {
  return fragment
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function readJsonStringValue(raw: string, startQuoteIndex: number): { value: string; endIndex: number } | null {
  let i = startQuoteIndex + 1;
  let escaped = false;
  const start = i;
  for (; i < raw.length; i += 1) {
    const ch = raw[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      return { value: unescapeJsonString(raw.slice(start, i)), endIndex: i };
    }
  }
  return null;
}

function readStringField(objectSlice: string, field: string): string | null {
  const marker = `"${field}"`;
  const idx = objectSlice.indexOf(marker);
  if (idx < 0) {
    return null;
  }
  let i = idx + marker.length;
  while (i < objectSlice.length && /[\s:]/.test(objectSlice[i])) {
    i += 1;
  }
  if (objectSlice[i] !== '"') {
    return null;
  }
  const parsed = readJsonStringValue(objectSlice, i);
  return parsed?.value ?? null;
}

/**
 * Extracts fully closed claim objects from partial cited-answer JSON (streaming).
 */
export function extractCompleteCitedClaims(partialJson: string): StreamedCitedClaimJson[] {
  const claims: StreamedCitedClaimJson[] = [];
  const marker = '{';
  let cursor = partialJson.indexOf('"claims"');
  if (cursor < 0) {
    return claims;
  }
  cursor = partialJson.indexOf('[', cursor);
  if (cursor < 0) {
    return claims;
  }
  cursor += 1;

  while (cursor < partialJson.length) {
    while (cursor < partialJson.length && /[\s,]/.test(partialJson[cursor])) {
      cursor += 1;
    }
    if (cursor >= partialJson.length || partialJson[cursor] === ']') {
      break;
    }
    if (partialJson[cursor] !== marker) {
      break;
    }
    const objStart = cursor;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let objEnd = -1;
    for (let i = cursor; i < partialJson.length; i += 1) {
      const ch = partialJson[i];
      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === '{') {
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          objEnd = i;
          break;
        }
      }
    }
    if (objEnd < 0) {
      break;
    }
    const objectSlice = partialJson.slice(objStart, objEnd + 1);
    const text = readStringField(objectSlice, 'text');
    const source = readStringField(objectSlice, 'source');
    const quote = readStringField(objectSlice, 'quote');
    if (text != null && source != null && quote != null) {
      claims.push({ text, source, quote });
    }
    cursor = objEnd + 1;
  }

  return claims;
}
