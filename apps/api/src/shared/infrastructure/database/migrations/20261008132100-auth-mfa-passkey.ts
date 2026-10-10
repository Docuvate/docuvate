// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

function loadSql(name: string): string {
  return readFileSync(join(__dirname, 'sql', name), 'utf8');
}

export class AuthMfaPasskey20261008132100 implements MigrationInterface {
  name = 'AuthMfaPasskey20261008132100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(loadSql('auth-mfa-passkey-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(loadSql('auth-mfa-passkey-down.sql'));
  }
}
