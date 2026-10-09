import { getDocsExtended } from '../../content/docsExtended';
import { useLocale } from '../../context/LocaleContext';
import { DocsGuidePageView } from '../DocsGuidePage';

export function DocsModelsPage() {
  const { locale } = useLocale();
  return <DocsGuidePageView page={getDocsExtended(locale).models} />;
}
