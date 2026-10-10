// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readdirSync,readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildTypeOrmOptions } from './typeorm-options.js';

const databaseDir = __dirname;
const migrationsDir = join(databaseDir, 'migrations');

describe('TypeORM migrations guard', () => {
  it('registers every migration module from migrations/', () => {
    process.env['DATABASE_URL'] ??= 'postgres://docuvate:docuvate@127.0.0.1:5432/docuvate';
    const migrationFiles = readdirSync(migrationsDir)
      .filter((name) => /^\d{14}-.+\.ts$/.test(name))
      .sort();
    const typeormOptionsSource = readFileSync(join(databaseDir, 'typeorm-options.ts'), 'utf8');
    const registered = buildTypeOrmOptions().migrations ?? [];
    expect(registered.length).toBe(migrationFiles.length);
    for (const file of migrationFiles) {
      const modulePath = `./migrations/${file.replace(/\.ts$/, '')}.js`;
      expect(
        typeormOptionsSource,
        `typeorm-options.ts must import ${modulePath}`
      ).toContain(modulePath);
    }
  });
});
