// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CanActivate, Injectable } from '@nestjs/common';

/** OAuth provider redirect — session cookie may be absent; CSRF protection is in signed state. */
@Injectable()
export class ConnectorOAuthCallbackGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
