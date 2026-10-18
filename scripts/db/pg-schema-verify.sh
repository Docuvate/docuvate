#!/bin/sh
# One JSON line: public table counts, sequence last_value, checksums. POSIX sh.
set -eu

PGUSER="${POSTGRES_USER:-docuvate}"
PGDB="${POSTGRES_DB:-docuvate}"

run_psql() {
  psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 -At "$@"
}

tables=$(run_psql -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;")
table_part=""
for t in $tables; do
  if [ "$t" = "user" ]; then
    c=$(run_psql -c 'SELECT count(*) FROM "user";')
  else
    c=$(run_psql -c "SELECT count(*) FROM \"$t\";")
  fi
  table_part="$table_part\"$t\":$c,"
done
table_part=${table_part%,}

seqs=$(run_psql -c "SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' ORDER BY sequencename;")
seq_part=""
for s in $seqs; do
  v=$(run_psql -c "SELECT last_value FROM \"$s\";")
  seq_part="$seq_part\"$s\":$v,"
done
seq_part=${seq_part%,}

ck_user=$(run_psql -c "SELECT md5(coalesce(string_agg(id || coalesce(email, ''), '' ORDER BY id), '')) FROM \"user\";")
ck_docs=$(run_psql -c "SELECT md5(coalesce(string_agg(id::text || coalesce(title, ''), '' ORDER BY id), '')) FROM documents;")
ck_tags=$(run_psql -c "SELECT md5(coalesce(string_agg(id::text || coalesce(name, ''), '' ORDER BY id), '')) FROM tags;")
ck_dt=$(run_psql -c "SELECT md5(coalesce(string_agg(document_id::text || tag_id::text, '' ORDER BY document_id, tag_id), '')) FROM document_tags;")

printf '{"tables":{%s},"sequences":{%s},"checksums":{"user":"%s","documents":"%s","tags":"%s","document_tags":"%s"}}\n' \
  "$table_part" "$seq_part" "$ck_user" "$ck_docs" "$ck_tags" "$ck_dt"
