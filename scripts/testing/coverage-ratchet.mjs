import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TOLERANCE = 0.001;
const baselinePath = resolve(process.cwd(), 'docs/testing/coverage-baseline.json');

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

function readPct(summaryPath) {
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const total = summary.total;
  if (!total?.lines?.pct && total?.lines?.pct !== 0) {
    throw new Error(`Missing lines.pct in ${summaryPath}`);
  }
  return total.lines.pct / 100;
}

const checks = [
  { key: 'api', path: 'apps/api/coverage/coverage-summary.json' },
  { key: 'web', path: 'apps/web/coverage/coverage-summary.json' },
];

let failed = false;
for (const { key, path } of checks) {
  const current = readPct(resolve(process.cwd(), path));
  const floor = baseline[key].lines - TOLERANCE;
  if (current + 1e-9 < floor) {
    console.error(
      `Coverage ratchet failed for ${key}: ${(current * 100).toFixed(2)}% < baseline ${(baseline[key].lines * 100).toFixed(2)}% (tolerance ${TOLERANCE * 100}%)`
    );
    failed = true;
  } else {
    console.log(
      `Coverage OK ${key}: ${(current * 100).toFixed(2)}% (baseline ${(baseline[key].lines * 100).toFixed(2)}%)`
    );
  }
}

if (failed) {
  process.exit(1);
}
