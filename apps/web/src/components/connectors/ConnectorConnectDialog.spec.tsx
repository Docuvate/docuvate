// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import type { ConnectorPluginCatalogEntryDto } from '@docuvate/contracts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { ConnectorConnectDialog } from './ConnectorConnectDialog';

vi.mock('../../lib/api', () => ({
  listFolders: vi.fn(() => Promise.resolve([])),
  listTags: vi.fn(() => Promise.resolve([])),
  previewConnectorSourceNodes: vi.fn(() => Promise.resolve([])),
  probeSftpFetchHostKey: vi.fn(),
}));

const sftpFetchPlugin: ConnectorPluginCatalogEntryDto = {
  id: 'sftp_fetch',
  categoryId: 'scanner_sftp',
  labelKey: 'connectors.plugins.sftpFetch.label',
  descriptionKey: 'connectors.plugins.sftpFetch.description',
  capabilities: ['source'],
  tier: 'oss',
  auth: {
    strategy: 'custom',
    fields: [
      { key: 'host', labelKey: 'connectors.auth.fields.host', type: 'text', required: true },
      { key: 'label_ids', labelKey: 'connectors.auth.fields.labelIds', type: 'text', required: false },
    ],
  },
};

const amazonS3Plugin: ConnectorPluginCatalogEntryDto = {
  id: 'amazon_s3',
  categoryId: 'storage',
  labelKey: 'connectors.plugins.amazonS3.label',
  descriptionKey: 'connectors.plugins.amazonS3.description',
  capabilities: ['source', 'sink'],
  tier: 'oss',
  auth: {
    strategy: 'custom',
    fields: [{ key: 'bucket', labelKey: 'connectors.auth.fields.bucket', type: 'text', required: true }],
  },
};


const homeAssistantPlugin: ConnectorPluginCatalogEntryDto = {
  id: 'home_assistant',
  categoryId: 'home_automation',
  labelKey: 'connectors.plugins.homeAssistant.label',
  descriptionKey: 'connectors.plugins.homeAssistant.description',
  capabilities: ['sink'],
  tier: 'oss',
  auth: {
    strategy: 'custom',
    fields: [
      {
        key: 'base_url',
        labelKey: 'connectors.auth.fields.baseUrl',
        type: 'url',
        required: true,
        helpKey: 'connectors.plugins.homeAssistant.baseUrlHelp',
      },
      {
        key: 'access_token',
        labelKey: 'connectors.auth.fields.accessToken',
        type: 'password',
        required: true,
        secret: true,
        helpKey: 'connectors.plugins.homeAssistant.accessTokenHelp',
      },
    ],
  },
};

function renderDialog(plugin: ConnectorPluginCatalogEntryDto) {
  return render(
    <ConnectorConnectDialog open plugin={plugin} onSubmit={vi.fn()} onCancel={vi.fn()} />
  );
}

describe('ConnectorConnectDialog', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  beforeEach(() => {
    void i18n.changeLanguage('en');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the SFTP fetch form on first open without crashing', () => {
    renderDialog(sftpFetchPlugin);
    expect(screen.getByText('Connect Fetch from SFTP server')).toBeTruthy();
    expect(screen.getByLabelText('Display name')).toBeTruthy();
  });

  it('renders the Amazon S3 form on first open without crashing', () => {
    renderDialog(amazonS3Plugin);
    expect(screen.getByText('Connect Amazon S3')).toBeTruthy();
  });

  it('switches from another plugin to SFTP fetch without crashing', () => {
    const view = renderDialog(amazonS3Plugin);
    view.rerender(
      <ConnectorConnectDialog open plugin={sftpFetchPlugin} onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Connect Fetch from SFTP server')).toBeTruthy();
  });

  it('keeps Home Assistant help text out of the access-token accessible name', () => {
    renderDialog(homeAssistantPlugin);
    expect(screen.getByLabelText('Access token')).toBeTruthy();
    expect(screen.getByText(/Long-lived access token from your HA user profile/i)).toBeTruthy();
    // Help must not be glued into the label name
    expect(screen.queryByLabelText(/Long-lived access token from your HA/i)).toBeNull();
  });

  it('shows an inline invalid-URL error and does not submit for Home Assistant', () => {
    const onSubmit = vi.fn();
    render(
      <ConnectorConnectDialog
        open
        plugin={homeAssistantPlugin}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText('Instance URL'), {
      target: { value: 'not-a-url' },
    });
    fireEvent.change(screen.getByLabelText('Access token'), {
      target: { value: 'token' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save connection' }));
    expect(
      screen.getByText(/Enter a valid Home Assistant URL/i)
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders submitError inside the dialog', () => {
    render(
      <ConnectorConnectDialog
        open
        plugin={homeAssistantPlugin}
        submitError="Home Assistant instance unreachable."
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByTestId('connector-connect-submit-error').textContent).toContain(
      'unreachable'
    );
  });
});
