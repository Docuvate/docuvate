// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReactTypeScriptConfig } from '@docuvate/eslint-config/react';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...createReactTypeScriptConfig({
    tsconfigRootDir,
    ignores: ['dist/**', 'coverage/**', 'public/**', 'scripts/**', 'eslint.config.mjs'],
  }),
  {
    files: ['src/lib/api.ts'],
    rules: {
      // OpenAPI-backed JSON boundary; runtime shape validated by the API.
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
    },
  },
];
