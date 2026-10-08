import { GenericContainer, Wait } from 'testcontainers';
import { MINIO_IMAGE } from '../container-images.js';

export type StartedMinio = {
  endpoint: string;
  port: number;
  accessKey: string;
  secretKey: string;
  stop: () => Promise<void>;
};

/** MinIO (S3-compatible) for object storage adapter integration tests. */
export async function startMinioContainer(options?: {
  image?: string;
  accessKey?: string;
  secretKey?: string;
}): Promise<StartedMinio> {
  const accessKey = options?.accessKey ?? 'docuvate';
  const secretKey = options?.secretKey ?? 'docuvate-secret';
  const container = await new GenericContainer(options?.image ?? MINIO_IMAGE)
    .withCommand(['server', '/data', '--console-address', ':9001'])
    .withEnvironment({
      MINIO_ROOT_USER: accessKey,
      MINIO_ROOT_PASSWORD: secretKey,
    })
    .withExposedPorts(9000)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();
  const host = container.getHost();
  const port = container.getMappedPort(9000);
  return {
    endpoint: host,
    port,
    accessKey,
    secretKey,
    stop: async () => {
      await container.stop();
    },
  };
}
