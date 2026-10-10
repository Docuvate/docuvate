// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import globals from 'globals';
import { createStrictTypeCheckedConfig } from './index.js';

/**
 * @param {object} options
 * @param {string} options.tsconfigRootDir Absolute path to the package root (app or library).
 * @param {string[]} [options.ignores]
 */
export function createNodeTypeScriptConfig(options) {
  return createStrictTypeCheckedConfig({
    tsconfigRootDir: options.tsconfigRootDir,
    ignores: options.ignores,
    globals: {
      ...globals.node,
      ...globals.vitest,
    },
  });
}
