// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * Registers a window keydown listener with the same typing pattern as pre-strict-lint main.
 * Isolated so GlobalSearch keeps main runtime behavior under strict ESLint.
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
export function addWindowKeydownListener(
  listener: (event: globalThis.KeyboardEvent) => void
): () => void {
  const onKeyDown = listener;
  window.addEventListener('keydown', onKeyDown as unknown as EventListener);
  return () => {
    window.removeEventListener('keydown', onKeyDown as unknown as EventListener);
  };
}
