// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class ConnectorPaperlessImport20261008234500 implements MigrationInterface {
  name = 'ConnectorPaperlessImport20261008234500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('connector-paperless-import-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('connector-paperless-import-down.sql'));
  }
}
