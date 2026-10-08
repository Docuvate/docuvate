import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const src = join(root, '..', '..', 'openapi', 'docuvate.v1.json');
const destDir = join(root, 'src', 'generated');
const dest = join(destDir, 'openapi.v1.json');

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log('Copied OpenAPI spec to', dest);
