import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

function resolveAppVersion(): string {
  if (process.env.DOCUVATE_APP_VERSION?.trim()) {
    return process.env.DOCUVATE_APP_VERSION.trim().replace(/^v/, '');
  }
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version?.trim() || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __DOCUVATE_BUILD_SHA__: JSON.stringify(resolveBuildSha()),
    __DOCUVATE_APP_VERSION__: JSON.stringify(resolveAppVersion()),
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
