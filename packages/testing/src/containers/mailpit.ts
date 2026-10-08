import { GenericContainer, Wait } from 'testcontainers';
import { MAILPIT_IMAGE } from '../container-images.js';

export type StartedMailpit = {
  smtpUrl: string;
  webUrl: string;
  stop: () => Promise<void>;
};

/** Mailpit for password-reset and notification adapter tests. */
export async function startMailpitContainer(image = MAILPIT_IMAGE): Promise<StartedMailpit> {
  const container = await new GenericContainer(image)
    .withExposedPorts(1025, 8025)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();
  const host = container.getHost();
  const smtpPort = container.getMappedPort(1025);
  const webPort = container.getMappedPort(8025);
  return {
    smtpUrl: `smtp://${host}:${smtpPort}`,
    webUrl: `http://${host}:${webPort}`,
    stop: async () => {
      await container.stop();
    },
  };
}
