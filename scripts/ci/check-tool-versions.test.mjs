import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import {
  assertEveryUvPinMatches,
  collectToolVersionErrors,
  hasUnpinnedUvInstall,
  nodeDockerfileStageErrors,
  replaceFirst,
  serviceImageScanPaths,
} from './validate-tool-versions.mjs';
import {
  loadToolVersions,
  nodeDockerTag,
  pnpmPackageManagerField,
  TOOL_VERSIONS_ROOT,
} from './tool-versions.mjs';

const versions = loadToolVersions();
const nodeTag = nodeDockerTag(versions);
const uvPin = versions.asdf.uv;
const uvNeedle = `uv==${uvPin}`;
const wrongUv = bumpedPatchUv(uvPin);

function bumpedPatchUv(pin) {
  const parts = pin.split('.').map((p) => Number.parseInt(p, 10));
  parts[parts.length - 1] += 1;
  return `uv==${parts.join('.')}`;
}

const FIXTURE_COPY = [
  '.tool-versions',
  'package.json',
  'apps/worker/pyproject.toml',
  'apps/api/Dockerfile',
  'apps/web/Dockerfile',
  'apps/site/Dockerfile',
  'apps/worker/Dockerfile',
  'packages/testing/src/container-images.ts',
  'docker-compose.yml',
  'docker-compose.ci.yml',
  '.github/workflows/ci.yml',
  'scripts/ci/mermaid-chrome-setup.sh',
  'scripts/ci/run-local-ci-jobs.sh',
  'scripts/ci/lib-ephemeral-postgres.sh',
  'tools/docs/check-mermaid.mjs',
  'packages/testing/src/containers/ollama-stub.ts',
  ...serviceImageScanPaths(TOOL_VERSIONS_ROOT).filter(
    (p) =>
      p.startsWith('deploy/') ||
      p.startsWith('docker-compose') ||
      p.startsWith('scripts/ci/')
  ),
];

function writeRel(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function copyRepoFixture(root, mutate = (files) => files) {
  /** @type {Record<string, string>} */
  const files = {};
  for (const rel of FIXTURE_COPY) {
    const abs = join(TOOL_VERSIONS_ROOT, rel);
    try {
      files[rel] = readFileSync(abs, 'utf8');
    } catch {
      // optional paths
    }
  }
  const merged = mutate(files);
  for (const [rel, content] of Object.entries(merged)) {
    writeRel(root, rel, content);
  }
}

test('passes on repository root', () => {
  const errors = collectToolVersionErrors(TOOL_VERSIONS_ROOT);
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('fails when a second Dockerfile stage uses wrong node tag', () => {
  const apiDf = `FROM node:${nodeTag} AS build
RUN corepack prepare ${pnpmPackageManagerField(versions)} --activate
FROM node:24-alpine AS runner
`;
  const errs = nodeDockerfileStageErrors(apiDf, nodeTag, 'apps/api/Dockerfile');
  assert.ok(errs.some((e) => e.includes('node:24-alpine')));
});

test('detects unpinned pip install uv', () => {
  assert.ok(hasUnpinnedUvInstall('pip install uv\n'));
  assert.ok(!hasUnpinnedUvInstall(`pip install '${uvNeedle}'\n`));
});

test('fails when a single uv pin drifts in ci.yml', () => {
  const root = mkdtempSync(join(tmpdir(), 'tv-ci-one-'));
  copyRepoFixture(root, (files) => {
    files['.github/workflows/ci.yml'] = replaceFirst(
      files['.github/workflows/ci.yml'],
      uvNeedle,
      wrongUv
    );
    return files;
  });
  const errors = collectToolVersionErrors(root);
  assert.ok(errors.some((e) => e.includes('ci.yml') && e.includes('uv')));
});

test('fails uv drift in all ci.yml occurrences', () => {
  const root = mkdtempSync(join(tmpdir(), 'tv-ci-'));
  copyRepoFixture(root, (files) => {
    files['.github/workflows/ci.yml'] = files['.github/workflows/ci.yml'].replaceAll(
      uvNeedle,
      wrongUv
    );
    return files;
  });
  const errors = collectToolVersionErrors(root);
  assert.ok(errors.some((e) => e.includes('ci.yml') && e.includes('uv')));
});

test('fails stray .nvmrc in fixture tree', () => {
  const root = mkdtempSync(join(tmpdir(), 'tv-nvm-'));
  copyRepoFixture(root);
  writeRel(root, '.nvmrc', '24\n');
  const errors = collectToolVersionErrors(root);
  assert.ok(errors.some((e) => e.includes('.nvmrc')));
});

test('fails unpinned uv in worker Dockerfile', () => {
  const root = mkdtempSync(join(tmpdir(), 'tv-worker-uv-'));
  copyRepoFixture(root, (files) => {
    files['apps/worker/Dockerfile'] = files['apps/worker/Dockerfile'].replace(
      'pip install --no-cache-dir "uv==${UV_VERSION}"',
      'pip install --no-cache-dir uv'
    );
    return files;
  });
  const errors = collectToolVersionErrors(root);
  assert.ok(
    errors.some((e) => e.includes('apps/worker/Dockerfile') && e.includes('uv')),
    errors.join('\n')
  );
});

test('fails drifted docker pull in run-local-ci-jobs.sh', () => {
  const root = mkdtempSync(join(tmpdir(), 'tv-pull-'));
  const mailpitRef = versions.images.mailpit;
  const badRef = mailpitRef.replace(/v[0-9.]+/, 'v0.0.0');
  copyRepoFixture(root, (files) => {
    files['scripts/ci/run-local-ci-jobs.sh'] = files['scripts/ci/run-local-ci-jobs.sh'].replaceAll(
      mailpitRef,
      badRef
    );
    return files;
  });
  const errors = collectToolVersionErrors(root);
  assert.ok(errors.some((e) => e.includes('run-local-ci-jobs.sh') && e.includes('mailpit')));
});

test('fails postgres:18-alpine without minor in kustomize', () => {
  const root = mkdtempSync(join(tmpdir(), 'tv-pg-tag-'));
  const postgresRef = versions.images.postgres;
  copyRepoFixture(root, (files) => {
    const kustPath = 'deploy/kustomize/components/postgres/statefulset.yaml';
    if (files[kustPath]) {
      files[kustPath] = files[kustPath].replaceAll(postgresRef, 'postgres:18-alpine');
    }
    return files;
  });
  const errors = collectToolVersionErrors(root);
  assert.ok(errors.some((e) => e.includes('postgres') && e.includes('18-alpine')));
});

test('fails drifted postgres digest in kustomize component', () => {
  const root = mkdtempSync(join(tmpdir(), 'tv-kust-'));
  const postgresRef = versions.images.postgres;
  const badRef = postgresRef.replace(/@sha256:[a-f0-9]+$/, '@sha256:deadbeef');
  copyRepoFixture(root, (files) => {
    const kustPath = 'deploy/kustomize/components/postgres/statefulset.yaml';
    if (files[kustPath]) {
      files[kustPath] = files[kustPath].replaceAll(postgresRef, badRef);
    }
    return files;
  });
  const errors = collectToolVersionErrors(root);
  assert.ok(errors.some((e) => e.includes('postgres') && e.includes('statefulset')));
});

test('assertEveryUvPinMatches catches one wrong literal', () => {
  const errors = [];
  const fail = (m) => errors.push(m);
  const text = `pip install '${uvNeedle}'\npip install '${wrongUv}'\n`;
  assertEveryUvPinMatches(text, 'fixture', uvPin, fail);
  assert.equal(errors.length, 1);
});
