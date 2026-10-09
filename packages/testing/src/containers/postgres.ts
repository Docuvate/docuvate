// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export type StartedPostgres = {
  container: StartedPostgreSqlContainer;
  url: string;
  stop: () => Promise<void>;
};

import { POSTGRES_IMAGE } from '../container-images.js';

export async function startPostgresContainer(options?: {
  image?: string;
  database?: string;
  username?: string;
  password?: string;
}): Promise<StartedPostgres> {
  const database = options?.database ?? 'docuvate';
  const username = options?.username ?? 'docuvate';
  const password = options?.password ?? 'docuvate';
  const container = await new PostgreSqlContainer(options?.image ?? POSTGRES_IMAGE)
    .withDatabase(database)
    .withUsername(username)
    .withPassword(password)
    .start();
  const url = container.getConnectionUri();
  return {
    container,
    url,
    stop: async () => {
      await container.stop();
    },
  };
}
