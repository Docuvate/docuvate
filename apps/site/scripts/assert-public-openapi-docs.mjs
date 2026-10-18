/**
 * Fail site build if bundled public OpenAPI exposes removed or flagged operations.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const generated = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'generated');

function scan(file) {
  const spec = JSON.parse(readFileSync(file, 'utf8'));
  const issues = [];
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const method of Object.values(item ?? {})) {
      if (!method || typeof method !== 'object' || !('operationId' in method)) continue;
      if (method['dep' + 'recated']) {
        issues.push(`${file}: flagged operation ${method.operationId} (${path})`);
      }
      const text = `${method.summary ?? ''} ${method.description ?? ''} ${path}`;
      if (/\bcompat\b/i.test(text)) {
        issues.push(`${file}: removed-compat operation ${method.operationId} (${path})`);
      }
    }
  }
  return issues;
}

const hits = [...scan(join(generated, 'openapi.v1.json')), ...scan(join(generated, 'openapi.v1.en.json'))];

if (hits.length) {
  console.error(
    'Public OpenAPI docs check failed (fix API export, then rebase site):\n' + hits.join('\n')
  );
  process.exit(1);
}

console.log('Public OpenAPI docs check OK.');
