// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import js from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

/** Docuvate strict TypeScript ESLint rules layered on typescript-eslint strict presets. */
export const docuvateStrictRules = {
  '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
};

const defaultIgnores = ['**/dist/**', '**/node_modules/**', '**/coverage/**'];

/**
 * Strict type-checked ESLint flat config. Limit lint targets via the ESLint CLI `files` globs.
 * @param {object} options
 * @param {string} options.tsconfigRootDir Package root (directory containing tsconfig.eslint.json).
 * @param {string[]} [options.ignores]
 * @param {string} [options.tsconfigEslintPath]
 * @param {import('@typescript-eslint/utils').TSESLint.FlatConfig.LanguageOptions['globals']} options.globals
 * @param {Record<string, unknown>} [options.extraRules]
 * @param {Record<string, unknown>} [options.plugins]
 */
export function createStrictTypeCheckedConfig(options) {
  return tseslint.config(
    {
      ignores: [...defaultIgnores, ...(options.ignores ?? [])],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          project: options.tsconfigEslintPath ?? './tsconfig.eslint.json',
          tsconfigRootDir: options.tsconfigRootDir,
        },
        globals: options.globals,
      },
      plugins: {
        'simple-import-sort': simpleImportSort,
        ...(options.plugins ?? {}),
      },
      rules: {
        ...docuvateStrictRules,
        ...(options.extraRules ?? {}),
      },
    }
  );
}
