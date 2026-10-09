// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type SftpIngressEventStatus = 'received' | 'processed' | 'rejected';

export interface SftpIngressAccountEntity {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  passwordHash: string | null;
  sshPublicKey: string | null;
  folderId: string | null;
  labelIds: string[];
  mapSubfolders: boolean;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SftpIngressEventEntity {
  id: string;
  accountId: string;
  userId: string;
  filename: string;
  remotePath: string | null;
  status: SftpIngressEventStatus;
  reasonKey: string | null;
  reasonDetail: string | null;
  documentId: string | null;
  createdAt: Date;
}

export interface CreateSftpIngressAccountInput {
  userId: string;
  displayName: string;
  username: string;
  passwordPlain: string | null;
  sshPublicKey: string | null;
  folderId: string | null;
  labelIds: string[];
  mapSubfolders: boolean;
}

export interface SftpIngressAuthResult {
  accountId: string;
  userId: string;
  folderId: string | null;
  labelIds: string[];
  mapSubfolders: boolean;
}
