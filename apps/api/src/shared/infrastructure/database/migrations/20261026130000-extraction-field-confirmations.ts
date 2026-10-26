// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { MigrationInterface, QueryRunner } from 'typeorm';

import { extractionFieldValuesEquivalent } from '../../../../modules/extraction-feedback/domain/extraction-field-value-equivalence.js';
import {
  parseString,
  requireRecord,
} from '../row-parse.js';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

export class ExtractionFieldConfirmations20261026130000 implements MigrationInterface {
  name = 'ExtractionFieldConfirmations20261026130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('extraction-field-confirmations-up.sql'));

    const raw: unknown = await queryRunner.query(
      `SELECT id, field_key, old_value, new_value FROM extraction_field_corrections`
    );
    if (!Array.isArray(raw)) {
      return;
    }
    const staleIds: string[] = [];
    for (const item of raw) {
      const row = requireRecord(item);
      const id = parseString(row.id);
      const fieldKey = parseString(row.field_key);
      const oldValue = parseString(row.old_value);
      const newValue = parseString(row.new_value);
      if (extractionFieldValuesEquivalent(fieldKey, oldValue, newValue)) {
        staleIds.push(id);
      }
    }
    if (staleIds.length > 0) {
      await queryRunner.query(
        `DELETE FROM extraction_field_corrections WHERE id = ANY($1::uuid[])`,
        [staleIds]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('extraction-field-confirmations-down.sql'));
  }
}
