import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MigrationInterface, QueryRunner } from 'typeorm';

function loadSql(name: string): string {
  return readFileSync(join(__dirname, 'sql', name), 'utf8');
}

export class InstallationIam20261008132200 implements MigrationInterface {
  name = 'InstallationIam20261008132200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(loadSql('installation-iam-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(loadSql('installation-iam-down.sql'));
  }
}
