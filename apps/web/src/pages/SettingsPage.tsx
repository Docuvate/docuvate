// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentChatProviderInfo,
  DocumentChatProvidersCatalogDto,
  ExtractionEngineInfo,
  UserSettingsDto,
} from '@docuvate/contracts';
import { Ban, Cable, MessageSquareText, ScanText, SlidersHorizontal, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { PageFormSaveKit } from '../components/save/PageFormSaveKit';
import { useToast } from '../components/save/ToastProvider';
import { SettingsCallout } from '../components/settings/SettingsCallout';
import { SettingsCardLink } from '../components/settings/SettingsCardLink';
import { SettingsChatStatus } from '../components/settings/SettingsChatStatus';
import { SettingsSectionCard } from '../components/settings/SettingsSectionCard';
import { SettingsSectionLayout } from '../components/settings/SettingsSectionLayout';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { useAdvancedFeaturesEnabled, writeAdvancedFeaturesEnabled } from '../lib/advancedFeatures';
import {
  getDocumentChatProvidersCatalog,
  getUserSettings,
  listExtractionEngines,
  listLabelRecommendationBlocklist,
  updateUserSettings,
} from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { authClient, authSessionUserEmail } from '../lib/auth-client';
import { performSignOut } from '../lib/authSignOut';
import { chatProviderLabel } from '../lib/chatProviderLabels';
import { extractionEngineDescription } from '../lib/extractionEngineI18n';
import { readLocationStateBoolean } from '../lib/routerLocationState';
import { routes } from '../lib/routes';
import {
  patchForSettingsChatMode,
  resolveSettingsChatMode,
  type SettingsChatMode,
} from '../lib/settingsChatMode';
import { settingsChatStatusPresentation } from '../lib/settingsChatStatus';
import {
  buildExtractionEngineSelectOptions,
  shouldShowExtractionOfflineCallout,
} from '../lib/settingsExtractionEngines';

const SETTINGS_ICON_SIZE = 20;

function parseSimpleChatMode(value: string): SettingsChatMode {
  if (value === 'cloud' || value === 'off') {
    return value;
  }
  return 'local';
}
const settingsIconProps = {
  size: SETTINGS_ICON_SIZE,
  strokeWidth: 1.75,
  'aria-hidden': true as const,
};

export function SettingsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { advancedFeaturesEnabled, setAdvancedFeaturesEnabled } = useAdvancedFeaturesEnabled();
  const { data } = authClient.useSession();
  const accountEmail = authSessionUserEmail(data);
  const [settings, setSettings] = useState<UserSettingsDto | null>(null);
  const [engines, setEngines] = useState<ExtractionEngineInfo[]>([]);
  const [enginesLoadFailed, setEnginesLoadFailed] = useState(false);
  const [chatCatalog, setChatCatalog] = useState<DocumentChatProvidersCatalogDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [blockedLabelCount, setBlockedLabelCount] = useState<number | null>(null);
  const [chatCloudBaseUrl, setChatCloudBaseUrl] = useState('');
  const [chatCloudApiKeyDraft, setChatCloudApiKeyDraft] = useState('');

  useEffect(() => {
    if (readLocationStateBoolean(location.state, 'adminDenied')) {
      toast.error(t('admin.accessDeniedToast'));
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, t, toast]);

  useEffect(() => {
    void Promise.all([
      getUserSettings(),
      getDocumentChatProvidersCatalog(),
      listLabelRecommendationBlocklist(),
    ])
      .then(([s, chat, blocklist]) => {
        setSettings(s);
        setChatCloudBaseUrl(s.documentChatCloudBaseUrl ?? '');
        setChatCatalog(chat);
        setBlockedLabelCount(blocklist.items.length);
        writeAdvancedFeaturesEnabled(s.advancedFeaturesEnabled === true);
      })
      .catch((err: unknown) => {
        setError(formatUserFacingError(err, 'errors.settingsLoadFailed'));
      });

    void listExtractionEngines()
      .then((engineList) => {
        setEngines(engineList);
        setEnginesLoadFailed(false);
      })
      .catch(() => {
        setEngines([]);
        setEnginesLoadFailed(true);
      });
  }, []);

  async function saveChatCloudSettings(baseUrl: string, apiKey: string) {
    setSaving(true);
    setError(null);
    try {
      const patch: {
        documentChatCloudBaseUrl: string | null;
        documentChatCloudApiKey?: string | null;
      } = {
        documentChatCloudBaseUrl: baseUrl.trim().length > 0 ? baseUrl.trim() : null,
      };
      if (apiKey.trim().length > 0) {
        patch.documentChatCloudApiKey = apiKey.trim();
      }
      const updated = await updateUserSettings(patch);
      setSettings(updated);
      setChatCloudBaseUrl(updated.documentChatCloudBaseUrl ?? '');
      setChatCloudApiKeyDraft('');
      toast.success(t('save.saved'));
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.saveFailed');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function saveSimpleChatMode(mode: SettingsChatMode) {
    setSaving(true);
    setError(null);
    try {
      const patch = patchForSettingsChatMode(mode, selectable);
      const updated = await updateUserSettings(patch);
      setSettings(updated);
      toast.success();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.saveFailed');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function saveChatProvider(nextProvider: string) {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUserSettings({
        preferredChatProvider: nextProvider === 'default' ? null : nextProvider,
      });
      setSettings(updated);
      toast.success();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.saveFailed');
      setError(message);
      toast.error(message, () => void saveChatProvider(nextProvider));
    } finally {
      setSaving(false);
    }
  }

  async function saveEngine(nextEngine: string) {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUserSettings({ preferredExtractorEngine: nextEngine });
      setSettings(updated);
      toast.success();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.saveFailed');
      setError(message);
      toast.error(message, () => void saveEngine(nextEngine));
    } finally {
      setSaving(false);
    }
  }

  async function toggleArenaWinner(checked: boolean) {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUserSettings({ useArenaWinnerAsDefault: checked });
      setSettings(updated);
      toast.success();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.saveFailed');
      setError(message);
      toast.error(message, () => void toggleArenaWinner(checked));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAdvancedFeatures(checked: boolean) {
    setAdvancedFeaturesEnabled(checked);
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUserSettings({ advancedFeaturesEnabled: checked });
      setSettings(updated);
      writeAdvancedFeaturesEnabled(updated.advancedFeaturesEnabled === true);
      toast.success();
    } catch (err) {
      setAdvancedFeaturesEnabled(!checked);
      const message = formatUserFacingError(err, 'errors.saveFailed');
      setError(message);
      toast.error(message, () => void toggleAdvancedFeatures(checked));
    } finally {
      setSaving(false);
    }
  }

  const selectedEngine = settings?.preferredExtractorEngine ?? 'pipeline';
  const engineHelp = extractionEngineDescription(t, selectedEngine);
  const selectable = chatCatalog?.selectable ?? [];
  const preferredChat = settings?.preferredChatProvider;
  const selectedChat =
    preferredChat === 'off' || settings?.customerChatProvider === 'off'
      ? 'off'
      : preferredChat && preferredChat.length > 0
        ? preferredChat
        : selectable.length === 1
          ? selectable[0].id
          : selectable.length > 0
            ? 'default'
            : 'off';
  const showProviderSelect = chatCatalog !== null;
  const chatProviderOptions = [
    { value: 'off', label: chatProviderLabel('off') },
    ...(selectable.length > 1
      ? [{ value: 'default', label: t('settings.chatDefaultAutomatic') }]
      : []),
    ...selectable.map((provider: DocumentChatProviderInfo) => ({
      value: provider.id,
      label: chatProviderLabel(provider.id),
    })),
  ];
  const showExtractionOfflineCallout = shouldShowExtractionOfflineCallout(
    enginesLoadFailed,
    engines,
    selectedEngine
  );
  const chatStatus = settingsChatStatusPresentation(t, settings);
  const engineOptions =
    advancedFeaturesEnabled || engines.length === 0
      ? buildExtractionEngineSelectOptions(t, engines, { hideUnavailableSuffix: showExtractionOfflineCallout })
      : [{ value: 'pipeline', label: t('settings.engineDefaultAutomatic') }];

  const storedCloudBase = settings?.documentChatCloudBaseUrl ?? '';
  const cloudFormDirty =
    advancedFeaturesEnabled &&
    (chatCloudBaseUrl.trim() !== storedCloudBase.trim() || chatCloudApiKeyDraft.trim().length > 0);

  const simpleChatMode = resolveSettingsChatMode(settings, selectable);
  const simpleChatOptions = useMemo(
    () => [
      { value: 'local', label: t('settings.chatModeLocal') },
      { value: 'cloud', label: t('settings.chatModeCloud') },
      { value: 'off', label: t('settings.chatModeOff') },
    ],
    [t]
  );

  return (
    <SettingsSectionLayout
      headerAside={
        <Switch
          label={t('settings.advancedOptionsSwitch')}
          checked={advancedFeaturesEnabled}
          disabled={saving || !settings}
          onCheckedChange={(checked) => void toggleAdvancedFeatures(checked)}
        />
      }
    >
      <PageFormSaveKit
        dirty={cloudFormDirty}
        saving={saving}
        error={error}
        onSave={() => {
          void saveChatCloudSettings(chatCloudBaseUrl, chatCloudApiKeyDraft);
        }}
        onDiscard={() => {
          setChatCloudBaseUrl(storedCloudBase);
          setChatCloudApiKeyDraft('');
          setError(null);
        }}
      />
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="settings-grid">
        <SettingsSectionCard
          icon={<ScanText {...settingsIconProps} />}
          title={t('settings.extractionTitle')}
          description={t('settings.extractionLead')}
        >
          <label className="settings-field">
            {t('settings.engine')}
            <Select
              value={selectedEngine}
              disabled={saving || !settings}
              onChange={(value) => void saveEngine(value)}
              options={engineOptions}
              aria-label={t('settings.engineAria')}
            />
          </label>
          {engineHelp ? <p className="muted settings-hint">{engineHelp}</p> : null}
          {showExtractionOfflineCallout ? (
            <SettingsCallout variant="warn">
              <p>{t('settings.extractionOfflineCallout')}</p>
              <p className="muted settings-hint">{t('settings.extractionOfflineCalloutDetails')}</p>
            </SettingsCallout>
          ) : null}
          {advancedFeaturesEnabled ? (
            <p className="muted settings-hint">{t('settings.engineSavedImmediately')}</p>
          ) : null}
          {advancedFeaturesEnabled && settings?.arenaWinnerEngine ? (
            <label className="settings-check">
              <input
                type="checkbox"
                checked={settings.useArenaWinnerAsDefault}
                disabled={saving}
                onChange={(e) => void toggleArenaWinner(e.target.checked)}
              />
              {t('settings.arenaUseWinner')}
            </label>
          ) : advancedFeaturesEnabled ? (
            <p className="muted settings-hint">{t('settings.arenaNoWinner')}</p>
          ) : null}
        </SettingsSectionCard>

        <SettingsSectionCard
          compact
          id="settings-document-chat"
          icon={<MessageSquareText {...settingsIconProps} />}
          title={t('settings.chatTitle')}
          description={t('settings.chatLeadShort')}
        >
          <SettingsChatStatus status={chatStatus} />
          {!advancedFeaturesEnabled ? (
            <label className="settings-field">
              {t('settings.chatModeSimple')}
              <Select
                value={simpleChatMode}
                disabled={saving || !settings}
                onChange={(value) => {
                  void saveSimpleChatMode(parseSimpleChatMode(value));
                }}
                options={simpleChatOptions}
                aria-label={t('settings.chatModeSimpleAria')}
              />
            </label>
          ) : null}
          {advancedFeaturesEnabled && showProviderSelect ? (
            <label className="settings-field">
              {t('settings.chatProvider')}
              <Select
                value={selectedChat}
                disabled={saving || !settings}
                onChange={(value) => void saveChatProvider(value)}
                options={chatProviderOptions}
                aria-label={t('settings.chatProviderAria')}
              />
            </label>
          ) : null}
          {advancedFeaturesEnabled ? (
            <>
              <label className="settings-field">
                {t('settings.chatCloudBaseUrl')}
                <input
                  type="url"
                  className="settings-input"
                  disabled={saving || !settings}
                  value={chatCloudBaseUrl}
                  placeholder={t('settings.chatCloudBaseUrlPlaceholder')}
                  onChange={(e) => {
                    setChatCloudBaseUrl(e.target.value);
                  }}
                />
                {chatCloudBaseUrl.trim() !== storedCloudBase.trim() ? (
                  <p className="muted settings-field-changed">{t('settings.cloudChangedHint')}</p>
                ) : (
                  <p className="settings-hint-slot muted" aria-hidden="true">
                    {' '}
                  </p>
                )}
              </label>
              <label className="settings-field">
                {t('settings.chatCloudApiKey')}
                <PasswordInput
                  className="settings-input"
                  disabled={saving || !settings}
                  value={chatCloudApiKeyDraft}
                  placeholder={
                    settings?.documentChatCloudApiKeyConfigured
                      ? t('settings.chatCloudApiKeyConfigured')
                      : t('settings.chatCloudApiKeyPlaceholder')
                  }
                  onChange={(e) => {
                    setChatCloudApiKeyDraft(e.target.value);
                  }}
                />
                <p className="settings-hint-slot muted">{t('settings.chatCloudHint')}</p>
              </label>
            </>
          ) : null}
        </SettingsSectionCard>

        <SettingsSectionCard
          icon={<SlidersHorizontal {...settingsIconProps} />}
          title={t('settings.suggestionsCardTitle')}
          description={t('settings.suggestionsCardLead')}
          footer={
            <div className="settings-section-card-footer">
              <SettingsCardLink to={routes.structureRecognizedFields}>
                {t('settings.suggestionsCardCta')}
              </SettingsCardLink>
            </div>
          }
        />

        <SettingsSectionCard
          icon={<Cable {...settingsIconProps} />}
          title={t('settings.connectorsLinkTitle')}
          description={t('settings.connectorsLinkLead')}
          footer={
            <div className="settings-section-card-footer">
              <SettingsCardLink to={routes.settingsConnectors}>
                {t('settings.connectorsLinkCta')}
              </SettingsCardLink>
            </div>
          }
        />

        <SettingsSectionCard
          icon={<Ban {...settingsIconProps} />}
          title={t('settings.blockedLabels.linkTitle')}
          description={t('settings.blockedLabels.linkLead')}
          footer={
            <div className="settings-section-card-footer settings-section-card-footer--stack">
              {blockedLabelCount != null && blockedLabelCount > 0 ? (
                <p className="settings-card-count muted">
                  {t('settings.blockedLabels.linkCountLine', { count: blockedLabelCount })}
                </p>
              ) : null}
              <SettingsCardLink to={routes.settingsBlockedLabels}>
                {t('settings.blockedLabels.linkCta')}
              </SettingsCardLink>
            </div>
          }
        />

        <SettingsSectionCard
          id="settings-account"
          className="settings-section-card--full"
          icon={<UserRound {...settingsIconProps} />}
          title={t('settings.accountTitle')}
          description={t('settings.accountLeadFallback')}
          footer={
            <div className="settings-section-card-footer settings-section-card-footer--stack">
              <p className="settings-account-email">
                {accountEmail ?? t('settings.accountLeadFallback')}
              </p>
              <SettingsCardLink to={routes.settingsAccountSecurity}>
                {t('settings.accountSecurity.linkCta')}
              </SettingsCardLink>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void performSignOut();
                }}
              >
                {t('shell.signOut')}
              </Button>
            </div>
          }
        />
      </div>
    </SettingsSectionLayout>
  );
}
