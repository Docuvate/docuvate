// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class DocumentListPaginationIndexes20261026120000 implements MigrationInterface {
  name = 'DocumentListPaginationIndexes20261026120000';

  /** CONCURRENTLY cannot run inside a transaction (safe on populated Postgres 18). */
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const statements = (await loadSql('document-list-pagination-indexes-up.sql'))
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const statements = (await loadSql('document-list-pagination-indexes-down.sql'))
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }
}
