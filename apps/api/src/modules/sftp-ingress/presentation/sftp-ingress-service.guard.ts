// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ServiceApiKeyRegistry } from '../../../shared/infrastructure/auth/service-api-key.registry.js';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/auth/auth.guard.js';

const REQUIRED_CLAIM = 'sftp_ingress:service';

function extractApiKey(req: FastifyRequest): string | undefined {
  const header = req.headers['x-docuvate-api-key'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  return undefined;
}

@Injectable()
export class SftpIngressServiceGuard implements CanActivate {
  constructor(private readonly apiKeys: ServiceApiKeyRegistry) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const service = this.apiKeys.resolve(extractApiKey(req));
    if (!service) {
      throw new UnauthorizedException('Not authenticated');
    }
    if (!service.subject.claims.includes(REQUIRED_CLAIM)) {
      throw new ForbiddenException('Missing service claim');
    }
    req.authSession = {
      user: service.sessionUser,
      session: { id: `service:${service.subject.id}`, token: 'service' },
    };
    req.authSubject = service.subject;
    return true;
  }
}
