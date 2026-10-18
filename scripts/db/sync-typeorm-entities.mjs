#!/usr/bin/env node
/** Regenerate infrastructure entities from /tmp/typeorm-gen (run typeorm-model-generator first). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = process.env['TYPEORM_GEN_DIR'] ?? '/tmp/typeorm-gen';
const dst = path.join(root, 'apps/api/src/shared/infrastructure/database/entities');

function kebab(name) {
  return name
    .replace(/(.)([A-Z][a-z]+)/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

const stems = fs.readdirSync(src).filter((f) => f.endsWith('.ts')).map((f) => f.replace(/\.ts$/, ''));

fs.mkdirSync(dst, { recursive: true });

for (const stem of stems) {
  let text = fs.readFileSync(path.join(src, `${stem}.ts`), 'utf8');
  const newClass = `${stem}Entity`;
  text = text.replace(`export class ${stem}`, `export class ${newClass}`);

  for (const o of stems) {
    const imp = `${o}Entity`;
    text = text.replaceAll(`from "./${o}"`, `from './${kebab(o)}.entity.js'`);
    text = text.replaceAll(`import { ${o} }`, `import { ${imp} }`);
    text = text.replaceAll(`() => ${o}`, `() => ${imp}`);
    text = text.replaceAll(`(${o} `, `(${imp} `);
    text = text.replaceAll(`, ${o})`, `, ${imp})`);
    text = text.replaceAll(` => ${o}.`, ` => ${imp}.`);
    text = text.replaceAll(` => ${o})`, ` => ${imp})`);
  }

  const byLen = [...stems].sort((a, b) => b.length - a.length);
  for (const o of byLen) {
    const re = new RegExp(`: ${o}(\\[\\]| \\| null)?;`, 'g');
    text = text.replace(re, (_m, suffix) => `: ${o}Entity${suffix ?? ''};`);
  }

  fs.writeFileSync(path.join(dst, `${kebab(stem)}.entity.ts`), text);
}

const imports = stems.map((o) => `import { ${o}Entity } from './${kebab(o)}.entity.js';`).join('\n');
const exportNames = stems.map((o) => `${o}Entity`).join(',\n  ');

fs.writeFileSync(
  path.join(dst, 'index.ts'),
  `/** TypeORM persistence entities (infrastructure). Do not use in domain/application. */\n\n${imports}\n\nexport const TYPEORM_ENTITIES = [\n  ${exportNames},\n] as const;\n\nexport {\n  ${exportNames},\n};\n`
);

console.log(`Synced ${stems.length} entities to ${dst}`);
