// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sizeCeilingRules } from '@docuvate/eslint-config';
import { createNodeTypeScriptConfig } from '@docuvate/eslint-config/node';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...createNodeTypeScriptConfig({
    tsconfigRootDir,
    files: ['src/**/*.ts', 'test/**/*.ts'],
    ignores: ['dist/**', 'coverage/**', 'scripts/**', 'eslint.config.mjs'],
  }),
  {
    // Ratchet at today's worst offenders (cited-chat-generation.service, documents.controller).
    rules: sizeCeilingRules({
      complexity: 133,
      maxLines: 1095,
      maxLinesPerFunction: 827,
      maxParams: 41,
    }),
  },
  {
    files: [
      'src/test-support/**/*.ts',
      'src/shared/infrastructure/database/pg-pool.spec-util.ts',
      'src/shared/infrastructure/auth/nest-execution-context.spec-util.ts',
    ],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
];
