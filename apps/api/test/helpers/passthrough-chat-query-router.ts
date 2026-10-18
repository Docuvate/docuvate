// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ChatQueryRouterService } from '../../src/modules/cited-chat/application/chat-query-router.service.js';

export function passthroughChatQueryRouter(): ChatQueryRouterService {
  const router: ChatQueryRouterService = {
    route({ userMessage }) {
      return Promise.resolve({
        kind: 'document_qa',
        resolvedQuery: userMessage,
      });
    },
  };
  return router;
}
