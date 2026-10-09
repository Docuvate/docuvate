import { compareDataset } from '../lib/compareData';
import { useLocale } from '../context/LocaleContext';
import { DocsHeading } from './DocsHeading';

type CompareReferencesListProps = {
  sourceIds: string[];
};

export function CompareReferencesList({ sourceIds }: CompareReferencesListProps) {
  const { locale } = useLocale();
  const data = compareDataset(locale);
  const unique = [...new Set(sourceIds)].sort((a, b) => a.localeCompare(b, 'en'));
  const entries = unique
    .map((id) => data.sources[id])
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry?.url));

  if (entries.length === 0) return null;

  return (
    <section className="compare-references" aria-labelledby="compare-references-heading">
      <DocsHeading as="h2" id="compare-references-heading">
        {locale === 'de' ? 'Quellen' : 'References'}
      </DocsHeading>
      <ol className="compare-references-list">
        {entries.map((entry) => (
          <li key={entry.id} id={`compare-ref-${entry.id}`}>
            <strong>[{entry.id}]</strong>{' '}
            <a href={entry.url} target="_blank" rel="noopener noreferrer">
              {entry.label}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
