import type {
  SftpIngressAccountDto,
  SftpIngressCreateAccountResponseDto,
  SftpIngressEventDto,
  SftpIngressServerInfoDto,
} from '@docuvate/contracts';
import type { SftpIngressAccountEntity, SftpIngressEventEntity } from '../domain/sftp-ingress.types.js';

export function toSftpIngressAccountDto(entity: SftpIngressAccountEntity): SftpIngressAccountDto {
  return {
    id: entity.id,
    displayName: entity.displayName,
    username: entity.username,
    hasPassword: Boolean(entity.passwordHash),
    hasSshPublicKey: Boolean(entity.sshPublicKey),
    folderId: entity.folderId,
    labelIds: entity.labelIds,
    mapSubfolders: entity.mapSubfolders,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function toSftpIngressEventDto(entity: SftpIngressEventEntity): SftpIngressEventDto {
  return {
    id: entity.id,
    accountId: entity.accountId,
    filename: entity.filename,
    remotePath: entity.remotePath,
    status: entity.status,
    reasonKey: entity.reasonKey,
    reasonDetail: entity.reasonDetail,
    documentId: entity.documentId,
    createdAt: entity.createdAt.toISOString(),
  };
}

export function toSftpIngressServerInfoDto(info: {
  host: string;
  port: number;
  hostKeyFingerprintSha256: string | null;
}): SftpIngressServerInfoDto {
  return info;
}

export function toCreateAccountResponse(
  account: SftpIngressAccountEntity,
  passwordPlain: string | null,
  server: SftpIngressServerInfoDto
): SftpIngressCreateAccountResponseDto {
  return {
    account: toSftpIngressAccountDto(account),
    passwordPlain,
    server,
  };
}
