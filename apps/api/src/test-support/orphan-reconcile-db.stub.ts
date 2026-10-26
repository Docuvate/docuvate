// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { QueryResult } from 'pg';
import { vi } from 'vitest';

import type { OrphanReconcileDbPort } from '../modules/documents/domain/orphan-reconcile-db.port.js';

export function createOrphanReconcileDbStub(
  overrides: Partial<OrphanReconcileDbPort> = {}
): OrphanReconcileDbPort {
  return {
    query: vi.fn(() =>
      Promise.resolve({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } satisfies QueryResult)
    ),
    ...overrides,
  };
}
