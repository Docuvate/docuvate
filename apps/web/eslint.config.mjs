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
  {
    files: ['src/components/search/GlobalSearch.tsx'],
    rules: {
      // Modal palette: backdrop click-to-close and dialog key handling match main UX.
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
    },
  },
];
