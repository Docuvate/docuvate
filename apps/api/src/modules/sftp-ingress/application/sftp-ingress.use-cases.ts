// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash, randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  FOLDER_REPOSITORY,
  type FolderRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { UploadDocumentUseCase } from '../../documents/application/upload-document.use-case.js';
import { validateScanFile } from '../domain/scan-file-validation.js';
import {
  SFTP_INGRESS_ACCOUNT_REPOSITORY,
  SFTP_INGRESS_EVENT_REPOSITORY,
  type SftpIngressAccountRepository,
  type SftpIngressEventRepository,
} from '../domain/sftp-ingress.ports.js';
import type {
  SftpIngressAccountEntity,
  SftpIngressEventEntity,
} from '../domain/sftp-ingress.types.js';
import {
  hashSftpIngressPassword,
  verifySftpIngressPassword,
} from '../infrastructure/sftp-ingress-password.codec.js';
import { resolveFolderFromRemotePath } from './resolve-remote-folder.js';

function readMaxBytes(): number {
  const raw = process.env.DOCUVATE_SFTP_INGEST_MAX_BYTES;
  const parsed = raw ? Number(raw) : 26_214_400;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 26_214_400;
}

function readServerInfo() {
  const host = process.env.DOCUVATE_SFTP_PUBLIC_HOST?.trim() ?? 'localhost';
  const port = Number(process.env.DOCUVATE_SFTP_PUBLIC_PORT ?? 2222);
  const fingerprintRaw = process.env.DOCUVATE_SFTP_HOST_KEY_FINGERPRINT?.trim() ?? '';
  const fingerprint = fingerprintRaw.length > 0 ? fingerprintRaw : null;
  return { host, port: Number.isFinite(port) ? port : 2222, hostKeyFingerprintSha256: fingerprint };
}

function generatePassword(): string {
  return randomBytes(18).toString('base64url');
}

function generateUsername(userId: string): string {
  const suffix = createHash('sha256').update(userId).digest('hex').slice(0, 8);
  return `scan-${suffix}`;
}

@Injectable()
export class GetSftpIngressServerInfoUseCase {
  execute() {
    return readServerInfo();
  }
}

@Injectable()
export class ListSftpIngressAccountsUseCase {
  constructor(
    @Inject(SFTP_INGRESS_ACCOUNT_REPOSITORY) private readonly accounts: SftpIngressAccountRepository
  ) {}

  execute(userId: string): Promise<SftpIngressAccountEntity[]> {
    return this.accounts.listForUser(userId);
  }
}

@Injectable()
export class ListSftpIngressEventsUseCase {
  constructor(
    @Inject(SFTP_INGRESS_ACCOUNT_REPOSITORY)
    private readonly accounts: SftpIngressAccountRepository,
    @Inject(SFTP_INGRESS_EVENT_REPOSITORY) private readonly events: SftpIngressEventRepository
  ) {}

  async execute(userId: string, accountId: string, limit = 20): Promise<SftpIngressEventEntity[]> {
    const account = await this.accounts.findByIdForUser(accountId, userId);
    if (!account) throw new NotFoundError('SftpIngressAccount');
    return this.events.listForAccount(accountId, userId, Math.min(Math.max(limit, 1), 100));
  }
}

export interface CreateSftpIngressAccountResult {
  account: SftpIngressAccountEntity;
  passwordPlain: string | null;
  server: ReturnType<typeof readServerInfo>;
}

@Injectable()
export class CreateSftpIngressAccountUseCase {
  constructor(
    @Inject(SFTP_INGRESS_ACCOUNT_REPOSITORY)
    private readonly accounts: SftpIngressAccountRepository,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository
  ) {}

  async execute(
    userId: string,
    input: {
      displayName: string;
      username?: string;
      passwordPlain?: string | null;
      sshPublicKey?: string | null;
      folderId?: string | null;
      labelIds?: string[];
      mapSubfolders?: boolean;
    }
  ): Promise<CreateSftpIngressAccountResult> {
    const displayName = input.displayName.trim();
    if (!displayName) {
      throw new ValidationError('sftpIngress.errors.displayNameRequired');
    }
    const username = await this.allocateUsername(
      userId,
      input.username?.trim() ? input.username.trim().toLowerCase() : null
    );
    if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) {
      throw new ValidationError('sftpIngress.errors.usernameInvalid');
    }
    const folderIdRaw = input.folderId?.trim() ?? '';
    const folderId = folderIdRaw.length > 0 ? folderIdRaw : null;
    if (folderId) {
      const folder = await this.folders.findByIdForUser(folderId, userId);
      if (!folder) throw new NotFoundError('Folder');
    }
    const labelIds = input.labelIds ?? [];
    for (const tagId of labelIds) {
      const tag = await this.taxonomy.findTagByIdForUser(tagId, userId);
      if (!tag) throw new NotFoundError('Tag');
    }
    const passwordPlain = input.passwordPlain ?? generatePassword();
    if (passwordPlain && passwordPlain.length < 16) {
      throw new ValidationError('sftpIngress.errors.passwordTooShort');
    }
    const sshPublicKeyRaw = input.sshPublicKey?.trim() ?? '';
    const sshPublicKey = sshPublicKeyRaw.length > 0 ? sshPublicKeyRaw : null;
    if (!passwordPlain && !sshPublicKey) {
      throw new ValidationError('sftpIngress.errors.authRequired');
    }
    const passwordHash = passwordPlain ? await hashSftpIngressPassword(passwordPlain) : null;
    const account = await this.accounts.create({
      userId,
      displayName,
      username,
      passwordPlain: null,
      sshPublicKey,
      folderId,
      labelIds,
      mapSubfolders: Boolean(input.mapSubfolders),
      passwordHash,
    });
    return {
      account,
      passwordPlain: passwordPlain.length > 0 ? passwordPlain : null,
      server: readServerInfo(),
    };
  }

  private async allocateUsername(userId: string, preferred: string | null): Promise<string> {
    if (preferred) {
      const existing = await this.accounts.findActiveByUsername(preferred);
      if (existing) {
        throw new ValidationError('sftpIngress.errors.usernameTaken');
      }
      return preferred;
    }
    for (let attempt = 0; attempt < 8; attempt++) {
      const suffix = attempt === 0 ? '' : `-${randomBytes(2).toString('hex')}`;
      const candidate = `${generateUsername(userId)}${suffix}`;
      const existing = await this.accounts.findActiveByUsername(candidate);
      if (!existing) {
        return candidate;
      }
    }
    throw new ValidationError('sftpIngress.errors.usernameTaken');
  }
}

