// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import fs from 'node:fs';
import path from 'node:path';

import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

interface ResultRow {
  title: string;
  project: string;
  status: 'passed' | 'failed' | 'blocked' | 'skipped';
  durationMs: number;
}

function classify(result: TestResult): ResultRow['status'] {
  const reason = `${result.error?.message ?? ''}\n${result.errors.map((entry) => entry.message).join('\n')}`;
  if (result.status === 'skipped' && reason.includes('BLOCKED:')) return 'blocked';
  if (result.status === 'skipped' || result.status === 'interrupted') return 'skipped';
  if (result.status === 'passed') return 'passed';
  return 'failed';
}

class MatrixReporter implements Reporter {
  private readonly rows: ResultRow[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    this.rows.push({
      title: test.title,
      project: test.parent.project()?.name ?? '',
      status: classify(result),
      durationMs: result.duration,
    });
  }

  onEnd(): void {
    const outputDir = path.join(process.cwd(), 'results');
    fs.mkdirSync(outputDir, { recursive: true });
    const summary = {
      generatedAt: new Date().toISOString(),
      baseURL: process.env.DOCUVATE_WEB_BASE_URL ?? 'http://127.0.0.1:5173',
      passed: this.rows.filter((row) => row.status === 'passed').length,
      failed: this.rows.filter((row) => row.status === 'failed').length,
      blocked: this.rows.filter((row) => row.status === 'blocked').length,
      skipped: this.rows.filter((row) => row.status === 'skipped').length,
      rows: this.rows,
    };
    fs.writeFileSync(
      path.join(outputDir, 'library-admin-audit-results.json'),
      `${JSON.stringify(summary, null, 2)}\n`
    );
  }
}

export default MatrixReporter;
