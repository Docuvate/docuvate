// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class DocumentRegionTableStructure20261106090000 implements MigrationInterface {
  name = 'DocumentRegionTableStructure20261106090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('document-region-table-structure-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('document-region-table-structure-down.sql'));
  }
}
