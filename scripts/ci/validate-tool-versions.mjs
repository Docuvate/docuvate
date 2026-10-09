import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  loadToolVersions,
  nodeDockerTag,
  pnpmPackageManagerField,
  pythonDockerTag,
  TOOL_VERSIONS_ROOT,
} from './tool-versions.mjs';

const IMAGE_CONST_MAP = {
  postgres: 'POSTGRES_IMAGE',
  valkey: 'VALKEY_IMAGE',
  minio: 'MINIO_IMAGE',
  mailpit: 'MAILPIT_IMAGE',
};

const NODE_DOCKERFILES = [
  'apps/api/Dockerfile',
  'apps/web/Dockerfile',
  'apps/site/Dockerfile',
];

const UNPINNED_UV_RE =
  /pip(?:x)?\s+install(?:\s+-[^\s]+)*\s+['"]?uv['"]?(?!\s*==)(?:\s|$)/;

/** Postgres image refs (not host:port in URLs); requires a tag suffix such as -alpine. */
const POSTGRES_IMAGE_RE =
  /postgres:\d+(?:\.\d+)?-[a-z0-9.-]+(?:@sha256:[a-f0-9]+)?/gi;

const SERVICE_IMAGE_RES = [
  { key: 'postgres', re: POSTGRES_IMAGE_RE },
  { key: 'valkey', re: /valkey\/valkey:[^\s'"`,]+/g },
  { key: 'minio', re: /cgr\.dev\/chainguard\/minio@[^\s'"`,]+/g },
  { key: 'mailpit', re: /axllent\/mailpit:[^\s'"`,]+/g },
];

const UV_VAR_PLACEHOLDERS = new Set(['${UV_VERSION}', '${UV_PIN}']);

/**
 * @param {string} root
 * @param {(rel: string) => string} read
 * @returns {string[]}
 */
export function collectToolVersionErrors(root = TOOL_VERSIONS_ROOT, read = defaultRead(root)) {
  const versions = loadToolVersions(root);
  const errors = [];
  const fail = (msg) => errors.push(msg);

  const pkg = JSON.parse(read('package.json'));
  const expectedPm = pnpmPackageManagerField(versions);
  if (pkg.packageManager !== expectedPm) {
    fail(`package.json packageManager: expected ${expectedPm}, got ${pkg.packageManager}`);
  }

  const nodeVer = versions.asdf.nodejs;
  const expectedEngines = `>=${nodeVer}`;
  if (pkg.engines?.node !== expectedEngines) {
    fail(`package.json engines.node should be "${expectedEngines}" (from .tool-versions ${nodeVer})`);
  }

  const pyproject = read('apps/worker/pyproject.toml');
  const py = versions.asdf.python;
  const [pyMajor, pyMinor] = py.split('.').map(Number);
  const expectedRequires = `>=${pyMajor}.${pyMinor},<${pyMajor}.${pyMinor + 1}`;
  if (!pyproject.includes(`requires-python = "${expectedRequires}"`)) {
    fail(`apps/worker/pyproject.toml requires-python should be "${expectedRequires}"`);
  }
  const ruffTarget = `py${pyMajor}${pyMinor}`;
  if (!pyproject.includes(`target-version = "${ruffTarget}"`)) {
    fail(`apps/worker/pyproject.toml ruff target-version should be "${ruffTarget}"`);
  }

  const nodeTag = nodeDockerTag(versions);
  const wantPnpmPrepare = `corepack prepare ${expectedPm} --activate`;

  for (const dockerfile of NODE_DOCKERFILES) {
    const df = read(dockerfile);
    for (const line of df.split('\n')) {
      const fromNode = line.match(/^\s*FROM\s+node:([^\s]+)/i);
      if (fromNode && fromNode[1] !== nodeTag) {
        fail(`${dockerfile}: FROM node:${fromNode[1]} should be node:${nodeTag}`);
      }
    }
    if (!df.includes(wantPnpmPrepare)) {
      fail(`${dockerfile}: expected "${wantPnpmPrepare}"`);
    }
  }

  const workerDf = read('apps/worker/Dockerfile');
  const wantPyTag = pythonDockerTag(versions);
  for (const line of workerDf.split('\n')) {
    const fromPy = line.match(/^\s*FROM\s+python:([^\s]+)/i);
    if (fromPy && fromPy[1] !== wantPyTag) {
      fail(`apps/worker/Dockerfile: FROM python:${fromPy[1]} should be python:${wantPyTag}`);
    }
  }

  const uvPin = versions.asdf.uv;
  if (!workerDf.includes(`ARG UV_VERSION=${uvPin}`)) {
    fail(`apps/worker/Dockerfile must declare ARG UV_VERSION=${uvPin}`);
  }
  assertUvInstallsPinned(workerDf, 'apps/worker/Dockerfile', uvPin, fail);
  assertEveryUvPinMatches(workerDf, 'apps/worker/Dockerfile', uvPin, fail, UV_VAR_PLACEHOLDERS, {
    requireAtLeastOne: true,
  });

  const ci = read('.github/workflows/ci.yml');
  if (!ci.includes('node-version-file: .tool-versions')) {
    fail('.github/workflows/ci.yml must use node-version-file: .tool-versions');
  }
  if (!ci.includes('python-version-file: .tool-versions')) {
    fail('.github/workflows/ci.yml must use python-version-file: .tool-versions for worker steps');
  }
  const puppeteerVer = versions.tools.puppeteer;
  if (!ci.includes(`puppeteer-${puppeteerVer}-chrome-headless-shell`)) {
    fail(`.github/workflows/ci.yml Puppeteer cache key must include puppeteer-${puppeteerVer}`);
  }
  assertUvInstallsPinned(ci, '.github/workflows/ci.yml', uvPin, fail);
  assertEveryUvPinMatches(ci, '.github/workflows/ci.yml', uvPin, fail);

  const localCi = read('scripts/ci/run-local-ci-jobs.sh');
  assertUvInstallsPinned(localCi, 'scripts/ci/run-local-ci-jobs.sh', uvPin, fail);
  assertEveryUvPinMatches(localCi, 'scripts/ci/run-local-ci-jobs.sh', uvPin, fail, UV_VAR_PLACEHOLDERS);
  if (!localCi.includes('UV_PIN=')) {
    fail('scripts/ci/run-local-ci-jobs.sh must read UV_PIN from .tool-versions');
  }

  const mermaidSh = read('scripts/ci/mermaid-chrome-setup.sh');
  for (const [tool, ver] of Object.entries(versions.tools)) {
    if (tool === 'puppeteer' && !mermaidSh.includes(`PUPPETEER_VERSION="${ver}"`)) {
      fail(`scripts/ci/mermaid-chrome-setup.sh must set PUPPETEER_VERSION="${ver}"`);
    }
    if (tool === 'mermaid-cli' && !mermaidSh.includes(`MERMAID_CLI_VERSION="${ver}"`)) {
      fail(`scripts/ci/mermaid-chrome-setup.sh must set MERMAID_CLI_VERSION="${ver}"`);
    }
  }

  const typstVer = versions.tools.typst;
  if (typstVer) {
    if (!ci.includes('bash scripts/ci/install-typst.sh')) {
      fail('.github/workflows/ci.yml must install typst via scripts/ci/install-typst.sh');
    }
    const typstSh = read('scripts/ci/install-typst.sh');
    if (!typstSh.includes('.tool-versions')) {
      fail('scripts/ci/install-typst.sh must read typst version from .tool-versions');
    }
    if (!localCi.includes('scripts/ci/install-typst.sh')) {
      fail('scripts/ci/run-local-ci-jobs.sh must call scripts/ci/install-typst.sh before worker pytest');
    }
    const toolVersions = read('.tool-versions');
    for (const asset of [
      'x86_64-unknown-linux-musl',
      'aarch64-unknown-linux-musl',
      'x86_64-apple-darwin',
      'aarch64-apple-darwin',
    ]) {
      const needle = `# docuvate:tool:typst:checksum:${asset}=`;
      if (!toolVersions.includes(needle)) {
        fail(`.tool-versions must pin typst checksum for ${asset} (docuvate:tool:typst:checksum:...)`);
      }
    }
  }

  const mermaidCheck = read('tools/docs/check-mermaid.mjs');
  const mermaidCli = versions.tools['mermaid-cli'];
  if (!mermaidCheck.includes(`const MERMAID_CLI_VERSION = '${mermaidCli}'`)) {
    fail(`tools/docs/check-mermaid.mjs MERMAID_CLI_VERSION must be '${mermaidCli}'`);
  }

  const pw = versions.tools.playwright;
  if (pkg.devDependencies?.playwright !== `^${pw}`) {
    fail(`package.json devDependencies.playwright should be ^${pw}`);
  }

  const imagesTs = read('packages/testing/src/container-images.ts');
  const compose = read('docker-compose.yml');
  for (const [name, ref] of Object.entries(versions.images)) {
    const cn = IMAGE_CONST_MAP[name];
    if (!cn) {
      fail(`packages/testing: no IMAGE const map entry for docuvate:image:${name}`);
      continue;
    }
    const re = new RegExp(`export const ${cn} =\\s*'([^']+)'`);
    const m = imagesTs.match(re);
    if (!m || m[1] !== ref) {
      fail(`packages/testing/src/container-images.ts ${cn}: expected '${ref}'`);
    }
    if (!compose.includes(ref)) {
      fail(`docker-compose.yml missing image ref for ${name}: ${ref}`);
    }
  }

  for (const rel of serviceImageScanPaths(root)) {
    assertServiceImagesInText(read(rel), rel, versions, fail);
  }

  const testingSrc = 'packages/testing/src';
  for (const rel of walkTsFiles(join(root, testingSrc))) {
    const text = read(`${testingSrc}/${rel}`);
    for (const m of text.matchAll(/node:([0-9][^\s'"]+)/g)) {
      if (m[1] !== nodeTag) {
        fail(`${rel}: node image ref node:${m[1]} should be node:${nodeTag}`);
      }
    }
  }

  const pgLib = read('scripts/ci/lib-ephemeral-postgres.sh');
  if (!pgLib.includes(versions.images.postgres)) {
    fail('scripts/ci/lib-ephemeral-postgres.sh DOCUVATE_PG_IMAGE should match postgres pin');
  }

  const redundantDotfiles = ['.nvmrc', '.node-version', '.python-version'];
  for (const dotfile of redundantDotfiles) {
    try {
      read(dotfile);
      fail(`Remove redundant version file ${dotfile} (use .tool-versions)`);
    } catch {
      // absent OK
    }
  }

  return errors;
}

/** @param {string} root */
export function serviceImageScanPaths(root) {
  const out = [];
  for (const name of readdirSync(root)) {
    if (name.startsWith('docker-compose') && (name.endsWith('.yml') || name.endsWith('.yaml'))) {
      out.push(name);
    }
  }
  walkYamlUnder(join(root, 'deploy'), 'deploy', out);
  walkYamlUnder(join(root, '.github/workflows'), '.github/workflows', out);
  walkYamlUnder(join(root, 'scripts/ci'), 'scripts/ci', out);
  walkShellUnder(join(root, 'scripts/ci'), 'scripts/ci', out);
  return out;
}

function walkShellUnder(absDir, relPrefix, out) {
  if (!existsSync(absDir)) {
    return;
  }
  for (const name of readdirSync(absDir)) {
    const abs = join(absDir, name);
    const rel = `${relPrefix}/${name}`;
    const st = statSync(abs);
    if (st.isDirectory()) {
      walkShellUnder(abs, rel, out);
      continue;
    }
    if (name.endsWith('.sh')) {
      out.push(rel);
    }
  }
}

function walkYamlUnder(absDir, relPrefix, out) {
  if (!existsSync(absDir)) {
    return;
  }
  for (const name of readdirSync(absDir)) {
    const abs = join(absDir, name);
    const rel = `${relPrefix}/${name}`;
    const st = statSync(abs);
    if (st.isDirectory()) {
      walkYamlUnder(abs, rel, out);
      continue;
    }
    if (name.endsWith('.yml') || name.endsWith('.yaml')) {
      out.push(rel);
    }
  }
}

function assertServiceImagesInText(text, label, versions, fail) {
  const stripped = text
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');
  for (const { key, re } of SERVICE_IMAGE_RES) {
    const want = versions.images[key];
    for (const m of stripped.matchAll(re)) {
      if (m[0] !== want) {
        fail(`${label}: ${key} image ${m[0]} should be ${want}`);
      }
    }
  }
}

function assertUvInstallsPinned(text, label, uvPin, fail) {
  if (UNPINNED_UV_RE.test(text)) {
    fail(`${label}: unpinned uv install (use uv==${uvPin})`);
  }
}

/**
 * @param {Set<string>} [allowedPlaceholders]
 * @param {{ requireAtLeastOne?: boolean }} [opts]
 */
export function assertEveryUvPinMatches(
  text,
  label,
  uvPin,
  fail,
  allowedPlaceholders = new Set(),
  opts = {}
) {
  const re = /uv==([^\s'"`]+)/g;
  let count = 0;
  let hasAllowedPlaceholder = false;
  for (const m of text.matchAll(re)) {
    count += 1;
    const val = m[1];
    if (allowedPlaceholders.has(val)) {
      hasAllowedPlaceholder = true;
      continue;
    }
    if (val !== uvPin) {
      fail(`${label}: uv==${val} should be uv==${uvPin}`);
    }
  }
  const needsPin =
    opts.requireAtLeastOne || label.includes('ci.yml') || label.includes('run-local-ci-jobs');
  if (needsPin && count === 0) {
    fail(`${label}: expected at least one uv== pin`);
  }
  if (opts.requireAtLeastOne && count > 0 && !hasAllowedPlaceholder) {
    const literal = `uv==${uvPin}`;
    if (!text.includes(literal)) {
      fail(`${label}: expected uv==\${UV_VERSION} or ${literal}`);
    }
  }
}

function defaultRead(root) {
  return (rel) => readFileSync(resolve(root, rel), 'utf8');
}

function walkTsFiles(dir, out = [], root = dir) {
  if (!existsSync(dir)) {
    return out;
  }
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      walkTsFiles(abs, out, root);
      continue;
    }
    if (name.endsWith('.ts')) {
      out.push(abs.slice(root.length + 1).replaceAll('\\', '/'));
    }
  }
  return out;
}

/** @param {string} dockerfileText @param {string} nodeTag */
export function nodeDockerfileStageErrors(dockerfileText, nodeTag, fileLabel = 'Dockerfile') {
  const errors = [];
  for (const line of dockerfileText.split('\n')) {
    const fromNode = line.match(/^\s*FROM\s+node:([^\s]+)/i);
    if (fromNode && fromNode[1] !== nodeTag) {
      errors.push(`${fileLabel}: FROM node:${fromNode[1]} should be node:${nodeTag}`);
    }
  }
  return errors;
}

export function hasUnpinnedUvInstall(text) {
  return UNPINNED_UV_RE.test(text);
}

export function replaceFirst(haystack, needle, replacement) {
  const i = haystack.indexOf(needle);
  if (i === -1) {
    return haystack;
  }
  return haystack.slice(0, i) + replacement + haystack.slice(i + needle.length);
}
