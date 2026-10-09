import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@docuvate/testing': path.resolve(rootDir, '../../packages/testing/src/index.ts'),
      '@docuvate/testing/containers': path.resolve(
        rootDir,
        '../../packages/testing/src/containers/index.ts'
      ),
      '@docuvate/testing/factories': path.resolve(
        rootDir,
        '../../packages/testing/src/factories/index.ts'
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['test/integration/**/*.integration.spec.ts'],
    globalSetup: ['test/integration/global-setup.ts'],
    setupFiles: ['test/integration/setup-env.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
  },
});
