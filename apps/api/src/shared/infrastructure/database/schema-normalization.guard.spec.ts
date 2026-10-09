/** Regression guard for ADR 015 (3NF + JSONB allowlist). See docs/adr/015-datenbankschema-mindestens-3nf.md */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_JSONB_ID_ARRAY_COLUMNS,
  SCHEMA_JSONB_ALLOWLIST,
} from './schema-jsonb-allowlist.js';

const sqlDir = join(__dirname, 'migrations', 'sql');

/** Forward migration SQL in migration order (file names sort like the migrations that load them). */
const FORWARD_SQL_ORDER = [
  'initial-schema-up.sql',
  'global-search-up.sql',
  'schema-normalization-3nf-up.sql',
  'auth-mfa-passkey-up.sql',
  'installation-iam-up.sql',
  '20261008133000-saved-views-dashboard-up.sql',
  'sftp-ingress-up.sql',
  'document-extracted-layout-ir-up.sql',
  'connector-paperless-import-up.sql',
  'cited-chat-up.sql',
];

function loadForwardMigrationSql(): string {
  return FORWARD_SQL_ORDER.map((name) => readFileSync(join(sqlDir, name), 'utf8')).join('\n');
}

type Column = `${string}.${string}`;

/** JSONB columns that exist after all forward migrations ran (created or added, minus dropped). */
function liveJsonbColumns(sql: string): Set<Column> {
  const live = new Set<Column>();
  const statements = sql.split(/;\s*\n/);
  for (const statement of statements) {
    const create = /CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?(\w+)\s*\(([\s\S]*)\)\s*$/i.exec(
      statement.trim()
    );
    if (create) {
      const table = create[1]!;
      for (const line of create[2]!.split('\n')) {
        const col = /^\s*(\w+)\s+JSONB\b/i.exec(line);
        if (col) live.add(`${table}.${col[1]!}`);
      }
      continue;
    }
    for (const add of statement.matchAll(
      /ALTER TABLE (?:ONLY )?(?:public\.)?(\w+)\s+ADD COLUMN (?:IF NOT EXISTS )?(\w+)\s+JSONB\b/gi
    )) {
      live.add(`${add[1]!}.${add[2]!}`);
    }
    for (const drop of statement.matchAll(
      /ALTER TABLE (?:ONLY )?(?:public\.)?(\w+)\s+DROP COLUMN (?:IF EXISTS )?(\w+)/gi
    )) {
      live.delete(`${drop[1]!}.${drop[2]!}`);
    }
    for (const dropTable of statement.matchAll(/DROP TABLE (?:IF EXISTS )?(?:public\.)?(\w+)/gi)) {
      for (const column of [...live]) {
        if (column.startsWith(`${dropTable[1]!}.`)) live.delete(column);
      }
    }
  }
  return live;
}

describe('schema normalization guard (ADR 015)', () => {
  const sql = loadForwardMigrationSql();

  it('reads every forward migration SQL file', () => {
    const upFiles = readdirSync(sqlDir).filter((f) => f.endsWith('-up.sql')).sort();
    expect([...FORWARD_SQL_ORDER].sort()).toEqual(upFiles);
  });

  it('documents every live JSONB column in the allowlist', () => {
    const allowSet = new Set(SCHEMA_JSONB_ALLOWLIST.map((e) => `${e.table}.${e.column}`));
    const undocumented = [...liveJsonbColumns(sql)].filter((c) => !allowSet.has(c));
    expect(undocumented).toEqual([]);
  });

  it('stores layout IR page dimensions relationally', () => {
    expect(sql).toContain('document_layout_ir_pages');
    expect(sql).not.toMatch(/jsonb_array_elements\s*\(\s*li_pages\.ir->'pages'\s*\)/i);
  });

  it('keeps no JSONB id-array column alive', () => {
    const live = [...liveJsonbColumns(sql)].map((c) => c.split('.')[1]);
    for (const column of FORBIDDEN_JSONB_ID_ARRAY_COLUMNS) {
      expect(live).not.toContain(column);
    }
  });

  it('defines junction tables for normalized relationships', () => {
    expect(sql).toContain('CREATE TABLE recognized_field_definition_gate_labels');
    expect(sql).toContain('CREATE TABLE user_preference_required_labels');
    expect(sql).toContain('CREATE TABLE extraction_field_correction_labels');
    expect(sql).toContain('CREATE TABLE extraction_arena_rating_compared_engines');
  });
});
