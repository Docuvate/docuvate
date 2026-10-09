import type { DocumentChatMessageRecordDto } from '@docuvate/contracts';

/** When the server actually started work (not queue wait). */
export function chatGenerationWaitStartMs(message: DocumentChatMessageRecordDto): number | null {
  const created = Date.parse(message.createdAt);
  const updated = message.updatedAt ? Date.parse(message.updatedAt) : NaN;

  if (message.generationStatus === 'streaming') {
    return Number.isFinite(updated) ? updated : created;
  }
  if (message.generationPhase === 'generating' || message.generationPhase === 'verifying') {
    return Number.isFinite(updated) ? updated : created;
  }
  if (
    message.generationPhase === 'retrieving' &&
    Number.isFinite(updated) &&
    Number.isFinite(created) &&
    updated > created + 400
  ) {
    return updated;
  }
  return null;
}
