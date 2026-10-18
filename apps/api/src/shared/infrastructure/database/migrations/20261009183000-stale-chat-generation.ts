// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class StaleChatGeneration20261009183000 implements MigrationInterface {
  name = 'StaleChatGeneration20261009183000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('stale-chat-generation-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('stale-chat-generation-down.sql'));
  }
}
