// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import fs from 'node:fs/promises';
import path from 'node:path';

import { auditArtifactRoot } from './ce-ui-audit.js';

export type CeUiAuditEntry = {
  screen: string;
  path: string;
  locale: string;
  theme: string;
  viewport: string;
  screenshot: string;
  rawI18nSnippets: string[];
  consoleErrors: string[];
  failedRequests: string[];
  notes: string[];
};

const reportPath = (): string => path.join(auditArtifactRoot(), 'audit-report.json');

export async function appendAuditEntry(entry: CeUiAuditEntry): Promise<void> {
  const file = reportPath();
  let existing: CeUiAuditEntry[] = [];
  try {
    const raw = await fs.readFile(file, 'utf8');
    existing = JSON.parse(raw) as CeUiAuditEntry[];
  } catch {
    existing = [];
  }
  existing.push(entry);
  await fs.mkdir(auditArtifactRoot(), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
}

export async function clearAuditReport(): Promise<void> {
  await fs.mkdir(auditArtifactRoot(), { recursive: true });
  await fs.writeFile(reportPath(), '[]\n', 'utf8');
}
