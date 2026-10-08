import type { DocumentChatProviderId } from '../infrastructure/chat/chat-provider.types.js';
import type { ChatProviderAvailability } from './resolve-effective-document-chat-provider.js';

/** Customer settings/UI only — never mock or dev-only ollama full-text. */
const CUSTOMER_CHAT_PROVIDERS: DocumentChatProviderId[] = ['rag-ollama', 'donut-ml'];

function isAvailable(
  id: DocumentChatProviderId,
  providers: ChatProviderAvailability[]
): boolean {
  const entry = providers.find((p) => p.id === id);
  if (!entry) {
    return false;
  }
  return entry.available !== false;
}

export function isCustomerFacingDocumentChatProvider(
  id: DocumentChatProviderId
): boolean {
  return CUSTOMER_CHAT_PROVIDERS.includes(id);
}

/**
 * Provider used for document chat in the product UI — never the embedding/context dump.
 */
function normalizeCustomerPreference(
  preferred: DocumentChatProviderId
): DocumentChatProviderId {
  if (preferred === 'ollama') {
    return 'rag-ollama';
  }
  return preferred;
}

export function resolveCustomerDocumentChatProvider(
  preferred: DocumentChatProviderId,
  providers: ChatProviderAvailability[]
): DocumentChatProviderId {
  if (preferred === 'off') {
    return 'off';
  }

  const normalizedPreferred = normalizeCustomerPreference(preferred);

  const tryOrder: DocumentChatProviderId[] = [];
  if (isCustomerFacingDocumentChatProvider(normalizedPreferred)) {
    tryOrder.push(normalizedPreferred);
  }
  for (const id of CUSTOMER_CHAT_PROVIDERS) {
    if (!tryOrder.includes(id)) {
      tryOrder.push(id);
    }
  }

  for (const id of tryOrder) {
    if (isAvailable(id, providers)) {
      return id;
    }
  }
  return 'off';
}
