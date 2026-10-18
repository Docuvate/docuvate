// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Gate label polarity only; `show_in_filter` is added in 20261018180000 (#108). */
export class RecognizedFieldGateLabelPolarity20261018190000 implements MigrationInterface {
  name = 'RecognizedFieldGateLabelPolarity20261018190000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE recognized_field_definitions
        ADD COLUMN IF NOT EXISTS gate_label_polarity text NOT NULL DEFAULT 'include'
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'recognized_field_definitions_gate_label_polarity_check'
        ) THEN
          ALTER TABLE recognized_field_definitions
            ADD CONSTRAINT recognized_field_definitions_gate_label_polarity_check
            CHECK (gate_label_polarity IN ('include', 'exclude'));
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE recognized_field_definitions
        DROP CONSTRAINT IF EXISTS recognized_field_definitions_gate_label_polarity_check,
        DROP COLUMN IF EXISTS gate_label_polarity
    `);
  }
}
