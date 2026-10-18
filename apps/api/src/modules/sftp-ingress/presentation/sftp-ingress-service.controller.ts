// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { IngestSftpMultipartUseCase } from '../application/ingest-sftp-multipart.use-case.js';
import { RecordSftpAuditUseCase } from '../application/record-sftp-audit.use-case.js';
import {
  AuthenticateSftpIngressAccountUseCase,
  ResolveSftpIngressAccountUseCase,
} from '../application/sftp-ingress.use-cases.js';
import { SftpAuthenticateRateLimiter } from '../infrastructure/sftp-authenticate-rate-limiter.js';
import {
  SftpIngressServiceAuditDto,
  SftpIngressServiceAuthenticateDto,
  SftpIngressServiceResolveDto,
} from './dtos/sftp-ingress-service.dto.js';
import { toSftpIngressEventDto } from './sftp-ingress.mapper.js';
import { SftpIngressServiceGuard } from './sftp-ingress-service.guard.js';

@ApiExcludeController()
@ApiDocuvateController('sftp-ingress/service')
@Controller('sftp-ingress/service')
@UseGuards(SftpIngressServiceGuard)
export class SftpIngressServiceController {
  constructor(
    private readonly authenticate: AuthenticateSftpIngressAccountUseCase,
    private readonly ingestMultipart: IngestSftpMultipartUseCase,
    private readonly resolveAccount: ResolveSftpIngressAccountUseCase,
    private readonly recordAudit: RecordSftpAuditUseCase,
    private readonly authRateLimiter: SftpAuthenticateRateLimiter
  ) {}

  @Post('audit')
  @ApiDocuvateRoute({
    operationId: 'recordSftpIngressAudit',
    summary: 'Record SFTP ingress audit event',
  })
  async audit(@Body() body: SftpIngressServiceAuditDto) {
    await this.recordAudit.execute(body);
    return { ok: true };
  }

  @Post('authenticate')
  @ApiDocuvateRoute({
    operationId: 'authenticateSftpIngressAccount',
    summary: 'Validate SFTP ingress credentials (service)',
  })
  async auth(
    @Body() body: SftpIngressServiceAuthenticateDto,
    @Req() req: FastifyRequest
  ): Promise<{ accountId: string; userId: string }> {
    const clientIp =
      (typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'] : '') ||
      req.ip ||
      'unknown';
    this.authRateLimiter.assertAllowed(clientIp);
    const account = await this.authenticate.execute(body);
    return { accountId: account.id, userId: account.userId };
  }

  @Post('resolve')
  @ApiDocuvateRoute({
    operationId: 'resolveSftpIngressAccount',
    summary: 'Resolve account after SSH auth',
  })
  async resolve(@Body() body: SftpIngressServiceResolveDto) {
    const account = await this.resolveAccount.execute(body.username);
    return { accountId: account.id, userId: account.userId };
  }

  @Post('ingest')
  @ApiDocuvateRoute({
    operationId: 'ingestSftpScan',
    summary: 'Ingest completed SFTP scan (service)',
  })
  async ingestScan(@Req() req: FastifyRequest) {
    const parsed = await this.ingestMultipart.parseRequest(req);
    const result = await this.ingestMultipart.execute(parsed);
    return {
      documentId: result.documentId,
      event: toSftpIngressEventDto(result.event),
    };
  }
}
