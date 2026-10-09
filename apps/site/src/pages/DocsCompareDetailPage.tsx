// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Link } from 'react-router-dom';
import { CompareCriteriaTable } from '../components/CompareCriteriaTable';
import { DocsPageLayout } from '../components/DocsPageLayout';
import { DocsHeading } from '../components/DocsHeading';
import { DocsPageHeader } from '../components/DocsPageHeader';
import { getDocsExtended } from '../content/docsExtended';
import { useLocale } from '../context/LocaleContext';
import { CompareReferencesList } from '../components/CompareReferencesList';
import { sourceIdsFromRows } from '../lib/compareSourceIds';
import { compareDataset, comparePageBySlug, comparisonsHubPath } from '../lib/compareData';

type DocsCompareDetailPageProps = {
  slug: string;
};

export function DocsCompareDetailPage({ slug }: DocsCompareDetailPageProps) {
  const { locale, localizePath } = useLocale();
  const ui = getDocsExtended(locale).comparisons;
  const data = compareDataset(locale);
  const page = comparePageBySlug(slug);

  if (!page) {
    return (
      <DocsPageLayout>
        <DocsPageHeader title={ui.overviewTitle} lead={ui.overviewLead} />
        <p>{locale === 'de' ? 'Vergleich nicht gefunden.' : 'Comparison not found.'}</p>
      </DocsPageLayout>
    );
  }

  return (
    <DocsPageLayout>
      <DocsPageHeader title={page.title} lead={page.lead} />
      <p className="compare-stand">
        {ui.standLabel}: {data.stand}
      </p>
      <div className="hero-actions docs-compare-actions">
        <Link className="btn btn-primary" to={localizePath('/docs#quickstart')}>
          {ui.selfHostCta}
        </Link>
        <Link className="btn btn-secondary" to={localizePath(comparisonsHubPath(locale))}>
          {ui.allLink}
        </Link>
      </div>
      <DocsHeading as="h2" id="kurzfazit">
        {locale === 'de' ? 'Kurzfazit' : 'Summary'}
      </DocsHeading>
      <p>
        <strong>{locale === 'de' ? 'Für wen:' : 'Audience:'}</strong> {page.audience}
      </p>
      <DocsHeading as="h2" id="kriterien">
        {locale === 'de' ? 'Vergleich nach Kriterien' : 'Comparison by criteria'}
      </DocsHeading>
      <CompareCriteriaTable
        legend={data.legend}
        docuvateLabel="Docuvate"
        otherLabel={page.competitorName}
        rows={page.rows}
      />
      <DocsHeading as="h2" id="competitor-strengths">
        {ui.competitorStrengthsTitle(page.competitorName)}
      </DocsHeading>
      <ul>
        {page.competitorStrengths.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <DocsHeading as="h2" id="docuvate-strengths">
        {ui.docuvateStrengthsTitle}
      </DocsHeading>
      <ul>
        {page.docuvateStrengths.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <DocsHeading as="h2" id="wahl">
        {ui.whenToChooseTitle}
      </DocsHeading>
      <ul>
        <li>
          <strong>{ui.chooseThemLabel(page.competitorName)}:</strong> {page.chooseThem}
        </li>
        <li>
          <strong>{ui.chooseUsLabel}:</strong> {page.chooseUs}
        </li>
      </ul>
      <DocsHeading as="h2" id="migration">
        {ui.migrationTitle}
      </DocsHeading>
      <p>{page.migration}</p>
      <CompareReferencesList sourceIds={sourceIdsFromRows(page.rows)} />
      <p>{ui.correctionNote}</p>
      <section className="docs-compare-cta-band" aria-labelledby="compare-cta-heading">
        <h2 id="compare-cta-heading" className="landing-section-title">
          {ui.testCtaHeading}
        </h2>
        <p>{ui.testCtaBody}</p>
        <Link className="btn btn-primary" to={localizePath('/docs#quickstart')}>
          {ui.selfHostCta}
        </Link>
      </section>
    </DocsPageLayout>
  );
}
