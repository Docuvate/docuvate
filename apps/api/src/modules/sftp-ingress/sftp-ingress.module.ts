// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module.js';
import {
  SFTP_INGRESS_ACCOUNT_REPOSITORY,
  SFTP_INGRESS_EVENT_REPOSITORY,
} from './domain/sftp-ingress.ports.js';
import {
  AuthenticateSftpIngressAccountUseCase,
  CreateSftpIngressAccountUseCase,
  GetSftpIngressServerInfoUseCase,
  IngestSftpScanUseCase,
  ListSftpIngressAccountsUseCase,
  ListSftpIngressEventsUseCase,
  RevokeSftpIngressAccountUseCase,
  ResolveSftpIngressAccountUseCase,
} from './application/sftp-ingress.use-cases.js';
import {
  PgSftpIngressAccountRepository,
  PgSftpIngressEventRepository,
} from './infrastructure/pg-sftp-ingress.repository.js';
import { IngestSftpMultipartUseCase } from './application/ingest-sftp-multipart.use-case.js';
import { RecordSftpAuditUseCase } from './application/record-sftp-audit.use-case.js';
import { PgSftpIngressAuditRepository } from './infrastructure/pg-sftp-ingress-audit.repository.js';
import { SftpIngressController } from './presentation/sftp-ingress.controller.js';
import { SftpIngressServiceController } from './presentation/sftp-ingress-service.controller.js';
import { SftpAuthenticateRateLimiter } from './infrastructure/sftp-authenticate-rate-limiter.js';

@Module({
  imports: [DocumentsModule],
  controllers: [SftpIngressController, SftpIngressServiceController],
  providers: [
    { provide: SFTP_INGRESS_ACCOUNT_REPOSITORY, useClass: PgSftpIngressAccountRepository },
    { provide: SFTP_INGRESS_EVENT_REPOSITORY, useClass: PgSftpIngressEventRepository },
    GetSftpIngressServerInfoUseCase,
    ListSftpIngressAccountsUseCase,
    CreateSftpIngressAccountUseCase,
    RevokeSftpIngressAccountUseCase,
    ListSftpIngressEventsUseCase,
    AuthenticateSftpIngressAccountUseCase,
    ResolveSftpIngressAccountUseCase,
    IngestSftpScanUseCase,
    IngestSftpMultipartUseCase,
    PgSftpIngressAuditRepository,
    RecordSftpAuditUseCase,
    SftpAuthenticateRateLimiter,
  ],
  exports: [IngestSftpScanUseCase, AuthenticateSftpIngressAccountUseCase],
})
export class SftpIngressModule {}
