import { Inject, Injectable } from '@nestjs/common';
import {
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { resolveDocumentChatProvider } from '../../../shared/application/resolve-document-chat-provider.js';
import { resolveCustomerDocumentChatProvider } from '../../../shared/application/resolve-customer-document-chat-provider.js';
import {
  resolveEffectiveDocumentChatProvider,
  type ChatProviderAvailability,
} from '../../../shared/application/resolve-effective-document-chat-provider.js';
import type { DocumentChatProviderId } from '../../../shared/infrastructure/chat/chat-provider.types.js';
import {
  runtimeChatProviderAvailability,
  type DocumentChatProvidersCatalog,
} from './document-chat-provider-catalog.js';
import { ListDocumentChatProvidersUseCase } from './settings.use-cases.js';

export type EffectiveChatProviderResult = {
  preferred: DocumentChatProviderId;
  effective: DocumentChatProviderId;
  customerEffective: DocumentChatProviderId;
  /** Chat tab is always shown in the document UI. */
  documentChatUiEnabled: boolean;
  /** Whether send/receive is allowed (customer LLM path available). */
  documentChatAvailable: boolean;
  documentChatReadiness: 'ready' | 'starting' | 'unavailable' | 'off';
  /** Customer-facing reason when readiness is starting/unavailable (no infra jargon). */
  documentChatReadinessReason: string | null;
  documentChatOllamaModel: string | null;
  documentChatRunsOnCpu: boolean;
};

@Injectable()
export class EffectiveDocumentChatProviderUseCase {
  constructor(
    private readonly listChatProviders: ListDocumentChatProvidersUseCase,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository
  ) {}

  async executeForUser(
    userId: string,
    options?: { persistUnavailablePreferenceClear?: boolean }
  ): Promise<EffectiveChatProviderResult> {
    const row = await this.prefs.getForUser(userId);
    return this.resolveFromPreference(row.preferredChatProvider, {
      persistForUserId:
        options?.persistUnavailablePreferenceClear && row.preferredChatProvider
          ? userId
          : undefined,
    });
  }

  async resolveFromPreference(
    preferredChatProvider: string | null | undefined,
    options?: {
      persistForUserId?: string;
      providers?: ChatProviderAvailability[];
      catalog?: DocumentChatProvidersCatalog;
    }
  ): Promise<EffectiveChatProviderResult> {
    const catalog =
      options?.catalog ?? (await this.listChatProviders.execute());
    const providers =
      options?.providers ?? runtimeChatProviderAvailability(catalog);
    const preferred = resolveDocumentChatProvider(preferredChatProvider);
    const effective = resolveEffectiveDocumentChatProvider(preferred, providers);
    const customerEffective = resolveCustomerDocumentChatProvider(preferred, providers);

    const shouldClear =
      options?.persistForUserId &&
      preferredChatProvider?.trim() &&
      effective !== preferred;

    if (shouldClear && options.persistForUserId) {
      await this.prefs.upsert(options.persistForUserId, {
        preferredChatProvider: null,
      });
    }

    let documentChatAvailable = false;
    let documentChatReadiness: EffectiveChatProviderResult['documentChatReadiness'] = 'off';
    let documentChatReadinessReason: string | null = null;

    if (customerEffective === 'off') {
      documentChatReadiness = 'off';
    } else if (customerEffective === 'rag-ollama') {
      const ragReady = catalog.selectable.some((p) => p.id === 'rag-ollama');
      const ragUnavailable = catalog.unavailable.find((u) => u.id === 'rag-ollama');
      if (ragReady) {
        documentChatAvailable = true;
        documentChatReadiness = 'ready';
      } else if (ragUnavailable?.reasonCode === 'model_loading') {
        documentChatReadiness = 'starting';
        documentChatReadinessReason = 'model_loading';
      } else {
        documentChatReadiness = 'unavailable';
        documentChatReadinessReason = ragUnavailable?.reasonCode ?? 'not_configured';
      }
    } else if (customerEffective === 'donut-ml') {
      const donutReady = catalog.selectable.some((p) => p.id === 'donut-ml');
      const donutUnavailable = catalog.unavailable.find((u) => u.id === 'donut-ml');
      documentChatAvailable = donutReady;
      if (donutReady) {
        documentChatReadiness = 'ready';
      } else {
        documentChatReadiness = 'unavailable';
        documentChatReadinessReason = donutUnavailable?.reasonCode ?? 'donut_unavailable';
      }
    } else {
      documentChatReadiness = 'unavailable';
      documentChatReadinessReason = 'not_configured';
    }

    return {
      preferred,
      effective,
      customerEffective,
      documentChatUiEnabled: true,
      documentChatAvailable,
      documentChatReadiness,
      documentChatReadinessReason,
      documentChatOllamaModel: catalog.meta.ollamaModel,
      documentChatRunsOnCpu: catalog.meta.runsOnCpu,
    };
  }
}
