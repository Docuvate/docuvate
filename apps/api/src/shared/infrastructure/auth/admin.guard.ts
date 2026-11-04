// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { ForbiddenError } from '../../domain/errors.js';
import { subjectIsInstanceAdministrator } from '../../domain/user-authorization-subject.js';
import type { AuthenticatedRequest } from './auth.guard.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const subject = req.authSubject;
    if (!subject || !subjectIsInstanceAdministrator(subject)) {
      throw new ForbiddenError();
    }
    return true;
  }
}
