import i18n from '../i18n';

const CHAT_PROVIDER_I18N: Record<string, string> = {
  'rag-ollama': 'settings.chatProviderIds.ragOllama',
  'donut-ml': 'settings.chatProviderIds.donut',
  context: 'settings.chatProviderIds.textExcerpts',
  ollama: 'settings.chatProviderIds.ollamaDev',
  mock: 'settings.chatProviderIds.mockDev',
  off: 'settings.chatProviderIds.off',
};

export function chatProviderLabel(providerId: string | null | undefined): string {
  if (!providerId) {
    return i18n.t('settings.chatProviderIds.unknown');
  }
  const key = CHAT_PROVIDER_I18N[providerId];
  if (key) {
    return i18n.t(key);
  }
  return providerId;
}
