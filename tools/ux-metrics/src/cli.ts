import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { runUxMetrics } from './collect/runner.js';
import {
  buildDefaultBudgetEntries,
  flattenReportForBudgets,
  runFullGateCheck,
  type UxBudgetsFile,
} from './metrics/budget-check.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.join(__dirname, '..');

function parseArgs(argv: string[]) {
  const check = argv.includes('--check');
  const updateBaseline = argv.includes('--update-baseline');
  const skipSeed = argv.includes('--skip-seed');
  const webBase =
    argv.find((a) => a.startsWith('--web='))?.split('=')[1] ??
    process.env.WEB_BASE ??
    'http://localhost:5173';
  return { check, updateBaseline, skipSeed, webBase };
}

async function runSeed(skipLabelsSeed: boolean): Promise<{
  email: string;
  password: string;
  sampleDocumentTitle: string;
  sampleDocumentId: string;
  metricsFolderName: string;
}> {
  const seedScript = path.join(PACKAGE_ROOT, 'seed.mjs');
  const out = execSync(`node ${seedScript}`, {
    cwd: path.join(PACKAGE_ROOT, '../..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(skipLabelsSeed ? { SKIP_LABELS_SEED: '1' } : {}),
    },
  });
  const line = out.trim().split('\n').filter(Boolean).pop();
  if (!line) {
    throw new Error('ux-metrics seed produced no JSON line');
  }
  return JSON.parse(line) as {
    email: string;
    password: string;
    sampleDocumentTitle: string;
    sampleDocumentId: string;
    metricsFolderName: string;
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const budgetsPath = path.join(PACKAGE_ROOT, 'ux-budgets.json');
  const baselinePath = path.join(PACKAGE_ROOT, 'baseline', 'ux-metrics-baseline.json');
  const baselineDir = path.join(PACKAGE_ROOT, 'baseline');
  const artifactDir = path.join(PACKAGE_ROOT, 'output');

  let email = process.env.SEED_EMAIL ?? 'katalog.metrik@lokal.invalid';
  let password = process.env.SEED_PASSWORD ?? 'MetrikLauf7!';
  let seed = {
    sampleDocumentTitle: 'Finanzplan Muster GmbH.pdf',
    sampleDocumentId: '',
    metricsFolderName: 'Metrik Ablage',
  };

  const seeded = await runSeed(args.skipSeed);
  email = seeded.email;
  password = seeded.password;
  seed = {
    sampleDocumentTitle: seeded.sampleDocumentTitle,
    sampleDocumentId: seeded.sampleDocumentId,
    metricsFolderName: seeded.metricsFolderName,
  };
  if (!seed.sampleDocumentId) {
    throw new Error('No sampleDocumentId from seed; run without --skip-seed once.');
  }

  await fs.mkdir(artifactDir, { recursive: true });
  const screenshotDir = args.updateBaseline
    ? path.join(baselineDir, 'screenshots')
    : path.join(artifactDir, 'screenshots');
  const reportMdPath = args.updateBaseline
    ? path.join(baselineDir, 'ux-metrics-report.md')
    : path.join(artifactDir, 'ux-metrics-report.md');

  const report = await runUxMetrics({
    webBase: args.webBase,
    email,
    password,
    seed,
    outDir: artifactDir,
    reportMdPath,
    screenshotDir,
  });

  const flat = flattenReportForBudgets(report);
  const budgets = JSON.parse(await fs.readFile(budgetsPath, 'utf8')) as UxBudgetsFile;

  if (args.updateBaseline) {
    await fs.mkdir(path.dirname(baselinePath), { recursive: true });
    await fs.writeFile(baselinePath, `${JSON.stringify(flat, null, 2)}\n`, 'utf8');
    const merged = {
      ...budgets,
      metrics: buildDefaultBudgetEntries(report, budgets),
    };
    await fs.writeFile(budgetsPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    console.log(`Baseline updated at ${baselinePath}`);
    console.log(`Budget keys refreshed in ${budgetsPath}`);
    console.log(`Report markdown at ${reportMdPath}`);
  }

  if (args.check) {
    const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8')) as Record<string, number>;
    const regressions = runFullGateCheck(budgets, baseline, flat);
    if (regressions.length > 0) {
      console.error('UX budget regressions:');
      for (const r of regressions) {
        console.error(`- ${r.metricKey}: ${r.message} (baseline=${r.baseline}, current=${r.current})`);
      }
      process.exit(1);
    }
    console.log('UX budgets: OK');
  }

  console.log(`Wrote ${path.join(artifactDir, 'ux-metrics.json')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