@Injectable()
export class RevokeSftpIngressAccountUseCase {
  constructor(
    @Inject(SFTP_INGRESS_ACCOUNT_REPOSITORY) private readonly accounts: SftpIngressAccountRepository
  ) {}

  async execute(userId: string, accountId: string): Promise<void> {
    const ok = await this.accounts.revoke(accountId, userId);
    if (!ok) throw new NotFoundError('SftpIngressAccount');
  }
}

@Injectable()
export class AuthenticateSftpIngressAccountUseCase {
  constructor(
    @Inject(SFTP_INGRESS_ACCOUNT_REPOSITORY) private readonly accounts: SftpIngressAccountRepository
  ) {}

  async execute(input: {
    username: string;
    password?: string;
    publicKey?: string;
  }): Promise<SftpIngressAccountEntity> {
    try {
      const account = await this.accounts.findActiveByUsername(input.username);
      if (!account) {
        throw new ValidationError('sftpIngress.errors.authFailed');
      }
      if (input.publicKey?.trim()) {
        const normalized = input.publicKey.trim();
        if (account.sshPublicKey?.trim() === normalized) {
          return account;
        }
      }
      if (input.password && account.passwordHash) {
        const ok = await verifySftpIngressPassword(input.password, account.passwordHash);
        if (ok) {
          return account;
        }
      }
      throw new ValidationError('sftpIngress.errors.authFailed');
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new ValidationError('sftpIngress.errors.authFailed');
    }
  }
}

@Injectable()
export class ResolveSftpIngressAccountUseCase {
  constructor(
    @Inject(SFTP_INGRESS_ACCOUNT_REPOSITORY) private readonly accounts: SftpIngressAccountRepository
  ) {}

  async execute(username: string): Promise<SftpIngressAccountEntity> {
    const account = await this.accounts.findActiveByUsername(username);
    if (!account) throw new ValidationError('sftpIngress.errors.accountNotFound');
    return account;
  }
}

@Injectable()
export class IngestSftpScanUseCase {
  constructor(
    @Inject(SFTP_INGRESS_ACCOUNT_REPOSITORY)
    private readonly accounts: SftpIngressAccountRepository,
    @Inject(SFTP_INGRESS_EVENT_REPOSITORY) private readonly events: SftpIngressEventRepository,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    private readonly uploadDocument: UploadDocumentUseCase
  ) {}

  async execute(input: {
    accountId: string;
    filename: string;
    remotePath: string | null;
    buffer: Buffer;
  }): Promise<{ documentId: string | null; event: SftpIngressEventEntity }> {
    const active = await this.accounts.findActiveById(input.accountId);
    if (!active) {
      throw new ValidationError('sftpIngress.errors.accountNotFound');
    }
    const maxBytes = readMaxBytes();
    const validation = validateScanFile(input.filename, input.buffer, maxBytes);
    if (!validation.ok) {
      const event = await this.events.create({
        accountId: active.id,
        userId: active.userId,
        filename: input.filename,
        remotePath: input.remotePath,
        status: 'rejected',
        reasonKey: validation.reasonKey,
      });
      return { documentId: null, event };
    }
    const folders = await this.folders.listForUser(active.userId);
    const folderId = resolveFolderFromRemotePath(
      folders,
      active.folderId,
      input.remotePath ?? validation.filename,
      active.mapSubfolders
    );
    const tagIds: string[] = [];
    for (const tagId of active.labelIds) {
      const tag = await this.taxonomy.findTagByIdForUser(tagId, active.userId);
      if (tag) tagIds.push(tag.id);
    }
    try {
      const doc = await this.uploadDocument.execute({
        userId: active.userId,
        filename: validation.filename,
        mimeType: validation.mimeType,
        buffer: input.buffer,
        folderId,
        tagIds: tagIds.length ? tagIds : undefined,
        ingestSource: 'scanner_sftp',
      });
      const event = await this.events.create({
        accountId: active.id,
        userId: active.userId,
        filename: validation.filename,
        remotePath: input.remotePath,
        status: 'processed',
        documentId: doc.id,
      });
      return { documentId: doc.id, event };
    } catch (err: unknown) {
      const reasonKey =
        err instanceof ValidationError && typeof err.message === 'string'
          ? err.message
          : 'sftpIngress.errors.processingFailed';
      const event = await this.events.create({
        accountId: active.id,
        userId: active.userId,
        filename: validation.filename,
        remotePath: input.remotePath,
        status: 'rejected',
        reasonKey,
      });
      return { documentId: null, event };
    }
  }
}
