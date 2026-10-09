import compareDe from '../generated/compare.de.json';
import type { SiteLocale } from './routes';

export type CompareSource = { id: string; label: string; url: string };

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
  sources: Record<string, CompareSource>;
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

export function compareSourceById(id: string): CompareSource | undefined {
  return dataset.sources[id];
}

export function comparisonsRootPath(locale: SiteLocale): string {
  return locale === 'de' ? '/docs/vergleiche' : '/docs/comparisons';
}

export function comparisonsDetailPath(locale: SiteLocale, slug: string): string {
  return `${comparisonsRootPath(locale)}/${slug}`;
}

/** Methodology hub (replaces the former matrix overview page). */
export function comparisonsHubPath(locale: SiteLocale): string {
  return locale === 'de' ? '/docs/vergleiche/methodik' : '/docs/comparisons/methodology';
}
