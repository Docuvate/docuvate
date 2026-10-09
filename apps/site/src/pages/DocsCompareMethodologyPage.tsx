// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Link } from 'react-router-dom';
import { CompareReferencesList } from '../components/CompareReferencesList';
import { DocsPageLayout } from '../components/DocsPageLayout';
import { DocsHeading } from '../components/DocsHeading';
import { DocsPageHeader } from '../components/DocsPageHeader';
import { getDocsExtended } from '../content/docsExtended';
import { useLocale } from '../context/LocaleContext';
import { compareDataset, comparisonsDetailPath } from '../lib/compareData';

export function DocsCompareMethodologyPage() {
  const { locale, localizePath } = useLocale();
  const ui = getDocsExtended(locale).comparisons;
  const data = compareDataset(locale);
  const allSourceIds = Object.keys(data.sources);

  return (
    <DocsPageLayout>
      <DocsPageHeader title={ui.methodologyTitle} lead={ui.overviewLead} />
      <p className="compare-stand">
        {ui.standLabel}: {data.stand}
      </p>
      <DocsHeading as="h2" id="einzelvergleiche">
        {locale === 'de' ? 'Einzelvergleiche' : 'Individual comparisons'}
      </DocsHeading>
      <ul className="compare-link-list">
        {data.competitors.map((c) => (
          <li key={c.slug}>
            <Link to={localizePath(comparisonsDetailPath(locale, c.slug))}>
              Docuvate vs. {c.name}
            </Link>
          </li>
        ))}
      </ul>
      <DocsHeading as="h2" id="kriterien">
        {locale === 'de' ? 'Kriterien' : 'Criteria'}
      </DocsHeading>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{locale === 'de' ? 'Kriterium' : 'Criterion'}</th>
              <th scope="col">{locale === 'de' ? 'Was wird bewertet' : 'What is assessed'}</th>
            </tr>
          </thead>
          <tbody>
            {data.rubric.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.id}</th>
                <td>{row.title}</td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DocsHeading as="h2" id="skala">
        {locale === 'de' ? 'Bewertungsskala' : 'Rating scale'}
      </DocsHeading>
      <p>{data.legend}</p>
      <p>
        {locale === 'de'
          ? 'K1 bis K5 sind beschreibend (ohne Symbol). Kriterien werden auf allen Vergleichsseiten in derselben Reihenfolge geführt.'
          : 'K1 to K5 are descriptive (no symbol). Criteria appear in the same order on every comparison page.'}
      </p>
      <CompareReferencesList sourceIds={allSourceIds} />
    </DocsPageLayout>
  );
}
