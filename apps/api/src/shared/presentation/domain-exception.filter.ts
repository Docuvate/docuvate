import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import {
  DomainError,
  ForbiddenError,
  GatewayTimeoutError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '../domain/errors.js';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.BAD_REQUEST;
    if (exception instanceof NotFoundError) status = HttpStatus.NOT_FOUND;
    if (exception instanceof ForbiddenError) status = HttpStatus.FORBIDDEN;
    if (exception instanceof ValidationError) status = HttpStatus.UNPROCESSABLE_ENTITY;
    if (exception instanceof GatewayTimeoutError) status = HttpStatus.GATEWAY_TIMEOUT;
    if (exception instanceof ServiceUnavailableError) status = HttpStatus.SERVICE_UNAVAILABLE;

    void reply.status(status).send({
      code: exception.code,
      message: exception.message,
    });
  }
}
