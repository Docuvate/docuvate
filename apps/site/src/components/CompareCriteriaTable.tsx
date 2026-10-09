import type { CompareRow } from '../lib/compareData';
import { useLocale } from '../context/LocaleContext';
import { CompareSourceText } from './CompareSourceText';

type CompareCriteriaTableProps = {
  legend: string;
  docuvateLabel: string;
  otherLabel: string;
  rows: CompareRow[];
};

export function CompareCriteriaTable({ legend, docuvateLabel, otherLabel, rows }: CompareCriteriaTableProps) {
  const { locale } = useLocale();
  const criterionHeader = locale === 'de' ? 'Kriterium' : 'Criterion';

  return (
    <div className="compare-table-block">
      <p className="compare-legend">{legend}</p>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{criterionHeader}</th>
              <th scope="col">{docuvateLabel}</th>
              <th scope="col">{otherLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.id}</th>
                <td>{row.criterion}</td>
                <td>
                  <CompareSourceText text={row.docuvate.text} sources={row.docuvate.sources} />
                </td>
                <td>
                  <CompareSourceText text={row.other.text} sources={row.other.sources} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
