// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface ResolvedWorkerModule {
  filename: string;
  execArgv?: string[];
}

export function resolveLabelHybridWorkerModule(workerBaseName: string): ResolvedWorkerModule {
  const jsPath = join(__dirname, `${workerBaseName}.js`);
  const tsPath = join(__dirname, `${workerBaseName}.ts`);
  if (existsSync(jsPath)) {
    return { filename: jsPath };
  }
  if (existsSync(tsPath)) {
    return { filename: tsPath, execArgv: ['--import', 'tsx'] };
  }
  return { filename: jsPath };
}
