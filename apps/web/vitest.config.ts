import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    environmentMatchGlobs: [['src/**/*.spec.tsx', 'jsdom']],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text-summary', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.spec.tsx', 'src/main.tsx'],
    },
  },
});
