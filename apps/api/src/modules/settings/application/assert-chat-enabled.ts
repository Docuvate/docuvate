// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ConflictError } from '../../../shared/domain/errors.js';
import type { DocumentChatProviderId } from '../../../shared/infrastructure/chat/chat-provider.types.js';

export function assertChatEnabled(customerEffective: DocumentChatProviderId): void {
  if (customerEffective === 'off') {
    throw new ConflictError(
      'Chat ist in den Einstellungen deaktiviert. Aktivieren Sie ihn unter Einstellungen › Chat.'
    );
  }
}
