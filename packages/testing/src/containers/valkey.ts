// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { GenericContainer, Wait } from 'testcontainers';
import { VALKEY_IMAGE } from '../container-images.js';

export type StartedValkey = {
  url: string;
  host: string;
  port: number;
  stop: () => Promise<void>;
};

/** Valkey (Redis-compatible) for queue/cache adapter integration tests. */
export async function startValkeyContainer(image = VALKEY_IMAGE): Promise<StartedValkey> {
  const container = await new GenericContainer(image)
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
    .start();
  const host = container.getHost();
  const port = container.getMappedPort(6379);
  return {
    host,
    port,
    url: `redis://${host}:${port}`,
    stop: async () => {
      await container.stop();
    },
  };
}
