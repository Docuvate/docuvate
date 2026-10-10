// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentChatProviderInfo,
  DocumentChatProvidersCatalogDto,
  ExtractionEngineInfo,
  UserSettingsDto,
} from '@docuvate/contracts';
import { Ban, Cable, FlaskConical, MessageSquareText, ScanText, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { useToast } from '../components/save/ToastProvider';
import { SettingsCallout } from '../components/settings/SettingsCallout';
import { SettingsCardLink } from '../components/settings/SettingsCardLink';
import { SettingsChatStatus } from '../components/settings/SettingsChatStatus';
import { SettingsSectionCard } from '../components/settings/SettingsSectionCard';
import { SettingsSectionLayout } from '../components/settings/SettingsSectionLayout';
import { Button } from '../components/ui/Button';
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
import { authClient } from '../lib/auth-client';
import { performSignOut } from '../lib/authSignOut';
import { chatProviderLabel } from '../lib/chatProviderLabels';
import { extractionEngineDescription } from '../lib/extractionEngineI18n';
import { readLocationStateBoolean } from '../lib/routerLocationState';
import { routes } from '../lib/routes';
import { settingsChatStatusPresentation } from '../lib/settingsChatStatus';
import {
  buildExtractionEngineSelectOptions,
  shouldShowExtractionOfflineCallout,
} from '../lib/settingsExtractionEngines';

const SETTINGS_ICON_SIZE = 20;
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
  const [settings, setSettings] = useState<UserSettingsDto | null>(null);
  const [engines, setEngines] = useState<ExtractionEngineInfo[]>([]);
  const [enginesLoadFailed, setEnginesLoadFailed] = useState(false);
  const [chatCatalog, setChatCatalog] = useState<DocumentChatProvidersCatalogDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [blockedLabelCount, setBlockedLabelCount] = useState<number | null>(null);

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
        : 'default';
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
  const engineOptions = buildExtractionEngineSelectOptions(t, engines);

  return (
    <SettingsSectionLayout>
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
            </SettingsCallout>
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
          icon={<FlaskConical {...settingsIconProps} />}
          title={t('settings.advancedFeaturesTitle')}
          description={t('settings.advancedFeaturesLead')}
        >
          <Switch
            label={t('settings.advancedFeaturesEnable')}
            checked={advancedFeaturesEnabled}
            disabled={saving || !settings}
            onCheckedChange={(checked) => void toggleAdvancedFeatures(checked)}
          />
        </SettingsSectionCard>

        <SettingsSectionCard
          compact
          id="settings-document-chat"
          icon={<MessageSquareText {...settingsIconProps} />}
          title={t('settings.chatTitle')}
          description={t('settings.chatLeadShort')}
        >
          <SettingsChatStatus status={chatStatus} />
          {showProviderSelect ? (
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
        </SettingsSectionCard>

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
                {data?.user.email ?? t('settings.accountLeadFallback')}
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
