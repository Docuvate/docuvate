import { Link } from 'react-router-dom';
import { CompareOverviewMatrix } from '../components/CompareOverviewMatrix';
import { DocsPageLayout } from '../components/DocsPageLayout';
import { DocsHeading } from '../components/DocsHeading';
import { DocsPageHeader } from '../components/DocsPageHeader';
import { getDocsExtended } from '../content/docsExtended';
import { useLocale } from '../context/LocaleContext';
import { compareDataset } from '../lib/compareData';
import { comparisonsBasePath } from '../lib/compareData';

export function DocsCompareOverviewPage() {
  const { locale, localizePath } = useLocale();
  const copy = getDocsExtended(locale).comparisons;
  const data = compareDataset(locale);

  const toolOrder = ['docuvate', ...data.competitors.map((c) => c.slug)];
  const toolNames: Record<string, string> = { docuvate: 'Docuvate' };
  for (const c of data.competitors) {
    toolNames[c.slug] = c.name;
  }

  return (
    <DocsPageLayout>
      <DocsPageHeader title={copy.overviewTitle} lead={copy.overviewLead} />
      <DocsHeading as="h2" id="einzelvergleiche">
        {locale === 'de' ? 'Einzelvergleiche' : 'Individual comparisons'}
      </DocsHeading>
      <ul className="compare-link-list">
        {data.competitors.map((c) => (
          <li key={c.slug}>
            <Link to={localizePath(`${comparisonsBasePath(locale)}/${c.slug}`)}>Docuvate vs. {c.name}</Link>
          </li>
        ))}
      </ul>
      <DocsHeading as="h2" id="matrix">
        {locale === 'de' ? 'Übersichtsmatrix' : 'Overview matrix'}
      </DocsHeading>
      <CompareOverviewMatrix legend={data.legend} toolNames={toolNames} toolOrder={toolOrder} rows={data.overviewRows} />
      <p className="compare-stand">
        {copy.standLabel}: {data.stand}
      </p>
      <p>
        <Link
          to={localizePath(
            `${comparisonsBasePath(locale)}/${locale === 'de' ? 'methodik' : 'methodology'}`,
          )}
        >
          {copy.methodologyTitle}
        </Link>
      </p>
    </DocsPageLayout>
  );
}
