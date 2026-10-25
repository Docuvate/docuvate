// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export function snapshotProcessEnv(keys: readonly string[]): Record<string, string | undefined> {
  const snap: Record<string, string | undefined> = {};
  for (const key of keys) {
    snap[key] = process.env[key];
  }
  return snap;
}

export function restoreProcessEnv(
  keys: readonly string[],
  snap: Record<string, string | undefined>
): void {
  for (const key of keys) {
    const value = snap[key];
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key);
    } else {
      process.env[key] = value;
    }
  }
}

export function clearProcessEnv(keys: readonly string[]): void {
  for (const key of keys) {
    Reflect.deleteProperty(process.env, key);
  }
}
