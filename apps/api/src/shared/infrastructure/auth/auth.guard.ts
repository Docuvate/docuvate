import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_ROUTE_KEY } from './public.decorator.js';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyRequest } from 'fastify';
import type { AuthorizationSubject } from '../../domain/authorization.js';
import { auth } from './better-auth.config.js';
import { ServiceApiKeyRegistry } from './service-api-key.registry.js';

export type AuthSession = {
  user: { id: string; email: string; name: string };
  session: { id: string; token: string };
};

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
    private readonly reflector: Reflector
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
      req.authSession = {
        user: service.sessionUser,
        session: { id: `service:${service.subject.id}`, token: 'service' },
      };
      req.authSubject = service.subject;
      return true;
    }

    const headers = fromNodeHeaders(req.headers as Record<string, string | string[] | undefined>);
    const session = await auth.api.getSession({ headers });
    if (!session?.user) {
      throw new UnauthorizedException('Not authenticated');
    }
    req.authSession = session as AuthSession;
    req.authSubject = {
      kind: 'user',
      id: session.user.id,
      tenantId: session.user.id,
      roles: ['owner'],
      claims: ['document:*'],
    };
    return true;
  }
}

export const Session = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthSession => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!req.authSession) {
    throw new UnauthorizedException('Not authenticated');
  }
  return req.authSession;
});

export const AuthSubject = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthorizationSubject => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.authSubject) {
      throw new UnauthorizedException('Not authenticated');
    }
    return req.authSubject;
  }
);
