// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function recordFromUnknown(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) {
    return null;
  }
  return value;
}

export function parseString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return '';
  }
  return '';
}

export function parseOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return parseString(value);
}

export function parseNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === 1 || value === '1') {
    return true;
  }
  if (value === 'false' || value === 0 || value === '0') {
    return false;
  }
  return Boolean(value);
}

export function parseDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(parseString(value));
}

export function parseOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  return parseDate(value);
}

export function parseJsonString(value: string): unknown {
  return JSON.parse(value);
}

export function requireRecord(value: unknown): Record<string, unknown> {
  const row = recordFromUnknown(value);
  if (!row) {
    throw new Error('Expected database row object');
  }
  return row;
}

export function parseEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof value !== 'string') {
    return fallback;
  }
  for (const item of allowed) {
    if (item === value) {
      return item;
    }
  }
  return fallback;
}

export function parseOptionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | null {
  if (typeof value !== 'string') {
    return null;
  }
  for (const item of allowed) {
    if (item === value) {
      return item;
    }
  }
  return null;
}

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      out.push(item);
    }
  }
  return out;
}
