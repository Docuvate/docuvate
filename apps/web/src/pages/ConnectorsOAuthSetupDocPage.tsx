// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

import oauthSetupMarkdown from '../../../../docs/connectors-oauth-setup.md?raw';

export function ConnectorsOAuthSetupDocPage() {
  const { t } = useTranslation();

  return (
    <div className="page docs-page">
      <header className="page-header">
        <div>
          <h1>{t('connectors.oauthSetupDocPageTitle')}</h1>
          <p className="muted">{t('connectors.oauthSetupDocPageLead')}</p>
        </div>
      </header>
      <article className="docs-markdown prose">
        <ReactMarkdown>{oauthSetupMarkdown}</ReactMarkdown>
      </article>
    </div>
  );
}
