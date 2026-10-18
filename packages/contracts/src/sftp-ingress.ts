// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type SftpIngressEventStatus = 'received' | 'processed' | 'rejected';

export interface SftpIngressServerInfoDto {
  host: string;
  port: number;
  hostKeyFingerprintSha256: string | null;
}

export interface SftpIngressAccountDto {
  id: string;
  displayName: string;
  username: string;
  hasPassword: boolean;
  hasSshPublicKey: boolean;
  folderId: string | null;
  labelIds: string[];
  mapSubfolders: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SftpIngressEventDto {
  id: string;
  accountId: string;
  filename: string;
  remotePath: string | null;
  status: SftpIngressEventStatus;
  reasonKey: string | null;
  reasonDetail: string | null;
  documentId: string | null;
  createdAt: string;
}

export interface SftpIngressCreateAccountRequest {
  displayName: string;
  username?: string;
  passwordPlain?: string | null;
  sshPublicKey?: string | null;
  folderId?: string | null;
  labelIds?: string[];
  mapSubfolders?: boolean;
}

export interface SftpIngressCreateAccountResponseDto {
  account: SftpIngressAccountDto;
  passwordPlain: string | null;
  server: SftpIngressServerInfoDto;
}

export interface SftpFetchHostProbeRequest {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface SftpFetchHostProbeResponse {
  hostKeyFingerprintSha256: string;
}
