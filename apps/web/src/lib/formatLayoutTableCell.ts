// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const GREEK_LETTER = /[\u03B1-\u03C9\u03A0-\u03A9]/u;
const SINGLE_CAPITAL = /[A-Z\u03A0-\u03A9]/;

/**
 * Merges PDF text-run spacing artifacts in table cells (subscripts, inline math fragments).
 * Does not alter normal prose, page numbers, or German decimal commas.
 */
export function formatLayoutTableCell(raw: string): string {
  let text = raw.replace(/\s+/g, ' ').trim();
  if (!text) {
    return '';
  }

  text = text.replace(/\s*,\s*/g, (full, offset, string) => {
    const left = string.charAt(offset - 1);
    const right = string.charAt(offset + full.length);
    if (/\d/u.test(left) && /\d/u.test(right)) {
      return ',';
    }
    return ', ';
  });
  text = text.replace(/\s*;\s*/g, '; ');

  text = mergeLetterPairFragments(text);
  text = mergeDetachedSubscripts(text);

  text = text.replace(/\s{2,}/g, ' ');
  return text.trim();
}

function mergeLetterPairFragments(text: string): string {
  return text.replace(/, ([a-z]) ([a-z])(?=\s|$)/gu, ', $1$2');
}

function mergeDetachedSubscripts(text: string): string {
  let out = '';
  let index = 0;
  while (index < text.length) {
    const spaceStart = findSpaceRunStart(text, index);
    if (spaceStart === -1) {
      out += text.slice(index);
      break;
    }
    out += text.slice(index, spaceStart);
    const spaceEnd = findSpaceRunEnd(text, spaceStart);
    const before = out.at(-1) ?? '';
    const subscript = readSubscriptToken(text, spaceEnd, before);
    if (before && subscript && shouldMergeSubscript(before, subscript)) {
      out += subscript;
      index = spaceEnd + subscript.length;
      continue;
    }
    out += text.slice(spaceStart, spaceEnd);
    index = spaceEnd;
  }
  return out;
}

function findSpaceRunStart(text: string, from: number): number {
  const at = text.indexOf(' ', from);
  return at;
}

function findSpaceRunEnd(text: string, from: number): number {
  let end = from;
  while (end < text.length && text[end] === ' ') {
    end += 1;
  }
  return end;
}

function readSubscriptToken(text: string, from: number, before: string): string | null {
  const rest = text.slice(from);
  const lowercase = /^([a-z]{1,2})(?=\s|$|,|;|\))/u.exec(rest);
  if (lowercase) {
    return lowercase[1];
  }
  if (GREEK_LETTER.test(before)) {
    const uppercase = /^([A-Z])(?=\s|$|,|;|\))/u.exec(rest);
    if (uppercase) {
      return uppercase[1];
    }
  }
  return null;
}

function shouldMergeSubscript(before: string, subscript: string): boolean {
  if (before === ')') {
    return true;
  }
  if (GREEK_LETTER.test(before)) {
    return true;
  }
  if (SINGLE_CAPITAL.test(before) && /^[a-z]+$/u.test(subscript)) {
    return true;
  }
  return false;
}
