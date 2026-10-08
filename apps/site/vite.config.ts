import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  ssr: {
    noExternal: ['@scalar/api-reference-react', '@scalar/api-reference'],
  },
  resolve: {
    alias: {
      '@content': resolve(__dirname, 'src/content'),
    },
  },
  server: {
    port: 8081,
  },
  preview: {
    port: 8081,
  },
});
