// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNodeTypeScriptConfig } from '@docuvate/eslint-config/node';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default createNodeTypeScriptConfig({
  tsconfigRootDir,
  files: ['src/**/*.ts', 'test/**/*.ts'],
  ignores: ['dist/**', 'coverage/**', 'scripts/**', 'eslint.config.mjs'],
});
