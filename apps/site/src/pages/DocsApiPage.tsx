import { ApiReferencePanel } from '../components/ApiReferencePanel';
import { ClientOnly } from '../components/ClientOnly';
import { useLocale } from '../context/LocaleContext';
import { RichText } from '../lib/richText';

export function DocsApiPage() {
  const { content } = useLocale();
  return (
    <div className="docs-api-full">
      <div className="site-container docs-api-intro">
        <h1>{content.nav.api}</h1>
        <p className="section-lead">
          <RichText text={content.apiPage.lead} />
        </p>
      </div>
      <ClientOnly fallback={<div className="scalar-embed-loading">…</div>}>
        <ApiReferencePanel />
      </ClientOnly>
    </div>
  );
}
