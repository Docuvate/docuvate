import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const baseline = JSON.parse(
  readFileSync(resolve(process.cwd(), 'docs/testing/doctor-baseline.json'), 'utf8')
);

function runCommand(command, cwd) {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
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

function run(name, cfg) {
  const cwd = name === 'fastapi' ? resolve(process.cwd(), cfg.path) : process.cwd();
  const res = runCommand(cfg.command, cwd);
  const out = res.output;
  let score;
  if (name === 'nestjs') {
    score = parseNestjsScore(out);
  } else if (name === 'react') {
    score = parseReactScore(out);
  } else {
    score = Number(out.trim().split('\n').pop());
  }
  if (Number.isNaN(score)) {
    console.error(`Could not parse ${name} doctor score`);
    printDiagnostics(name, cfg.command, cwd, res);
    process.exit(1);
  }
  if (score < cfg.baselineScore) {
    console.error(
      `${name} doctor regressed: ${score} < baseline ${cfg.baselineScore} (target ${baseline.targetMinScore})`
    );
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
