import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type {
  SftpIngressAccountRepository,
  SftpIngressEventRepository,
} from '../domain/sftp-ingress.ports.js';
import type {
  CreateSftpIngressAccountInput,
  SftpIngressAccountEntity,
  SftpIngressEventEntity,
  SftpIngressEventStatus,
} from '../domain/sftp-ingress.types.js';

async function loadLabelIds(client: Pool | PoolClient, accountId: string): Promise<string[]> {
  const { rows } = await client.query(
    `SELECT tag_id::text AS tag_id FROM sftp_ingress_account_labels WHERE account_id = $1 ORDER BY tag_id`,
    [accountId]
  );
  return rows.map((row) => String(row['tag_id']));
}

async function mapAccount(
  client: Pool | PoolClient,
  row: Record<string, unknown>
): Promise<SftpIngressAccountEntity> {
  const id = String(row['id']);
  const labelIds = row['label_ids'] != null ? (row['label_ids'] as string[]) : await loadLabelIds(client, id);
  return {
    id,
    userId: String(row['user_id']),
    displayName: String(row['display_name']),
    username: String(row['username']),
    passwordHash: row['password_hash'] != null ? String(row['password_hash']) : null,
    sshPublicKey: row['ssh_public_key'] != null ? String(row['ssh_public_key']) : null,
    folderId: row['folder_id'] != null ? String(row['folder_id']) : null,
    labelIds: Array.isArray(labelIds) ? labelIds.map(String) : [],
    mapSubfolders: Boolean(row['map_subfolders']),
    revokedAt: row['revoked_at'] ? new Date(String(row['revoked_at'])) : null,
    createdAt: new Date(String(row['created_at'])),
    updatedAt: new Date(String(row['updated_at'])),
  };
}

function mapEvent(row: Record<string, unknown>, ownerUserId: string): SftpIngressEventEntity {
  return {
    id: String(row['id']),
    accountId: String(row['account_id']),
    userId: ownerUserId,
    filename: String(row['filename']),
    remotePath: row['remote_path'] != null ? String(row['remote_path']) : null,
    status: String(row['status']) as SftpIngressEventStatus,
    reasonKey: row['reason_key'] != null ? String(row['reason_key']) : null,
    reasonDetail: row['reason_detail'] != null ? String(row['reason_detail']) : null,
    documentId: row['document_id'] != null ? String(row['document_id']) : null,
    createdAt: new Date(String(row['created_at'])),
  };
}

