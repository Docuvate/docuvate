// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MappeDefaultRootFolders20261014150000 implements MigrationInterface {
  name = 'MappeDefaultRootFolders20261014150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO folders (id, user_id, name, parent_id, mappe_id, created_at, updated_at)
       SELECT gen_random_uuid(),
              m.user_id,
              CASE
                WHEN EXISTS (
                  SELECT 1 FROM folders f0
                  WHERE f0.user_id = m.user_id
                    AND f0.parent_id IS NULL
                    AND f0.name = m.name
                )
                THEN m.name || ' (' || LEFT(m.id::text, 8) || ')'
                ELSE m.name
              END,
              NULL,
              m.id,
              now(),
              now()
       FROM mappen m
       WHERE NOT EXISTS (
         SELECT 1 FROM folders f
         WHERE f.mappe_id = m.id AND f.user_id = m.user_id AND f.parent_id IS NULL
       )`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- data backfill
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Backfill only; do not delete user folders on revert.
  }
}
