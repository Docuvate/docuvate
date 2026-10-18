// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import pg from 'pg';
import { vi } from 'vitest';

const STUB_CONNECTION_STRING = 'postgresql://127.0.0.1:1/docuvate_test_stub';

/** In-memory pool stub backed by a real `pg.Pool` instance (no TCP) with overridden methods. */
export function stubPgPool(overrides: {
  query?: pg.Pool['query'];
  connect?: pg.Pool['connect'];
}): pg.Pool {
  const pool = new pg.Pool({ connectionString: STUB_CONNECTION_STRING });
  if (overrides.query !== undefined) {
    pool.query = overrides.query;
  }
  if (overrides.connect !== undefined) {
    pool.connect = overrides.connect;
  }
  return pool;
}

export function createStubPoolClient(handlers: {
  query: pg.PoolClient['query'];
  release?: pg.PoolClient['release'];
}): pg.PoolClient {
  return {
    query: handlers.query,
    release: handlers.release ?? (() => undefined),
  } as pg.PoolClient;
}

export function stubPgPoolWithClient(client: pg.PoolClient): pg.Pool {
  const pool = new pg.Pool({ connectionString: STUB_CONNECTION_STRING });
  pool.connect = () => Promise.resolve(client);
  return pool;
}

export function createStubPoolClientWithQueryMock(
  queryMock: ReturnType<typeof vi.fn>
): { client: pg.PoolClient; queryMock: ReturnType<typeof vi.fn> } {
  const client = createStubPoolClient({
    query: queryMock as pg.PoolClient['query'],
    release: vi.fn(),
  });
  return { client, queryMock };
}

/** Pool stub that routes both `pool.query` and transactional `pool.connect()` to the same query mock. */
export function stubPgPoolWithQueryMock(queryMock: ReturnType<typeof vi.fn>): pg.Pool {
  const { client } = createStubPoolClientWithQueryMock(queryMock);
  return stubPgPool({
    query: queryMock as pg.PoolClient['query'],
    connect: () => Promise.resolve(client),
  });
}
