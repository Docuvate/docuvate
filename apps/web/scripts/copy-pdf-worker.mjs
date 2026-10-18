import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const root = dirname(fileURLToPath(import.meta.url));
const destDir = join(root, '../public');
const dest = join(destDir, 'pdf.worker.min.mjs');
mkdirSync(destDir, { recursive: true });

const require = createRequire(pathToFileURL(join(root, '../package.json')));
const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');
copyFileSync(workerPath, dest);
