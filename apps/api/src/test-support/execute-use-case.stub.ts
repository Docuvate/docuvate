// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

/** Minimal `{ execute }` test double for Nest use-case classes. */
export function createExecuteUseCaseStub<T extends { execute: (...args: never[]) => unknown }>(
  overrides: Partial<T> = {}
): T {
  return {
    execute: vi.fn(),
    ...overrides,
  } as T;
}

/** Structural test double when only a subset of methods is exercised. */
export function createClassStub<T>(methods: Partial<T>): T {
  return methods as T;
}
