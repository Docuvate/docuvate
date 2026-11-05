import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MigrationInterface, QueryRunner } from 'typeorm';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class JobOutbox20261105080000 implements MigrationInterface {
  name = 'JobOutbox20261105080000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('job-outbox-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('job-outbox-down.sql'));
  }
}
