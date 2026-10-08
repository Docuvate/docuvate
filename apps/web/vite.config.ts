import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxy = {
  '/api/auth': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
};

function resolveBuildSha(): string {
  if (process.env.DOCUVATE_BUILD_SHA?.trim()) {
    return process.env.DOCUVATE_BUILD_SHA.trim();
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __DOCUVATE_BUILD_SHA__: JSON.stringify(resolveBuildSha()),
  },
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 5174,
    proxy: apiProxy,
  },
});
