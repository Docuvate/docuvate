/** Quote-aware tokenizer and value helpers for the library filter query mini-language. */

export function unescapeFilterQuotedValue(value: string): string {
  let out = '';
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === '\\' && i + 1 < value.length) {
      out += value[i + 1];
      i += 1;
    } else {
      out += ch;
    }
  }
  return out;
}

export function escapeFilterQuotedValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function quoteFilterValueIfNeeded(value: string): string {
  if (/[\s"]/.test(value)) {
    return `"${escapeFilterQuotedValue(value)}"`;
  }
  return value;
}

export function parseFilterTokenValue(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return unescapeFilterQuotedValue(trimmed.slice(1, -1));
  }
  return trimmed;
}

function readQuotedSegment(source: string, startIndex: number): { value: string; nextIndex: number } {
  let i = startIndex + 1;
  let buf = '';
  while (i < source.length && source[i] !== '"') {
    if (source[i] === '\\' && i + 1 < source.length) {
      buf += source[i + 1];
      i += 2;
    } else {
      buf += source[i];
      i += 1;
    }
  }
  if (i < source.length && source[i] === '"') {
    i += 1;
  }
  return { value: buf, nextIndex: i };
}

export function tokenizeDocumentFilterQuery(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const source = input.trim();

  while (i < source.length) {
    while (i < source.length && source[i] === ' ') {
      i += 1;
    }
    if (i >= source.length) {
      break;
    }

    if (source[i] === '"') {
      const { value, nextIndex } = readQuotedSegment(source, i);
      tokens.push(value);
      i = nextIndex;
      continue;
    }

    let buf = '';
    while (i < source.length && source[i] !== ' ') {
      buf += source[i];
      i += 1;
      const colonIndex = buf.indexOf(':');
      if (colonIndex > 0 && i < source.length && source[i] === '"') {
        const { value, nextIndex } = readQuotedSegment(source, i);
        buf += `"${value}"`;
        i = nextIndex;
        break;
      }
    }

    if (buf.length > 0) {
      tokens.push(buf);
    }
  }

  return tokens;
}
