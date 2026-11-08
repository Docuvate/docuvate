import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const baseline = JSON.parse(
  readFileSync(resolve(process.cwd(), 'docs/testing/doctor-baseline.json'), 'utf8')
);

// Doctor CLIs colorize output when CI is set (picocolors enables ANSI colors for
// CI=true even without a TTY), which splits e.g. "100 / 100" into
// "\x1b[32m100\x1b[39m / 100". Strip escape sequences before parsing.
// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\x1b\[[0-9;?]*[ -\/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g;

function stripAnsi(text) {
  return text.replace(ANSI_PATTERN, '');
}

function runCommand(command, cwd) {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const stdout = stripAnsi(result.stdout ?? '');
  return {
    stdout,
    output: `${stdout}${stripAnsi(result.stderr ?? '')}`,
    status: result.status,
    signal: result.signal,
    error: result.error,
  };
}

function printDiagnostics(name, command, cwd, res) {
  const lines = res.output.split('\n');
  console.error(`--- ${name} doctor diagnostics ---`);
  console.error(`command: ${command}`);
  console.error(`cwd: ${cwd}`);
  console.error(`exit status: ${res.status}${res.signal ? ` (signal ${res.signal})` : ''}`);
  if (res.error) console.error(`spawn error: ${res.error.message}`);
  console.error(`last ${Math.min(40, lines.length)} of ${lines.length} output lines:`);
  console.error(lines.slice(-40).join('\n'));
  console.error(`--- end ${name} doctor diagnostics ---`);
}

function parseNestjsScore(output) {
  const m = output.match(/(\d+)\s*\/\s*100/);
  return m ? Number(m[1]) : NaN;
}

function parseReactScore(output) {
  const m = output.match(/Score:\s*(\d+)\s*\/\s*100/i);
  return m ? Number(m[1]) : NaN;
}

/** Last stdout line when it is a non-negative integer. Empty output is not 0. */
function parseScoreLine(stdout) {
  const line = stdout.trim().split('\n').pop() ?? '';
  if (!/^\d+$/.test(line)) return Number.NaN;
  return Number(line);
}

/** React Doctor prints `Bugs: N errors` and share URLs with `e=N`. */
function parseReactErrorCount(output) {
  const bugs = output.match(/Bugs:\s*(\d+)\s*errors/i);
  if (bugs) return Number(bugs[1]);
  const share = output.match(/[?&]e=(\d+)/);
  if (share) return Number(share[1]);
  return null;
}

function run(name, cfg) {
  const cwd = name === 'fastapi' ? resolve(process.cwd(), cfg.path) : process.cwd();
  let res = runCommand(cfg.command, cwd);
  const out = res.output;
  let score;
  if (name === 'nestjs') {
    score = parseNestjsScore(out);
  } else if (name === 'react') {
    score = parseReactScore(out);
    const errorCount = parseReactErrorCount(out);
    if (errorCount != null && errorCount > 0) {
      console.error(
        `react doctor reported ${errorCount} error(s); PR gate requires error count === 0`
      );
      printDiagnostics(name, cfg.command, cwd, res);
      process.exit(1);
    }
  } else {
    // `--score` prints only the number on stdout; uvx writes install progress
    // ("Installed 1 package in 4ms") to stderr on a cold cache, so read stdout.
    // An empty stdout is not a score: Number('') is 0, which would look like a
    // regression under the baseline. A failed download (HTTP 504) is the same.
    score = parseScoreLine(res.stdout);
    if (!Number.isInteger(score) || res.status !== 0) {
      const retry = runCommand(cfg.command, cwd);
      const retryScore = parseScoreLine(retry.stdout);
      if (Number.isInteger(retryScore) && retry.status === 0) {
        res = retry;
        score = retryScore;
      } else {
        console.error(`Could not parse ${name} doctor score`);
        printDiagnostics(name, cfg.command, cwd, res);
        printDiagnostics(name, cfg.command, cwd, retry);
        process.exit(1);
      }
    }
  }
  if (!Number.isInteger(score)) {
    console.error(`Could not parse ${name} doctor score`);
    printDiagnostics(name, cfg.command, cwd, res);
    process.exit(1);
  }
  if (score < cfg.baselineScore) {
    console.error(
      `${name} doctor regressed: ${score} < baseline ${cfg.baselineScore} (target ${baseline.targetMinScore})`
    );
    if (score === 0) printDiagnostics(name, cfg.command, cwd, res);
    process.exit(1);
  }
  console.log(`${name} doctor OK: ${score} (baseline ${cfg.baselineScore}, target ${baseline.targetMinScore})`);
  if (score < baseline.targetMinScore) {
    console.warn(
      `::warning title=Doctor below target::${name} score ${score} is below target ${baseline.targetMinScore} (baseline gate passed; follow-up PR recommended)`
    );
  }
}

for (const [name, cfg] of Object.entries(baseline.packages)) {
  run(name, cfg);
}
