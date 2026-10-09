// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ApiReferencePanel } from '../components/ApiReferencePanel';
import { ClientOnly } from '../components/ClientOnly';
import { useLocale } from '../context/LocaleContext';
import { RichText } from '../lib/richText';

export function DocsApiPage() {
  const { content } = useLocale();
  return (
    <div className="docs-api-full">
      <div className="site-container docs-api-intro">
        <header className="docs-page-header">
          <h1 className="docs-page-title">{content.nav.api}</h1>
          <p className="docs-page-lead">
            <RichText text={content.apiPage.lead} />
          </p>
        </header>
      </div>
      <ClientOnly fallback={<div className="scalar-embed-loading">…</div>}>
        <ApiReferencePanel />
      </ClientOnly>
    </div>
  );
}
