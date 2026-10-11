// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

function readObjectField(obj: object, key: string): unknown {
  return Reflect.get(obj, key);
}

/** Read a boolean navigation flag from react-router `location.state`. */
export function readLocationStateBoolean(state: unknown, key: string): boolean {
  if (typeof state !== 'object' || state === null) {
    return false;
  }
  if (!Object.hasOwn(state, key)) {
    return false;
  }
  return readObjectField(state, key) === true;
}

export function readLocationStateNumber(state: unknown, key: string): number | undefined {
  if (typeof state !== 'object' || state === null) {
    return undefined;
  }
  if (!Object.hasOwn(state, key)) {
    return undefined;
  }
  const value: unknown = readObjectField(state, key);
  return typeof value === 'number' ? value : undefined;
}

export function readLocationStateString(state: unknown, key: string): string | undefined {
  if (typeof state !== 'object' || state === null) {
    return undefined;
  }
  if (!Object.hasOwn(state, key)) {
    return undefined;
  }
  const value: unknown = readObjectField(state, key);
  return typeof value === 'string' ? value : undefined;
}
