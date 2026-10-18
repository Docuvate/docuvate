/** Shared rules for Docuvate SPDX header tooling (Community Edition repository only). */

export const ROOT = new URL('../..', import.meta.url).pathname;

export const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.venv',
  '.nx',
  'generated',
]);

export const SKIP_FILE_SUFFIXES = ['.g.dart', '.d.ts.map'];

export const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.py']);

export const SCAN_ROOTS = [
  'apps/api/src',
  'apps/web/src',
  'apps/worker/src',
  'apps/site/src',
  'packages/sdk-node/src',
  'packages/sdk-flutter/lib',
  'packages/contracts/src',
  'packages/tokens/src',
  'packages/otel/src',
  'packages/ui-catalog/src',
  'packages/testing/src',
];

export const MIT_PATH_PREFIXES = [
  'packages/sdk-node/',
  'packages/sdk-flutter/lib/',
];

export function licenseIdForPath(relPath) {
  if (MIT_PATH_PREFIXES.some((prefix) => relPath.startsWith(prefix))) {
    return 'MIT';
  }
  return 'LicenseRef-Docuvate-SUL-1.0';
}

export function headerLines(relPath) {
  const licenseId = licenseIdForPath(relPath);
  const isPython = relPath.endsWith('.py');
  const prefix = isPython ? '#' : '//';
  return [
    `${prefix} SPDX-FileCopyrightText: 2026 Thomas Faust`,
    `${prefix} SPDX-License-Identifier: ${licenseId}`,
    isPython ? '' : undefined,
  ].filter((line) => line !== undefined);
}
