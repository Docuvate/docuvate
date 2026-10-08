import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const TOOL_VERSIONS_PATH = resolve(ROOT, '.tool-versions');

/** @typedef {{ asdf: Record<string, string>, images: Record<string, string>, tools: Record<string, string> }} ToolVersions */

/** @returns {ToolVersions} */
export function loadToolVersions(root = ROOT) {
  const path = resolve(root, '.tool-versions');
  const text = readFileSync(path, 'utf8');
  /** @type {ToolVersions} */
  const out = { asdf: {}, images: {}, tools: {} };

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      const docuvate = trimmed.match(/^#\s*docuvate:([^=]+)=(.+)$/);
      if (docuvate) {
        const [, key, value] = docuvate;
        if (key.startsWith('image:')) {
          out.images[key.slice('image:'.length)] = value.trim();
        } else if (key.startsWith('tool:')) {
          out.tools[key.slice('tool:'.length)] = value.trim();
        }
      }
      continue;
    }
    const m = trimmed.match(/^([a-zA-Z0-9._-]+)\s+(.+)$/);
    if (!m) {
      throw new Error(`Invalid .tool-versions line: ${line}`);
    }
    out.asdf[m[1]] = m[2].trim();
  }

  const required = ['nodejs', 'pnpm', 'python', 'uv'];
  for (const key of required) {
    if (!out.asdf[key]) {
      throw new Error(`.tool-versions missing required asdf tool: ${key}`);
    }
  }
  for (const img of ['postgres', 'valkey', 'minio', 'mailpit']) {
    if (!out.images[img]) {
      throw new Error(`.tool-versions missing docuvate:image:${img}`);
    }
  }

  return out;
}

export function nodeDockerTag(versions = loadToolVersions()) {
  return `${versions.asdf.nodejs}-alpine`;
}

export function pythonDockerTag(versions = loadToolVersions()) {
  return `${versions.asdf.python}-slim`;
}

export function pnpmPackageManagerField(versions = loadToolVersions()) {
  return `pnpm@${versions.asdf.pnpm}`;
}

export { TOOL_VERSIONS_PATH, ROOT as TOOL_VERSIONS_ROOT };
