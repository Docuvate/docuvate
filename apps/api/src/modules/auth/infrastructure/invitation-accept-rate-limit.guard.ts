import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { InvitationAcceptRateLimitService } from './invitation-accept-rate-limit.service.js';

@Injectable()
export class InvitationAcceptRateLimitGuard implements CanActivate {
  constructor(private readonly limits: InvitationAcceptRateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const clientIp = request.ip ?? 'unknown';
    await this.limits.assertAllowed(clientIp);
    return true;
  }
}
