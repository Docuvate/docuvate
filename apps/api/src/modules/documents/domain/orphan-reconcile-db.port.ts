// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { QueryResult } from 'pg';

export interface OrphanReconcileDbPort {
  query(queryText: string, values?: unknown[]): Promise<QueryResult>;
}
