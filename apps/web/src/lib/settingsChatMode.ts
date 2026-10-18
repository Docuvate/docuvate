// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatProviderInfo, UserSettingsDto } from '@docuvate/contracts';

export type SettingsChatMode = 'local' | 'cloud' | 'off';

export function resolveSettingsChatMode(
  settings: UserSettingsDto | null,
  selectable: DocumentChatProviderInfo[]
): SettingsChatMode {
  if (!settings) return 'local';
  if (settings.preferredChatProvider === 'off' || settings.customerChatProvider === 'off') {
    return 'off';
  }
  const cloudUrl = settings.documentChatCloudBaseUrl?.trim() ?? '';
  if (cloudUrl.length > 0) {
    return 'cloud';
  }
  const preferred = settings.preferredChatProvider;
  if (preferred && selectable.some((p) => p.id === preferred && p.id.includes('cloud'))) {
    return 'cloud';
  }
  return 'local';
}

export function patchForSettingsChatMode(
  mode: SettingsChatMode,
  selectable: DocumentChatProviderInfo[]
): {
  preferredChatProvider: string | null;
  documentChatCloudBaseUrl?: string | null;
} {
  if (mode === 'off') {
    return { preferredChatProvider: 'off' };
  }
  if (mode === 'cloud') {
    const cloud = selectable.find((p) => p.id.includes('cloud') || p.id.includes('openai'));
    return {
      preferredChatProvider: cloud?.id ?? null,
    };
  }
  const rag = selectable.find((p) => p.id === 'rag-ollama');
  if (rag) {
    return { preferredChatProvider: rag.id };
  }
  if (selectable.length === 0) {
    return { preferredChatProvider: null };
  }
  return { preferredChatProvider: selectable[0].id };
}
