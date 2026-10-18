// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Lab CE chat probes: questions and expected substrings come only from env or a local file
 * (never committed). See docs/local-ci.md for DOCUVATE_LAB_PROBE_FILE / DOCUVATE_LAB_PROBE_JSON.
 */
import { readFileSync } from 'node:fs';

/**
 * @typedef {object} LabCeProbe
 * @property {string} key
 * @property {string} title
 * @property {string} question
 * @property {string[]} expectContainsAny
 * @property {string[]} [filenamePatternRegexes]
 */

/**
 * @returns {LabCeProbe[]}
 */
export function loadLabCeProbes() {
  const fromEnv = process.env.DOCUVATE_LAB_PROBE_JSON?.trim();
  const fromFile = process.env.DOCUVATE_LAB_PROBE_FILE?.trim();
  let raw = fromEnv;
  if (!raw && fromFile) {
    raw = readFileSync(fromFile, 'utf8');
  }
  if (!raw) {
    return [];
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('lab probe config must be a JSON array');
  }
  /** @type {LabCeProbe[]} */
  const probes = [];
  for (const row of parsed) {
    if (typeof row !== 'object' || row === null) {
      throw new Error('lab probe entry must be an object');
    }
    const key = String(row.key ?? '').trim();
    const title = String(row.title ?? '').trim();
    const question = String(row.question ?? '').trim();
    const expectContainsAny = Array.isArray(row.expectContainsAny)
      ? row.expectContainsAny.map((v) => String(v))
      : [];
    if (!key || !title || !question || expectContainsAny.length === 0) {
      throw new Error(`invalid lab probe entry: ${JSON.stringify(row)}`);
    }
    const filenamePatternRegexes = Array.isArray(row.filenamePatternRegexes)
      ? row.filenamePatternRegexes.map((v) => String(v))
      : undefined;
    probes.push({ key, title, question, expectContainsAny, filenamePatternRegexes });
  }
  return probes;
}

/**
 * @param {string} haystack
 * @param {string[]} needles
 */
export function answerMatchesExpectations(haystack, needles) {
  for (const needle of needles) {
    if (haystack.includes(needle)) {
      return true;
    }
  }
  return false;
}

/**
 * @param {Map<string, string>} filenamesByDoc
 * @param {{ documentId: string }[]} citations
 * @param {string[] | undefined} patternRegexes
 */
export function citationsMatchFilenamePatterns(filenamesByDoc, citations, patternRegexes) {
  if (!patternRegexes || patternRegexes.length === 0) {
    return true;
  }
  const regexes = patternRegexes.map((source) => new RegExp(source, 'i'));
  for (const citation of citations) {
    const filename = filenamesByDoc.get(citation.documentId) ?? '';
    if (regexes.some((re) => re.test(filename))) {
      return true;
    }
  }
  return false;
}
