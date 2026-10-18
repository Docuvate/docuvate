// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Fail CI when lab acceptance scripts embed expected document monetary literals.
 * Probes must load expected values from DOCUVATE_LAB_PROBE_FILE / DOCUVATE_LAB_PROBE_JSON only.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const TESTING_DIR = join(ROOT, 'scripts/testing');

const SELF = 'scripts/testing/check-lab-probes-no-embedded-values.mjs';
const PROBE_CONFIG = 'scripts/testing/lab-ce-probe-config.mjs';

/** German-style currency literal (thousands dot, decimal comma). */
const CURRENCY_LITERAL = /\d{1,3}\.\d{3},\d{2}/;

const LAB_PROBE_FILE =
  /^lab-ce-(acceptance|probe)|^lab-.*acceptance/i;

const EXPECTATION_HINT =
  /(?:includes\s*\(|expectContains|expectAnswerContains|quoteAmountOk|pass\s*:\s*\(|expectSubstrings|expectAnswerContainsAny|expectMinCitations)/;

function listLabProbeSources() {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(TESTING_DIR)) {
    const abs = join(TESTING_DIR, name);
    if (!statSync(abs).isFile()) continue;
    if (!/\.(ts|mjs|js|sh)$/.test(name)) continue;
    if (!LAB_PROBE_FILE.test(name)) continue;
    out.push(abs);
  }
  return out;
}

/** @type {string[]} */
const hits = [];

for (const abs of listLabProbeSources()) {
  const rel = relative(ROOT, abs).replaceAll('\\', '/');
  if (rel === SELF || rel === PROBE_CONFIG) continue;
  const lines = readFileSync(abs, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!CURRENCY_LITERAL.test(line)) continue;
    if (EXPECTATION_HINT.test(line) || line.includes('["') || line.includes("['")) {
      hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 140)}`);
    }
  }
}

if (hits.length > 0) {
  console.error(`check-lab-probes-no-embedded-values: ${hits.length} hit(s):`);
  for (const h of hits) {
    console.error(`  ${h}`);
  }
  process.exit(1);
}

console.log('check-lab-probes-no-embedded-values OK');
