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
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.integration.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text-summary', 'json-summary', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/main.ts', 'src/**/*.module.ts'],
    },
  },
});
