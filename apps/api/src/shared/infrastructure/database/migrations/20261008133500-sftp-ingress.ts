import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MigrationInterface, QueryRunner } from 'typeorm';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class SftpIngress20261008133500 implements MigrationInterface {
  name = 'SftpIngress20261008133500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('sftp-ingress-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('sftp-ingress-down.sql'));
  }
}
