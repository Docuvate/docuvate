import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Labels page i18n', () => {
  it('does not reference removed labelSpace keys in source', () => {
    const root = path.join(import.meta.dirname, '../..');
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules' || ent.name === 'i18n') continue;
          walk(full);
        } else if (/\.(tsx|ts)$/.test(ent.name) && !ent.name.includes('.spec.')) {
          const src = fs.readFileSync(full, 'utf8');
          if (src.includes('labelSpace.')) {
            hits.push(path.relative(root, full));
          }
        }
      }
    };
    walk(root);
    expect(hits).toEqual([]);
  });
});
