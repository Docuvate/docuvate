// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { createStrictTypeCheckedConfig } from './index.js';

/**
 * @param {object} options
 * @param {string} options.tsconfigRootDir Absolute path to the web app root.
 * @param {string[]} [options.ignores]
 */
export function createReactTypeScriptConfig(options) {
  const reactRules = {
    ...reactHooks.configs.recommended.rules,
    ...jsxA11y.configs.recommended.rules,
  };

  return createStrictTypeCheckedConfig({
    tsconfigRootDir: options.tsconfigRootDir,
    ignores: options.ignores,
    globals: {
      ...globals.browser,
      ...globals.vitest,
    },
    extraRules: reactRules,
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
  });
}

