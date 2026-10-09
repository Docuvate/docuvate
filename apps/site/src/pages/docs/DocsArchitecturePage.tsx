import { getDocsExtended } from '../../content/docsExtended';
import { useLocale } from '../../context/LocaleContext';
import { DocsGuidePageView } from '../DocsGuidePage';

export function DocsArchitecturePage() {
  const { locale } = useLocale();
  return <DocsGuidePageView page={getDocsExtended(locale).architecture} />;
}
