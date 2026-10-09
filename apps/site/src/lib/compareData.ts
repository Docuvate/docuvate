import compareDe from '../generated/compare.de.json';
import type { SiteLocale } from './routes';

export type CompareCell = { text: string; sources: string };
export type CompareRow = {
  id: string;
  criterion: string;
  docuvate: CompareCell;
  other: CompareCell;
};

export type ComparePageData = {
  slug: string;
  competitorName: string;
  title: string;
  lead: string;
  audience: string;
  rows: CompareRow[];
  competitorStrengths: string[];
  docuvateStrengths: string[];
  chooseThem: string;
  chooseUs: string;
  migration: string;
};

export type CompareDataset = {
  stand: string;
  legend: string;
  rubric: { id: string; title: string; description: string }[];
  overviewRows: {
    id: string;
    criterion: string;
    cells: Record<string, CompareCell>;
  }[];
  competitors: { slug: string; name: string }[];
  pages: ComparePageData[];
};

const dataset = compareDe as CompareDataset;

export function compareDataset(_locale: SiteLocale): CompareDataset {
  return dataset;
}

export function comparePageBySlug(slug: string): ComparePageData | undefined {
  return dataset.pages.find((p) => p.slug === slug);
}

export function comparisonsBasePath(locale: SiteLocale): string {
  return locale === 'de' ? '/docs/vergleiche' : '/docs/comparisons';
}
