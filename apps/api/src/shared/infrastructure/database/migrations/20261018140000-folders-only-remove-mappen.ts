// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

import { regClassExists } from '../migration-baseline-markers.js';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class FoldersOnlyRemoveMappen20261018140000 implements MigrationInterface {
  name = 'FoldersOnlyRemoveMappen20261018140000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await regClassExists(queryRunner, 'public.mappen'))) {
      return;
    }
    await queryRunner.query(await loadSql('folders-only-remove-mappen-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await regClassExists(queryRunner, 'public._rev_mappen'))) {
      return;
    }
    await queryRunner.query(await loadSql('folders-only-remove-mappen-down.sql'));
  }
}
