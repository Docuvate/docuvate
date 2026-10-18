// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class FeatureFlags20261013120000 implements MigrationInterface {
  name = 'FeatureFlags20261013120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('feature-flag-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('feature-flag-down.sql'));
  }
}
