// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

import oauthSetupMarkdownDe from '../../../../docs/connectors-oauth-setup.de.md?raw';
import oauthSetupMarkdownEn from '../../../../docs/connectors-oauth-setup.md?raw';

export function ConnectorsOAuthSetupDocPage() {
  const { t, i18n } = useTranslation();
  const oauthSetupMarkdown = i18n.language.startsWith('de')
    ? oauthSetupMarkdownDe
    : oauthSetupMarkdownEn;

  return (
    <div className="page docs-page">
      <header className="page-header">
        <div>
          <h1>{t('connectors.oauthSetupDocPageTitle')}</h1>
          <p className="muted">{t('connectors.oauthSetupDocPageLead')}</p>
        </div>
      </header>
      <article className="docs-markdown prose">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => {
              if (href === './connectors.md' || href?.endsWith('/connectors.md')) {
                return <span>{t('connectors.md')}</span>;
              }
              return <a href={href}>{children}</a>;
            },
          }}
        >
          {oauthSetupMarkdown}
        </ReactMarkdown>
      </article>
    </div>
  );
}
