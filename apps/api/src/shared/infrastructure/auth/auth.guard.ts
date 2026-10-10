// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyRequest } from 'fastify';

import { InstallationMembershipService } from '../../../modules/auth/infrastructure/installation-membership.service.js';
import type { AuthorizationSubject } from '../../domain/authorization.js';
import { auth } from './better-auth.config.js';
import { IS_PUBLIC_ROUTE_KEY } from './public.decorator.js';
import { ServiceApiKeyRegistry } from './service-api-key.registry.js';
import { buildUserAuthorizationSubject } from './user-authorization-subject.js';

export interface AuthSession {
  user: { id: string; email: string; name: string; role?: string | null };
  session: { id: string; token: string };
}

export type AuthenticatedRequest = FastifyRequest & {
  authSession?: AuthSession;
  authSubject?: AuthorizationSubject;
};

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
export class AuthGuard implements CanActivate {
  constructor(
    private readonly apiKeys: ServiceApiKeyRegistry,
    private readonly reflector: Reflector,
    private readonly installationMembership: InstallationMembershipService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const service = this.apiKeys.resolve(extractApiKey(req));
    if (service) {
      const membership = await this.installationMembership.loadForUser(service.subject.tenantId);
      if (membership.suspended) {
        throw new UnauthorizedException('Account suspended');
      }
      req.authSession = {
        user: service.sessionUser,
        session: { id: `service:${service.subject.id}`, token: 'service' },
      };
      req.authSubject = service.subject;
      return true;
    }

    const headers = fromNodeHeaders(req.headers);
    const session = await auth.api.getSession({ headers });
    if (!session?.user) {
      throw new UnauthorizedException('Not authenticated');
    }
    const membership = await this.installationMembership.loadForUser(session.user.id);
    if (membership.suspended) {
      throw new UnauthorizedException('Account suspended');
    }
    req.authSession = session;
    req.authSubject = buildUserAuthorizationSubject({
      id: session.user.id,
      installationRole: this.installationMembership.instanceRoleFor(membership),
    });
    return true;
  }
}

export const Session = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSession => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.authSession) {
      throw new UnauthorizedException('Not authenticated');
    }
    return req.authSession;
  }
);

export const AuthSubject = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthorizationSubject => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.authSubject) {
      throw new UnauthorizedException('Not authenticated');
    }
    return req.authSubject;
  }
);
