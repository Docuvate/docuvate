// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { UserPreferencesEntity } from '../../../shared/domain/ports.js';
import type { UserSettingsResponseDto } from '../../../shared/presentation/dtos/settings.dto.js';
import type { EffectiveChatProviderResult } from './effective-document-chat-provider.use-case.js';

export function toUserSettingsResponseDto(
  row: UserPreferencesEntity,
  resolved: EffectiveChatProviderResult
): UserSettingsResponseDto {
  return {
    preferredExtractorEngine: row.preferredExtractorEngine,
    preferredChatProvider: row.preferredChatProvider,
    effectiveChatProvider: resolved.effective,
    customerChatProvider: resolved.customerEffective,
    documentChatUiEnabled: resolved.documentChatUiEnabled,
    documentChatAvailable: resolved.documentChatAvailable,
    documentChatReadiness: resolved.documentChatReadiness,
    documentChatReadinessReason: resolved.documentChatReadinessReason,
    documentChatOllamaModel: resolved.documentChatOllamaModel,
    documentChatRunsOnCpu: resolved.documentChatRunsOnCpu,
    documentChatLocalModelEnabled: resolved.documentChatLocalModelEnabled,
    documentChatLocalModelReady: resolved.documentChatLocalModelReady,
    advancedFeaturesEnabled: row.advancedFeaturesEnabled,
    fuzzyDuplicateDetectionEnabled: row.fuzzyDuplicateDetectionEnabled,
    useArenaWinnerAsDefault: row.useArenaWinnerAsDefault,
    arenaWinnerEngine: row.arenaWinnerEngine,
    labelFieldConfidenceThreshold: row.labelFieldConfidenceThreshold,
    fieldExtractionConfidenceGateEnabled: row.fieldExtractionConfidenceGateEnabled,
    fieldExtractionRequiredLabelIds: row.fieldExtractionRequiredLabelIds,
    themePreference: row.themePreference,
    locale: row.locale,
    documentChatCloudBaseUrl: row.documentChatCloudBaseUrl,
    documentChatCloudApiKeyConfigured: Boolean(row.documentChatCloudApiKey),
  };
}
