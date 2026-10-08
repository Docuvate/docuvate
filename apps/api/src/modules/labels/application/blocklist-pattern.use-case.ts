import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_CHAT_PORT,
  LABEL_EMBEDDING_REPOSITORY,
  type DocumentChatPort,
  type LabelEmbeddingRepository,
} from '../../../shared/domain/ports.js';
import { ValidationError } from '../../../shared/domain/errors.js';
import { EffectiveDocumentChatProviderUseCase } from '../../settings/application/effective-document-chat-provider.use-case.js';
import {
  compileBlocklistPattern,
  parseBlocklistPatternProposal,
} from '../domain/recommendation-blocklist.js';

@Injectable()
export class ProposeBlocklistPatternUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(DOCUMENT_CHAT_PORT) private readonly chat: DocumentChatPort,
    private readonly effectiveChat: EffectiveDocumentChatProviderUseCase
  ) {}

  async execute(userId: string, phrases: string[]) {
    const unique = [...new Set(phrases.map((p) => p.trim()).filter((p) => p.length >= 2))];
    if (unique.length < 2) {
      throw new ValidationError('Mindestens zwei Begriffe für ein Muster nötig');
    }

    const { effective } = await this.effectiveChat.executeForUser(userId);
    if (effective === 'off') {
      return {
        configured: false,
        setupHint:
          'Unter Einstellungen → Dokument-Chat einen Provider wählen, um Regex-Muster vorschlagen zu lassen.',
      };
    }

    const prompt = [
      'Du hilfst bei einer Label-Blockliste für Dokumente.',
      `Blockierte Begriffe: ${unique.map((p) => JSON.stringify(p)).join(', ')}`,
      'Erzeuge ein JavaScript-RegExp-Muster (ohne /…/ und ohne Flags), das diese Begriffe und typische Schreibvarianten abdeckt.',
      'Antworte ausschließlich mit JSON: {"pattern":"...","explanation":"kurze Begründung auf Deutsch"}',
    ].join('\n');

    const chatResult = await this.chat.chat(
      prompt,
      [],
      { title: '', filename: '', text: '', fields: [] },
      { providerId: effective }
    );

    if (!chatResult.configured) {
      return {
        configured: false,
        setupHint:
          chatResult.setupHint ??
          'Chat-Provider ist nicht erreichbar. Literale Blockliste funktioniert weiterhin.',
      };
    }

    const parsed = parseBlocklistPatternProposal(chatResult.reply.content);
    if (!parsed) {
      return {
        configured: true,
        setupHint: 'Das Modell lieferte kein gültiges Muster. Bitte erneut versuchen.',
      };
    }

    const re = compileBlocklistPattern(parsed.pattern);
    if (!re) {
      return {
        configured: true,
        setupHint: 'Das vorgeschlagene Muster ist ungültig.',
      };
    }

    const matched = unique.filter((phrase) => re.test(phrase));
    if (matched.length < 2) {
      return {
        configured: true,
        setupHint: 'Das Muster deckt zu wenige der blockierten Begriffe ab.',
      };
    }

    return {
      configured: true,
      proposal: {
        pattern: parsed.pattern,
        explanation: parsed.explanation,
        phrases: unique,
      },
    };
  }
}

@Injectable()
export class ConfirmBlocklistPatternUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository
  ) {}

  execute(userId: string, pattern: string) {
    const trimmed = pattern.trim();
    if (!compileBlocklistPattern(trimmed)) {
      throw new ValidationError('Ungültiges Regex-Muster');
    }
    if (trimmed.length > 200) {
      throw new ValidationError('Muster ist zu lang');
    }
    return this.labelEmbeddings.addRecommendationBlocklistPattern(userId, trimmed);
  }
}

@Injectable()
export class RemoveBlocklistPatternUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository
  ) {}

  execute(userId: string, patternId: string): Promise<void> {
    return this.labelEmbeddings.removeRecommendationBlocklistPattern(userId, patternId);
  }
}
