// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { suggestionRowStillOpenSql } from './review-queue-pending-sql.js';

describe('suggestion row still open', () => {
  it('excludes an active reject of the review-row key and the legacy global: spelling', () => {
    const sql = suggestionRowStillOpenSql('v.document_id', 'v.field_storage_key', 'v.value_text');
    expect(sql).toContain('document_field_suggestion_decisions');
    expect(sql).toContain("dec.decision = 'rejected'");
    expect(sql).toContain('dec.withdrawn_at IS NULL');
    expect(sql).toContain("strpos(regexp_replace(v.field_storage_key, '^suggestion:', ''), ':') = 0");
    expect(sql).toContain("'global:' || regexp_replace(v.field_storage_key, '^suggestion:', '')");
    expect(sql).toContain("lower(regexp_replace(btrim(v.value_text), '[[:space:]]+', ' ', 'g'))");
  });
});

describe('field suggestion decision user id', () => {
  const sqlDir = join(
    process.cwd(),
    'src/shared/infrastructure/database/migrations/sql'
  );

  it('stores user_id as text so a better-auth account id can be written', () => {
    const createSql = readFileSync(join(sqlDir, 'field-suggestion-reject-up.sql'), 'utf8');
    expect(createSql).toMatch(/user_id text NOT NULL REFERENCES public\."user"\(id\)/);
    expect(createSql).not.toMatch(/user_id uuid/);
  });

  it('converts an already-created uuid column without dropping decisions', () => {
    const alterSql = readFileSync(join(sqlDir, 'field-suggestion-decision-user-text-up.sql'), 'utf8');
    expect(alterSql).toContain('ALTER COLUMN user_id TYPE text');
    expect(alterSql).not.toContain('DROP TABLE');
  });
});
