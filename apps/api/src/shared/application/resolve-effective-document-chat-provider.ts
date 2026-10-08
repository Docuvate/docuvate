import type { DocumentChatProviderId } from '../infrastructure/chat/chat-provider.types.js';

export type ChatProviderAvailability = { id: string; available?: boolean };

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

const RUNTIME_FALLBACK_ORDER: DocumentChatProviderId[] = [
  'rag-ollama',
  'context',
  'ollama',
  'donut-ml',
  'mock',
];

/**
 * Picks a chat provider that can actually run when the preferred one is unavailable
 * (e.g. Donut selected but worker image lacks the `[donut]` extra).
 */
export function resolveEffectiveDocumentChatProvider(
  preferred: DocumentChatProviderId,
  providers: ChatProviderAvailability[]
): DocumentChatProviderId {
  if (preferred === 'off') {
    return 'off';
  }
  if (isAvailable(preferred, providers)) {
    return preferred;
  }
  for (const candidate of RUNTIME_FALLBACK_ORDER) {
    if (candidate !== preferred && isAvailable(candidate, providers)) {
      return candidate;
    }
  }
  return 'off';
}