async function replaceAccountLabels(
  client: PoolClient,
  accountId: string,
  labelIds: string[]
): Promise<void> {
  await client.query(`DELETE FROM sftp_ingress_account_labels WHERE account_id = $1`, [accountId]);
  for (const tagId of labelIds) {
    await client.query(
      `INSERT INTO sftp_ingress_account_labels (account_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [accountId, tagId]
    );
  }
}

@Injectable()
export class PgSftpIngressAccountRepository implements SftpIngressAccountRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listForUser(userId: string): Promise<SftpIngressAccountEntity[]> {
    const { rows } = await this.pool.query(
      `SELECT a.*,
        COALESCE(
          array_agg(l.tag_id::text ORDER BY l.tag_id) FILTER (WHERE l.tag_id IS NOT NULL),
          ARRAY[]::text[]
        ) AS label_ids
       FROM sftp_ingress_accounts a
       LEFT JOIN sftp_ingress_account_labels l ON l.account_id = a.id
       WHERE a.user_id = $1 AND a.revoked_at IS NULL
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [userId]
    );
    return Promise.all(rows.map((row) => mapAccount(this.pool, row as Record<string, unknown>)));
  }

  async findByIdForUser(id: string, userId: string): Promise<SftpIngressAccountEntity | null> {
    const { rows } = await this.pool.query(
      `SELECT a.*,
        COALESCE(
          array_agg(l.tag_id::text ORDER BY l.tag_id) FILTER (WHERE l.tag_id IS NOT NULL),
          ARRAY[]::text[]
        ) AS label_ids
       FROM sftp_ingress_accounts a
       LEFT JOIN sftp_ingress_account_labels l ON l.account_id = a.id
       WHERE a.id = $1 AND a.user_id = $2 AND a.revoked_at IS NULL
       GROUP BY a.id`,
      [id, userId]
    );
    const row = rows[0];
    return row ? mapAccount(this.pool, row as Record<string, unknown>) : null;
  }

  async findActiveByUsername(username: string): Promise<SftpIngressAccountEntity | null> {
    const { rows } = await this.pool.query(
      `SELECT a.*,
        COALESCE(
          array_agg(l.tag_id::text ORDER BY l.tag_id) FILTER (WHERE l.tag_id IS NOT NULL),
          ARRAY[]::text[]
        ) AS label_ids
       FROM sftp_ingress_accounts a
       LEFT JOIN sftp_ingress_account_labels l ON l.account_id = a.id
       WHERE lower(a.username) = lower($1) AND a.revoked_at IS NULL
       GROUP BY a.id
       LIMIT 1`,
      [username.trim()]
    );
    const row = rows[0];
    return row ? mapAccount(this.pool, row as Record<string, unknown>) : null;
  }

  async findActiveById(id: string): Promise<SftpIngressAccountEntity | null> {
    const { rows } = await this.pool.query(
      `SELECT a.*,
        COALESCE(
          array_agg(l.tag_id::text ORDER BY l.tag_id) FILTER (WHERE l.tag_id IS NOT NULL),
          ARRAY[]::text[]
        ) AS label_ids
       FROM sftp_ingress_accounts a
       LEFT JOIN sftp_ingress_account_labels l ON l.account_id = a.id
       WHERE a.id = $1 AND a.revoked_at IS NULL
       GROUP BY a.id`,
      [id]
    );
    const row = rows[0];
    return row ? mapAccount(this.pool, row as Record<string, unknown>) : null;
  }

  async create(
    input: CreateSftpIngressAccountInput & { passwordHash: string | null }
  ): Promise<SftpIngressAccountEntity> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO sftp_ingress_accounts (
           user_id, display_name, username, password_hash, ssh_public_key,
           folder_id, map_subfolders
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          input.userId,
          input.displayName.trim(),
          input.username.trim(),
          input.passwordHash,
          input.sshPublicKey?.trim() || null,
          input.folderId,
          input.mapSubfolders,
        ]
      );
      const accountRow = rows[0] as Record<string, unknown>;
      const accountId = String(accountRow['id']);
      await replaceAccountLabels(client, accountId, input.labelIds);
      await client.query('COMMIT');
      return mapAccount(client, { ...accountRow, label_ids: input.labelIds });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async revoke(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `UPDATE sftp_ingress_accounts
       SET revoked_at = now(), updated_at = now()
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  }
}

@Injectable()
export class PgSftpIngressEventRepository implements SftpIngressEventRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listForAccount(accountId: string, userId: string, limit: number): Promise<SftpIngressEventEntity[]> {
    const { rows } = await this.pool.query(
      `SELECT e.*, a.user_id AS owner_user_id FROM sftp_ingress_events e
       JOIN sftp_ingress_accounts a ON a.id = e.account_id
       WHERE e.account_id = $1 AND a.user_id = $2
       ORDER BY e.created_at DESC
       LIMIT $3`,
      [accountId, userId, limit]
    );
    return rows.map((row) =>
      mapEvent(row as Record<string, unknown>, String(row['owner_user_id']))
    );
  }

  async create(input: {
    accountId: string;
    userId: string;
    filename: string;
    remotePath: string | null;
    status: SftpIngressEventStatus;
    reasonKey?: string | null;
    reasonDetail?: string | null;
    documentId?: string | null;
  }): Promise<SftpIngressEventEntity> {
    const { rows } = await this.pool.query(
      `WITH inserted AS (
         INSERT INTO sftp_ingress_events (
           account_id, filename, remote_path, status,
           reason_key, reason_detail, document_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *
       )
       SELECT i.*, a.user_id AS owner_user_id
       FROM inserted i
       JOIN sftp_ingress_accounts a ON a.id = i.account_id`,
      [
        input.accountId,
        input.filename,
        input.remotePath,
        input.status,
        input.reasonKey ?? null,
        input.reasonDetail ?? null,
        input.documentId ?? null,
      ]
    );
    const row = rows[0] as Record<string, unknown>;
    return mapEvent(row, String(row['owner_user_id']));
  }
}
