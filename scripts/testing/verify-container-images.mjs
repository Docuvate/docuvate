import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const compose = readFileSync(resolve(ROOT, 'docker-compose.yml'), 'utf8');
const imagesModule = readFileSync(
  resolve(ROOT, 'packages/testing/src/container-images.ts'),
  'utf8'
);

const DIGEST_RE = /@sha256:[a-f0-9]{64}$/;
const LATEST_RE = /:latest(@|$)/;

function extractConst(name) {
  const re = new RegExp(`export const ${name} =\\s*'([^']+)'`);
  const m = imagesModule.match(re);
  if (!m) {
    throw new Error(`Missing export const ${name} in container-images.ts`);
  }
  return m[1];
}

function assertPinned(label, ref) {
  if (LATEST_RE.test(ref)) {
    console.error(`${label}: must not use :latest (${ref})`);
    process.exit(1);
  }
  if (!DIGEST_RE.test(ref)) {
    console.error(`${label}: must include @sha256 digest (${ref})`);
    process.exit(1);
  }
}

function composeServiceImage(serviceName) {
  const re = new RegExp(`^  ${serviceName}:\\s*\\n    image: (.+)$`, 'm');
  const m = compose.match(re);
  if (!m) {
    console.error(`Service ${serviceName} image not found in docker-compose.yml`);
    process.exit(1);
  }
  return m[1].trim();
}

const pairs = [
  ['POSTGRES_IMAGE', 'postgres'],
  ['VALKEY_IMAGE', 'valkey'],
  ['MINIO_IMAGE', 'minio'],
  ['MAILPIT_IMAGE', 'mailpit'],
];

for (const [constName, service] of pairs) {
  const fromTs = extractConst(constName);
  assertPinned(constName, fromTs);
  const fromCompose = composeServiceImage(service);
  if (fromTs !== fromCompose) {
    console.error(
      `${constName} mismatch:\n  container-images.ts: ${fromTs}\n  docker-compose.yml (${service}): ${fromCompose}`
    );
    process.exit(1);
  }
  console.log(`OK ${service}: ${fromTs}`);
}

const conftestPath = resolve(ROOT, 'apps/worker/tests/integration/conftest.py');
const conftest = readFileSync(conftestPath, 'utf8');
const canonicalRefs = new Set(Object.values(Object.fromEntries(pairs.map(([n]) => [n, extractConst(n)]))));

for (const m of conftest.matchAll(/"(postgres:[^"]+|valkey\/[^"]+|axllent\/mailpit[^"]+)"/g)) {
  const ref = m[1];
  if (!canonicalRefs.has(ref)) {
    console.error(
      `Worker conftest.py image not in container-images.ts / compose:\n  ${ref}\n  Expected one of: ${[...canonicalRefs].join(', ')}`
    );
    process.exit(1);
  }
  assertPinned('conftest.py', ref);
  console.log(`OK worker conftest: ${ref}`);
}

const alpinePin =
  /sftp-ingest-data-init:\s*\n\s*image:\s*(alpine:[^\s]+)/m.exec(compose)?.[1];
if (!alpinePin || !DIGEST_RE.test(alpinePin)) {
  console.error(`sftp-ingest-data-init: alpine image must be digest-pinned (${alpinePin ?? 'missing'})`);
  process.exit(1);
}
console.log(`OK sftp-ingest-data-init: ${alpinePin}`);

console.log('Container image digest pins verified (postgres, valkey, minio, mailpit, sftp-ingest-data-init, worker conftest).');
