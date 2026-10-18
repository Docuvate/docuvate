import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/contract/**/*.spec.ts'],
    env: {
      DOCUVATE_OPENAPI_CONTRACT: '1',
    },
  },
});
