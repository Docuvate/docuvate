import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ConnectorOAuthCallbackGuard } from './connector-oauth-callback.guard.js';
import { AuthGuard, Session, type AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { Public } from '../../../shared/infrastructure/auth/public.decorator.js';
import { ConnectorPluginIdParamDto } from '../../../shared/presentation/dtos/connectors.dto.js';
import { StartMailOAuthRequestDto } from '../../../shared/presentation/dtos/connector-actions.dto.js';
import {
  CompleteMailOAuthUseCase,
  StartMailOAuthUseCase,
} from '../application/mail-oauth.use-cases.js';
import {
  ApiDocuvatePublicRoute,
  ApiDocuvateRoute,
  ApiDocuvateTaggedController,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { ApiDocuvateAuth } from '../../../shared/presentation/swagger/openapi-security.js';

function webConnectorsUrl(query: Record<string, string>): string {
  const origin = (process.env['WEB_ORIGIN'] ?? 'http://localhost:5173').replace(/\/$/, '');
  const params = new URLSearchParams(query);
  return `${origin}/settings/connectors?${params.toString()}`;
}

@ApiDocuvateTaggedController('connectors')
@Controller('connectors/oauth')
export class ConnectorsOAuthController {
  constructor(
    private readonly startOAuth: StartMailOAuthUseCase,
    private readonly completeOAuth: CompleteMailOAuthUseCase
  ) {}

  @Post(':pluginId/start')
  @UseGuards(AuthGuard)
  @ApiDocuvateAuth()
  @ApiDocuvateRoute({ operationId: 'startConnectorOAuth', summary: 'Start OAuth for connector plugin' })
  start(
    @Session() session: AuthSession,
    @Param() params: ConnectorPluginIdParamDto,
    @Body() body: StartMailOAuthRequestDto
  ) {
    const pluginId = params.pluginId;
    if (pluginId !== 'gmail' && pluginId !== 'outlook') {
      return { authorizationUrl: null };
    }
    return this.startOAuth.execute({
      pluginId,
      userId: session.user.id,
      displayName: body.displayName,
      accountHint: body.accountHint,
    });
  }

  @Public()
  @Get('callback')
  @UseGuards(ConnectorOAuthCallbackGuard)
  @ApiDocuvatePublicRoute({
    operationId: 'connectorOAuthCallback',
    summary: 'OAuth callback (browser redirect)',
  })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() reply: FastifyReply
  ): Promise<void> {
    if (error || !code || !state) {
      await reply.redirect(webConnectorsUrl({ oauth: 'error' }), 302);
      return;
    }
    try {
      const result = await this.completeOAuth.execute({ code, state });
      await reply.redirect(
        webConnectorsUrl({
          oauth: 'success',
          pluginId: result.pluginId,
        }),
        302
      );
    } catch {
      await reply.redirect(webConnectorsUrl({ oauth: 'error' }), 302);
    }
  }
}
