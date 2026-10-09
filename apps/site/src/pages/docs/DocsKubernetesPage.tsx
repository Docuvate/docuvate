import { getDocsExtended } from '../../content/docsExtended';
import { useLocale } from '../../context/LocaleContext';
import { DocsGuidePageView } from '../DocsGuidePage';

export function DocsKubernetesPage() {
  const { locale } = useLocale();
  return <DocsGuidePageView page={getDocsExtended(locale).kubernetes} />;
}
