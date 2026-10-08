export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message);
  }
}

export class GatewayTimeoutError extends DomainError {
  constructor(message: string) {
    super('GATEWAY_TIMEOUT', message);
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor(message: string) {
    super('SERVICE_UNAVAILABLE', message);
  }
}
