// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

import { regClassExists } from '../migration-baseline-markers.js';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class ConnectorNamedConnectionsSourceScope20261018160000 implements MigrationInterface {
  name = 'ConnectorNamedConnectionsSourceScope20261018160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await regClassExists(queryRunner, 'public.connector_installation_source_scope')) {
      return;
    }
    await queryRunner.query(await loadSql('connector-named-connections-source-scope-up.sql'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await regClassExists(queryRunner, 'public.connector_installation_source_scope'))) {
      return;
    }
    await queryRunner.query(await loadSql('connector-named-connections-source-scope-down.sql'));
  }
}
