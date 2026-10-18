// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RepairHashOnlyDuplicateStacks20261014140000 implements MigrationInterface {
  name = 'RepairHashOnlyDuplicateStacks20261014140000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM document_stack_members m
       USING document_duplicate_stacks s,
             document_stack_members primary_m,
             documents d_version,
             documents d_primary
       WHERE m.stack_id = s.id
         AND primary_m.stack_id = s.id
         AND primary_m.role = 'primary'
         AND m.role = 'version'
         AND d_version.id = m.document_id
         AND d_primary.id = primary_m.document_id
         AND (
           d_version.content_hash IS NULL
           OR d_primary.content_hash IS NULL
           OR d_version.content_hash <> d_primary.content_hash
         )`
    );

    await queryRunner.query(
      `UPDATE document_stack_members m SET role = 'primary'
       FROM (
         SELECT pick.stack_id, pick.document_id
         FROM (
           SELECT m2.stack_id,
                  m2.document_id,
                  ROW_NUMBER() OVER (
                    PARTITION BY m2.stack_id
                    ORDER BY d.created_at DESC
                  ) AS rn
           FROM document_stack_members m2
           JOIN documents d ON d.id = m2.document_id
           JOIN document_duplicate_stacks s ON s.id = m2.stack_id
           WHERE NOT EXISTS (
             SELECT 1 FROM document_stack_members p
             WHERE p.stack_id = m2.stack_id AND p.role = 'primary'
           )
         ) pick
         WHERE pick.rn = 1
       ) elected
       WHERE m.stack_id = elected.stack_id AND m.document_id = elected.document_id`
    );

    await queryRunner.query(
      `DELETE FROM document_duplicate_stacks s
       WHERE NOT EXISTS (
         SELECT 1 FROM document_stack_members m WHERE m.stack_id = s.id
       )`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- irreversible data repair
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Irreversible data repair.
  }
}
