import type { TFunction } from 'i18next';
import type { UserSettingsDto } from '@docuvate/contracts';

const CUSTOMER_REASON_PREFIX = 'settings.chatUnavailableReason.';

export type SettingsChatStatusVariant = 'success' | 'info' | 'plain';

export type SettingsChatStatusPresentation = {
  variant: SettingsChatStatusVariant;
  message: string;
};

function resolveChatStatusMessage(
  t: TFunction,
  settings: Pick<
    UserSettingsDto,
    'customerChatProvider' | 'documentChatReadiness' | 'documentChatReadinessReason'
  > | null
): string {
  const customerChat = settings?.customerChatProvider ?? 'off';
  if (customerChat === 'off') {
    return t('settings.chatStatusOff');
  }

  const readiness = settings?.documentChatReadiness ?? 'unavailable';
  switch (readiness) {
    case 'ready':
      return t('settings.chatStatusReady');
    case 'starting':
      return t('settings.chatStatusStarting');
    case 'unavailable': {
      const code = settings?.documentChatReadinessReason?.trim();
      if (code) {
        const key = `${CUSTOMER_REASON_PREFIX}${code}`;
        if (t(key) !== key) {
          return t(key);
        }
      }
      return t('settings.chatStatusUnavailable');
    }
    case 'off':
      return t('settings.chatStatusOff');
    default: {
      const _exhaustive: never = readiness;
      return _exhaustive;
    }
  }
}

export function settingsChatStatusPresentation(
  t: TFunction,
  settings: Pick<
    UserSettingsDto,
    'customerChatProvider' | 'documentChatReadiness' | 'documentChatReadinessReason'
  > | null
): SettingsChatStatusPresentation {
  const message = resolveChatStatusMessage(t, settings);
  const customerChat = settings?.customerChatProvider ?? 'off';
  if (customerChat === 'off') {
    return { variant: 'plain', message };
  }

  const readiness = settings?.documentChatReadiness ?? 'unavailable';
  switch (readiness) {
    case 'ready':
      return { variant: 'success', message };
    case 'starting':
    case 'unavailable':
      return { variant: 'info', message };
    case 'off':
      return { variant: 'plain', message };
    default: {
      const _exhaustive: never = readiness;
      return _exhaustive;
    }
  }
}

export function settingsChatStatusMessage(
  t: TFunction,
  settings: Pick<
    UserSettingsDto,
    'customerChatProvider' | 'documentChatReadiness' | 'documentChatReadinessReason'
  > | null
): string {
  return settingsChatStatusPresentation(t, settings).message;
}
